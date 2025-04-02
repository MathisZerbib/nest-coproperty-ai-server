import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Messages } from '../../entity/messages.entity';
import { Conversation } from '../../entity/conversation.entity';
import axios from 'axios';

@Injectable()
export class MessagesService {
  private readonly LM_STUDIO_URL =
    process.env.LM_STUDIO_URL || 'http://localhost:8000/api/v1/generate';
  private readonly HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Messages)
    private readonly messagesRepository: Repository<Messages>,
  ) {}

  /**
   * Get a conversation by its ID, including related messages.
   */
  async getConversationById(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['messages'], // Ensure this matches the relationship name in the Conversation entity
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  /**
   * Create a new message in a conversation.
   */
  async createMessage(message: Partial<Messages>): Promise<Messages> {
    const newMessage = this.messagesRepository.create(message);
    return this.messagesRepository.save(newMessage);
  }

  /**
   * Generate embeddings for a given text using Hugging Face API.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        console.log('Generating embedding for text:', text);
        console.log(
          'Hugging Face API Key:',
          this.HUGGINGFACE_API_KEY ? 'Provided' : 'Not provided',
        );
        console.log('LM Studio URL:', this.LM_STUDIO_URL);
        const response = await axios.post(
          'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
          { inputs: text },
          {
            headers: {
              Authorization: `Bearer ${this.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        if (!Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('Empty embedding response');
        }

        return response.data.map((value: any) => {
          if (typeof value !== 'number') {
            throw new Error('Embedding response contains non-numeric values');
          }
          return value;
        });
      } catch (error: unknown) {
        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 503 || error.response?.status === 429)
        ) {
          const waitTime = Math.pow(2, retries) * 2000; // Exponential backoff
          console.warn(`Retrying after ${waitTime / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          retries++;
        } else {
          console.error(
            `Attempt ${retries + 1} failed:`,
            error instanceof Error ? error.message : String(error),
          );
          if (retries === maxRetries - 1) {
            throw new Error(
              `Embedding failed after ${maxRetries} attempts: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
          retries++;
        }
      }
    }

    throw new Error('Failed to generate embedding after maximum retries');
  }

  /**
   * Build the RAG (Retrieval-Augmented Generation) prompt.
   */
  buildRAGPrompt(context: string, question: string): string {
    return `[INST] 
    Vous êtes un assistant AI utile qui fournit des informations précises en français.
    Contexte: ${context}
    
    Question: ${question}
    
    Exigences:
    - Répondez exclusivement en français
    - Soyez concis (1-2 phrases maximum)
    - Ne fournissez que des informations pertinentes
    - Structurez votre réponse comme une phrase complète
    - N'incluez aucun code, markdown ou séparateurs comme \`\`\`
    [/INST]
    
    Réponse:`;
  }

  /**
   * Clean the LLM response to remove unwanted content.
   */
  cleanLLMResponse(response: string): string {
    response = response.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
    response = response.replace(/\[INST\][\s\S]*?\[\/INST\]/g, ''); // Remove markdown
    response = response.replace(/\\n\s*\[\/INST\]/g, ''); // Remove escaped newlines
    response = response.replace(/\n\s*\[\/INST\]/g, ''); // Remove actual newlines
    response = response.replace(/\\n/g, ' '); // Replace escaped newlines with spaces
    response = response.replace(/\s+/g, ' '); // Normalize multiple spaces
    return response.trim();
  }

  /**
   * Query the local LLM (e.g., LMStudio) with a given prompt.
   */
  async queryLocalLLM(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.LM_STUDIO_URL,
        {
          prompt,
          max_length: 200,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Raw response from LLM:', response.data); // Log the raw response

      const responseData = response.data as {
        choices?: { text?: string }[];
      };

      if (
        !responseData ||
        !responseData.choices ||
        responseData.choices.length === 0
      ) {
        throw new Error('Invalid response from LLM: Missing choices');
      }

      const generatedText = responseData.choices[0]?.text;
      if (typeof generatedText !== 'string') {
        throw new Error('Invalid response: text is not a string');
      }

      return generatedText.trim();
    } catch (error: any) {
      if (error instanceof Error) {
        console.error('Error querying LLM:', error.message);
      } else {
        console.error('Error querying LLM:', error);
      }
      throw new Error('Failed to query the local LLM');
    }
  }

  /**
   * Ask a question to the assistant, save the user's question and the assistant's response.
   */
  async askQuestion(
    conversationId: string,
    userId: string,
    question: string,
  ): Promise<{ userMessage: Messages; assistantMessage: Messages }> {
    // Retrieve the conversation
    const conversation = await this.getConversationById(conversationId);

    // Generate query embedding (removed unused variable)
    await this.generateEmbedding(question);

    // Retrieve context (mocked for now, replace with Pinecone or other retriever)
    const context = 'Mocked context from retriever'; // Replace with actual retriever logic

    // Build the RAG prompt
    const prompt = this.buildRAGPrompt(context, question);

    // Query the local LLM
    const llmResponse = await this.queryLocalLLM(prompt);

    // Clean the LLM response
    const cleanedResponse = this.cleanLLMResponse(llmResponse);

    const sequenceNumber = conversation.messages.length + 1;

    // Save the user's question as a message
    const userMessage = await this.createMessage({
      conversation,
      content: question,
      role: 'user',
      userId,
      sequence_number: sequenceNumber,
    });

    // Save the LLM's response as a message
    const assistantMessage = await this.createMessage({
      conversation,
      content: cleanedResponse,
      role: 'assistant',
      userId: userId,
      sequence_number: sequenceNumber + 1,
    });

    // Return both messages
    return { userMessage, assistantMessage };
  }
}

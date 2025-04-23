import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Messages } from '../../entity/messages.entity';
import { Conversation } from '../../entity/conversation.entity';
import { PrivategptApiClient } from 'privategpt-sdk-node';
import fs from 'fs';

@Injectable()
export class MessagesService {
  private readonly privateGptClient = new PrivategptApiClient({
    environment: 'http://localhost:8001', // PrivateGPT API endpoint
  });

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
      relations: ['messages'],
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
   * Ingest a file using PrivateGPT.
   */
  async ingestFile(filePath: string): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const file = new File([buffer], filePath);
      const ingestedFile =
        await this.privateGptClient.ingestion.ingestFile(file);
      const ingestedFileDocId = ingestedFile.data[0].docId;
      console.log(
        `File ${filePath} successfully ingested with doc ID: ${ingestedFileDocId}`,
      );
      return ingestedFileDocId;
    } catch (error) {
      console.error('Error ingesting file:', error);
      throw new Error('Failed to ingest file');
    }
  }

  /**
   * Retrieve context using PrivateGPT.
   */
  async getContext(question: string, docIds?: string[]): Promise<string> {
    try {
      const response =
        await this.privateGptClient.contextualCompletions.promptCompletion(
          {
            prompt: question,
            useContext: true,
            contextFilter: docIds ? { docsIds: docIds } : undefined,
            includeSources: true,
          },
          { timeoutInSeconds: 10 },
        );
      console.log('Retrieved context:', response.choices[0]?.sources);
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error retrieving context:', error);
      throw new Error('Failed to retrieve context');
    }
  }

  /**
   * Build the RAG (Retrieval-Augmented Generation) prompt.
   */
  buildRAGPrompt(context: string, question: string): string {
    return `[INST]
Vous êtes un assistant IA francophone, précis et fiable.

Contexte : ${context}  
Question : ${question}  

Instructions :  
- Répondez uniquement en français  
- Soyez clair, direct et concis (1 à 2 phrases maximum)  
- Donnez uniquement des informations pertinentes et factuelles  
- Formulez toujours une phrase complète  
- N’utilisez ni code, ni markdown, ni séparateurs (\`\`\`)
- Ne mentionnez jamais que vous êtes une IA, un robot, un modèle ou un assistant  
- Ne répondez jamais par « Je ne sais pas » ou toute variation similaire  
- Aucune excuse, humour, commentaire personnel, politique, religieux ou offensant  
- Toujours rester neutre, respectueux et factuel  
[/INST]
    Réponse:`;
  }

  /**
   * Query the local LLM (Ollama) with a given prompt.
   */
  async queryLocalLLM(prompt: string): Promise<string> {
    try {
      const response =
        await this.privateGptClient.contextualCompletions.promptCompletion({
          prompt,
          includeSources: false,
        });

      if (!response || !response.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from LLM');
      }

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error querying LLM:', error);
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
    docIds?: string[],
  ): Promise<{ userMessage: Messages; assistantMessage: Messages }> {
    // Retrieve the conversation
    const conversation = await this.getConversationById(conversationId);

    // Retrieve context using PrivateGPT
    let context = '';
    try {
      context = await this.getContext(question, docIds);
    } catch (error) {
      console.error('Error retrieving context:', error);
    }

    // Build the RAG prompt
    const prompt = this.buildRAGPrompt(context, question);

    // Query the local LLM
    const llmResponse = await this.queryLocalLLM(prompt);

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
      content: llmResponse,
      role: 'assistant',
      userId: userId,
      sequence_number: sequenceNumber + 1,
    });

    // Return both messages
    return { userMessage, assistantMessage };
  }
}

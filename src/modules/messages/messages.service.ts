// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Messages } from '../../entity/messages.entity';
// import { Conversation } from '../../entity/conversation.entity';
// import axios from 'axios';
// import { PineconeService } from '../pinecone/pinecone.service';

// @Injectable()
// export class MessagesService {
//   private readonly LM_STUDIO_URL =
//     process.env.LM_STUDIO_URL || 'http://localhost:8000/api/v1/generate';
//   private readonly HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

//   constructor(
//     @InjectRepository(Conversation)
//     private readonly conversationRepository: Repository<Conversation>,
//     @InjectRepository(Messages)
//     private readonly messagesRepository: Repository<Messages>,
//     private readonly pineconeService: PineconeService, // ✅ Inject PineconeService
//   ) {}

//   /**
//    * Get a conversation by its ID, including related messages.
//    */
//   async getConversationById(id: string): Promise<Conversation> {
//     const conversation = await this.conversationRepository.findOne({
//       where: { id },
//       relations: ['messages'], // Ensure this matches the relationship name in the Conversation entity
//     });
//     if (!conversation) {
//       throw new NotFoundException('Conversation not found');
//     }
//     return conversation;
//   }

//   /**
//    * Create a new message in a conversation.
//    */
//   async createMessage(message: Partial<Messages>): Promise<Messages> {
//     const newMessage = this.messagesRepository.create(message);
//     return this.messagesRepository.save(newMessage);
//   }

//   /**
//    * Generate embeddings for a given text using Hugging Face API.
//    */
//   async generateEmbedding(text: string): Promise<number[]> {
//     const maxRetries = 3;
//     let retries = 0;

//     while (retries < maxRetries) {
//       try {
//         console.log('Generating embedding for text:', text);
//         console.log(
//           'Hugging Face API Key:',
//           this.HUGGINGFACE_API_KEY ? 'Provided' : 'Not provided',
//         );
//         console.log('LM Studio URL:', this.LM_STUDIO_URL);
//         const response = await axios.post(
//           'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
//           { inputs: text },
//           {
//             headers: {
//               Authorization: `Bearer ${this.HUGGINGFACE_API_KEY}`,
//               'Content-Type': 'application/json',
//             },
//             timeout: 10000,
//           },
//         );

//         if (!Array.isArray(response.data) || response.data.length === 0) {
//           throw new Error('Empty embedding response');
//         }

//         return response.data.map((value: any) => {
//           if (typeof value !== 'number') {
//             throw new Error('Embedding response contains non-numeric values');
//           }
//           return value;
//         });
//       } catch (error: unknown) {
//         if (
//           axios.isAxiosError(error) &&
//           (error.response?.status === 503 || error.response?.status === 429)
//         ) {
//           const waitTime = Math.pow(2, retries) * 2000; // Exponential backoff
//           console.warn(`Retrying after ${waitTime / 1000} seconds...`);
//           await new Promise((resolve) => setTimeout(resolve, waitTime));
//           retries++;
//         } else {
//           console.error(
//             `Attempt ${retries + 1} failed:`,
//             error instanceof Error ? error.message : String(error),
//           );
//           if (retries === maxRetries - 1) {
//             throw new Error(
//               `Embedding failed after ${maxRetries} attempts: ${
//                 error instanceof Error ? error.message : String(error)
//               }`,
//             );
//           }
//           retries++;
//         }
//       }
//     }

//     throw new Error('Failed to generate embedding after maximum retries');
//   }

//   /**
//    * Build the RAG (Retrieval-Augmented Generation) prompt.
//    */
//   buildRAGPrompt(context: string, question: string): string {
//     return `[INST]
// Vous êtes un assistant IA francophone, précis et fiable.

// Contexte : ${context}
// Question : ${question}

// Instructions :
// - Répondez uniquement en français
// - Soyez clair, direct et concis (1 à 2 phrases maximum)
// - Donnez uniquement des informations pertinentes et factuelles
// - Formulez toujours une phrase complète
// - N’utilisez ni code, ni markdown, ni séparateurs (\`\`\`)
// - Ne mentionnez jamais que vous êtes une IA, un robot, un modèle ou un assistant
// - Ne répondez jamais par « Je ne sais pas » ou toute variation similaire
// - Aucune excuse, humour, commentaire personnel, politique, religieux ou offensant
// - Toujours rester neutre, respectueux et factuel
// [/INST]
//     Réponse:`;
//   }

//   /**
//    * Clean the LLM response to remove unwanted content.
//    */
//   cleanLLMResponse(response: string): string {
//     response = response.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
//     response = response.replace(/\[INST\][\s\S]*?\[\/INST\]/g, ''); // Remove markdown
//     response = response.replace(/\\n\s*\[\/INST\]/g, ''); // Remove escaped newlines
//     response = response.replace(/\n\s*\[\/INST\]/g, ''); // Remove actual newlines
//     response = response.replace(/\\n/g, ' '); // Replace escaped newlines with spaces
//     response = response.replace(/\s+/g, ' '); // Normalize multiple spaces
//     response = response.replace('```', ''); // Remove any remaining code blocks
//     response = response.replace(/\[\/INST\]/g, ''); // Remove any remaining markdown
//     return response.trim();
//   }

//   /**
//    * Query the local LLM (e.g., LMStudio) with a given prompt.
//    */
//   async queryLocalLLM(prompt: string): Promise<string> {
//     try {
//       const response = await axios.post(
//         this.LM_STUDIO_URL,
//         {
//           prompt,
//           max_length: 200,
//           temperature: 0.7,
//           top_p: 0.9,
//           top_k: 50,
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         },
//       );

//       console.log('Raw response from LLM:', response.data); // Log the raw response

//       const responseData = response.data as {
//         choices?: { text?: string }[];
//       };

//       if (
//         !responseData ||
//         !responseData.choices ||
//         responseData.choices.length === 0
//       ) {
//         throw new Error('Invalid response from LLM: Missing choices');
//       }

//       const generatedText = responseData.choices[0]?.text;
//       if (typeof generatedText !== 'string') {
//         throw new Error('Invalid response: text is not a string');
//       }

//       return generatedText.trim();
//     } catch (error: any) {
//       if (error instanceof Error) {
//         console.error('Error querying LLM:', error.message);
//       } else {
//         console.error('Error querying LLM:', error);
//       }
//       throw new Error('Failed to query the local LLM');
//     }
//   }

//   /**
//    * Ask a question to the assistant, save the user's question and the assistant's response.
//    */
//   async askQuestion(
//     conversationId: string,
//     userId: string,
//     question: string,
//   ): Promise<{ userMessage: Messages; assistantMessage: Messages }> {
//     // Retrieve the conversation
//     const conversation = await this.getConversationById(conversationId);

//     // Generate query embedding
//     const queryEmbedding = await this.generateEmbedding(question);

//     // Retrieve context using Pinecone
//     let context = '';
//     try {
//       context = await this.pineconeService.getContext(queryEmbedding);
//       console.log('Retrieved context:', context);
//     } catch (error) {
//       console.error(
//         'Error retrieving context:',
//         error instanceof Error ? error.message : 'Unknown error',
//       );
//     }

//     // Build the RAG prompt
//     const prompt = this.buildRAGPrompt(context, question);

//     // Query the local LLM
//     const llmResponse = await this.queryLocalLLM(prompt);

//     // Clean the LLM response
//     const cleanedResponse = this.cleanLLMResponse(llmResponse);

//     const sequenceNumber = conversation.messages.length + 1;

//     // Save the user's question as a message
//     const userMessage = await this.createMessage({
//       conversation,
//       content: question,
//       role: 'user',
//       userId,
//       sequence_number: sequenceNumber,
//     });

//     // Save the LLM's response as a message
//     const assistantMessage = await this.createMessage({
//       conversation,
//       content: cleanedResponse,
//       role: 'assistant',
//       userId: userId,
//       sequence_number: sequenceNumber + 1,
//     });

//     // Return both messages
//     return { userMessage, assistantMessage };
//   }
// }
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
        await this.privateGptClient.contextualCompletions.promptCompletion({
          prompt: question,
          useContext: true,
          contextFilter: docIds ? { docsIds: docIds } : undefined,
          includeSources: true,
        });
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

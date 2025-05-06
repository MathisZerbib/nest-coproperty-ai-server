// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Messages } from '../../entities/messages.entity';
// import { Conversation } from '../../entities/conversation.entity';
// import { PrivategptApiClient } from 'privategpt-sdk-node';
// import fs from 'fs';

// @Injectable()
// export class MessagesService {
//   private readonly privateGptClient = new PrivategptApiClient({
//     environment: 'http://localhost:8001', // PrivateGPT API endpoint
//   });

//   constructor(
//     @InjectRepository(Conversation)
//     private readonly conversationRepository: Repository<Conversation>,
//     @InjectRepository(Messages)
//     private readonly messagesRepository: Repository<Messages>,
//   ) {}

//   /**
//    * Get a conversation by its ID, including related messages.
//    */
//   async getConversationById(id: string): Promise<Conversation> {
//     const conversation = await this.conversationRepository.findOne({
//       where: { id },
//       relations: ['messages'],
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
//    * Ingest a file using PrivateGPT.
//    */
//   async ingestFile(filePath: string): Promise<string> {
//     try {
//       const buffer = fs.readFileSync(filePath);
//       const file = new File([buffer], filePath);
//       const ingestedFile =
//         await this.privateGptClient.ingestion.ingestFile(file);
//       const ingestedFileDocId = ingestedFile.data[0].docId;
//       console.log(
//         `File ${filePath} successfully ingested with doc ID: ${ingestedFileDocId}`,
//       );
//       return ingestedFileDocId;
//     } catch (error) {
//       console.error('Error ingesting file:', error);
//       throw new Error('Failed to ingest file');
//     }
//   }

//   /**
//    * Retrieve context using PrivateGPT.
//    */
//   async getContext(question: string, docIds?: string[]): Promise<string> {
//     try {
//       const response =
//         await this.privateGptClient.contextualCompletions.promptCompletion(
//           {
//             prompt: question,
//             useContext: true,
//             contextFilter: docIds ? { docsIds: docIds } : undefined,
//             includeSources: true,
//           },
//           { timeoutInSeconds: 30 },
//         );
//       console.log('Retrieved context:', response.choices[0]?.sources);
//       return response.choices[0]?.message?.content || '';
//     } catch (error) {
//       console.error('Error retrieving context:', error);
//       throw new Error('Failed to retrieve context');
//     }
//   }

//   /**
//    * Build the RAG (Retrieval-Augmented Generation) prompt.
//    */
//   buildRAGPrompt(context: string, question: string): string {
//     return `[INST]
//       You are a helpful assistant. You have access to the following context:
//       ${context}
//       You can use this context to answer the user's question. The final answer should be concise and relevant to the user's question.
//       User: ${question}
//       [/INST]
//           Final answer in french:`;
//   }

//   /**
//    * Query the local LLM (Ollama) with a given prompt.
//    */
//   async queryLocalLLM(prompt: string): Promise<string> {
//     try {
//       const response =
//         await this.privateGptClient.contextualCompletions.promptCompletion({
//           prompt,
//           includeSources: true,
//           useContext: true,
//         });

//       if (!response || !response.choices?.[0]?.message?.content) {
//         throw new Error('Invalid response from LLM');
//       }

//       return response.choices[0].message.content.trim();
//     } catch (error) {
//       console.error('Error querying LLM:', error);
//       throw new Error('Failed to query the local LLM');
//     }
//   }

//   /**
//    * Query the local LLM (Ollama) with a given prompt using streaming.
//    */
//   async queryLocalLLMStream(
//     content: string,
//     docIds?: string[],
//     abortSignal?: AbortSignal,
//   ): Promise<AsyncGenerator<string>> {
//     try {
//       // Retrieve context using PrivateGPT
//       let context = '';
//       try {
//         context = await this.getContext(content, docIds);
//       } catch (error) {
//         console.error('Error retrieving context:', error);
//       }

//       // Build the RAG prompt
//       const prompt = this.buildRAGPrompt(context, content);

//       if (!prompt) {
//         throw new Error('Failed to construct prompt');
//       }

//       const request = {
//         prompt,
//         includeSources: true,
//         useContext: true,
//         contextFilter: docIds ? { docsIds: docIds } : undefined,
//       };

//       const stream =
//         await this.privateGptClient.contextualCompletions.promptCompletionStream(
//           request,
//           undefined,
//           abortSignal,
//         );

//       // Return an async generator to process the stream
//       return (async function* () {
//         for await (const chunk of stream) {
//           const content = chunk.choices?.[0]?.delta?.content;
//           if (content) {
//             yield content;
//           }
//         }
//       })();
//     } catch (error) {
//       console.error('Error querying LLM with streaming:', error);
//       throw new Error('Failed to query the local LLM with streaming');
//     }
//   }

//   /**
//    * Ask a question to the assistant, save the user's question and the assistant's response.
//    */
//   async askQuestion(
//     conversationId: string,
//     userId: string,
//     question: string,
//     docIds?: string[],
//   ): Promise<{ userMessage: Messages; assistantMessage: Messages }> {
//     // Retrieve the conversation
//     const conversation = await this.getConversationById(conversationId);

//     // Retrieve context using PrivateGPT
//     let context = '';
//     try {
//       context = await this.getContext(question, docIds);
//     } catch (error) {
//       console.error('Error retrieving context:', error);
//     }

//     // Build the RAG prompt
//     const prompt = this.buildRAGPrompt(context, question);

//     // Query the local LLM
//     const llmResponse = await this.queryLocalLLM(prompt);

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
//       content: llmResponse,
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
import { Messages } from '../../entities/messages.entity';
import { Conversation } from '../../entities/conversation.entity';
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
   * Build the RAG (Retrieval-Augmented Generation) prompt.
   */
  buildRAGPrompt(context: string, question: string): string {
    return `[INST]
      You are a helpful assistant. You have access to the following context:
      ${context}
      You can use this context to answer the user's question. The final answer should be concise and relevant to the user's question.
      User: ${question}
      [/INST]
          Final answer in french:`;
  }

  /**
   * Query the local LLM (Ollama) with a given prompt.
   */
  async queryLocalLLM(prompt: string): Promise<string> {
    try {
      const response =
        await this.privateGptClient.contextualCompletions.promptCompletion({
          prompt,
          includeSources: true,
          useContext: true,
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
   * Query the local LLM (Ollama) with a given prompt using streaming.
   */
  async queryLocalLLMStream(
    content: string,
    docIds?: string[],
    abortSignal?: AbortSignal,
  ): Promise<AsyncGenerator<string>> {
    try {
      // Build the RAG prompt directly using the user's content
      // const prompt = this.buildRAGPrompt('', content); // No manual context retrieval

      const prompt = content; // Use the content directly as the prompt

      if (!prompt) {
        throw new Error('Failed to construct prompt');
      }

      const request = {
        prompt,
        includeSources: true,
        useContext: true, // Let the LLM handle context retrieval
        contextFilter: docIds ? { docsIds: docIds } : undefined, // Optional document filtering
      };

      const stream =
        await this.privateGptClient.contextualCompletions.promptCompletionStream(
          request,
          undefined,
          abortSignal,
        );

      // Return an async generator to process the stream
      return (async function* () {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      })();
    } catch (error) {
      console.error('Error querying LLM with streaming:', error);
      throw new Error('Failed to query the local LLM with streaming');
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

    // Build the RAG prompt directly using the user's question
    const prompt = this.buildRAGPrompt('', question); // No manual context retrieval

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

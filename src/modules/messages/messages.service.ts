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
//     environment: 'http://localhost:8001',
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
//     const savedMessage = await this.messagesRepository.save(newMessage);

//     // Check if the conversation has reached 10 messages
//     const conversation = await this.getConversationById(
//       message.conversation?.id ||
//         (() => {
//           throw new Error('Conversation ID is undefined');
//         })(),
//     );
//     if (conversation.messages.length % 5 === 0) {
//       await this.summarizeAndStoreConversation(conversation.id);
//     }
//     return savedMessage;
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
//    * Build the RAG (Retrieval-Augmented Generation) prompt.
//    */
//   buildRAGPrompt(context: string, question: string): string {
//     return `[INST]
//       You are a helpful assistant. You have access to the following context:
//       ${context}
//       You can use this context to answer the user's question. The final answer should be concise and relevant to the user's question.
//       User: ${question}
//       [/INST]
//           Final answer is in french:`;
//   }

//   /**
//    * Query the local LLM (Ollama) with a given prompt using streaming.
//    */
//   async queryLocalLLMStream(
//     content: string,
//     docIds?: string[],
//     abortSignal?: AbortSignal,
//   ): Promise<AsyncGenerator<string, any, any>> {
//     try {
//       // Build the RAG prompt directly using the user's content
//       // const prompt = this.buildRAGPrompt('', content); // No manual context retrieval

//       const prompt = content; // Use the content directly as the prompt

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
//         // return the document IDs
//         for await (const chunk of stream) {
//           const content = chunk.choices?.[0]?.delta?.content;
//           if (content) {
//             console.log('Streaming content:', content);
//             yield content;
//           }
//         }
//       })();
//     } catch (error) {
//       console.error('Error querying LLM with streaming:', error);
//       throw new Error('Failed to query the local LLM with streaming');
//     }
//   }

//   async askQuestionWithStream(
//     conversationId: string,
//     userId: string,
//     question: string,
//   ): Promise<AsyncGenerator<string>> {
//     const conversation = await this.getConversationById(conversationId);
//     if (!conversation) {
//       throw new NotFoundException('Conversation not found');
//     }
//     // Generate prompt using memory or plain question (based on your use case)
//     const prompt = await this.buildRAGPromptWithContext(
//       question,
//       conversationId,
//     );

//     // Stream the assistant's response
//     return this.queryLocalLLMStream(prompt);
//   }
//   async buildRAGPromptWithContext(
//     question: string,
//     conversationId: string,
//   ): Promise<string> {
//     const conversation = await this.getConversationById(conversationId);

//     const recentMessages = conversation.messages
//       .slice(-6) // Last 3 user+assistant pairs
//       .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
//       .join('\n');

//     const summary = conversation.summary || 'No summary available.';
//     return `
//   You are a helpful assistant.

//   Conversation summary:
//   ${summary}

//   Recent conversation:
//   ${recentMessages}

//   User: ${question}

//   Respond in French.
//   `;
//   }

//   async generateSummaryStream(
//     conversationId: string,
//   ): Promise<AsyncGenerator<string>> {
//     const conversation = await this.getConversationById(conversationId);
//     const messages = conversation.messages
//       .slice(-6) // Last 3 user+assistant pairs
//       .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
//       .join('\n');

//     const prompt = `Summarize the following conversation in French:\n${messages}`;

//     return this.queryLocalLLMStream(prompt);
//   }

//   async summarizeAndStoreConversation(conversationId: string): Promise<void> {
//     console.log(
//       `Starting summary generation for conversation: ${conversationId}`,
//     );

//     // Step 1: Stream the summary
//     const summaryStream = await this.generateSummaryStream(conversationId);

//     let summary = '';
//     for await (const chunk of summaryStream) {
//       summary += chunk;
//     }

//     console.log('Final summary:', summary);

//     // Step 2: Store the summary
//     await this.storeSummary(conversationId, summary);
//     console.log(`Summary stored for conversation: ${conversationId}`);
//   }

//   async storeSummary(conversationId: string, summary: string): Promise<void> {
//     const conversation = await this.getConversationById(conversationId);
//     conversation.summary = summary;
//     await this.conversationRepository.save(conversation);
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
    environment: 'http://localhost:8001',
  });

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Messages)
    private readonly messagesRepository: Repository<Messages>,
  ) {}

  /**
   * Retrieve relevant chunks for a given query using PrivateGPT.
   */
  async getRelevantChunks(query: string, limit = 10): Promise<any[]> {
    try {
      const response =
        await this.privateGptClient.contextChunks.chunksRetrieval({
          text: query,
          limit,
          prevNextChunks: 1, // Include surrounding chunks for better context
        });

      console.log('Relevant chunks:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error retrieving chunks:', error);
      throw new Error('Failed to retrieve relevant chunks');
    }
  }

  /**
   * Build the RAG (Retrieval-Augmented Generation) prompt using relevant chunks.
   */
  async buildPromptWithChunks(query: string): Promise<string> {
    const chunks = await this.getRelevantChunks(query);

    const context = chunks
      .map(
        (chunk: { document: { doc_id: string }; text: string }) =>
          `Source: ${chunk.document.doc_id}\n${chunk.text}`,
      )
      .join('\n\n');

    return `[INST]
      You are a helpful assistant. Use the following context to answer the user's question:
      ${context}
      User: ${query}
      [/INST]`;
  }

  /**
   * Ask a question with context and stream the response.
   */
  async askQuestionWithStream(
    conversationId: string,
    userId: string,
    question: string,
  ): Promise<AsyncGenerator<string>> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Build the prompt using relevant chunks
    const prompt = await this.buildPromptWithChunks(question);

    // Stream the assistant's response
    return this.queryLocalLLMStream(prompt);
  }

  /**
   * Query the local LLM (Ollama) with a given prompt using streaming.
   */
  async queryLocalLLMStream(
    content: string,
    docIds?: string[],
    abortSignal?: AbortSignal,
  ): Promise<AsyncGenerator<string, any, any>> {
    try {
      const request = {
        prompt: content,
        includeSources: true,
        useContext: true,
        contextFilter: docIds ? { docsIds: docIds } : undefined,
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
    const savedMessage = await this.messagesRepository.save(newMessage);

    // Check if the conversation has reached 10 messages
    const conversation = await this.getConversationById(
      message.conversation?.id ||
        (() => {
          throw new Error('Conversation ID is undefined');
        })(),
    );
    if (conversation.messages.length % 10 === 0) {
      await this.summarizeAndStoreConversation(conversation.id);
    }
    return savedMessage;
  }

  /**
   * Summarize and store a conversation.
   */
  async summarizeAndStoreConversation(conversationId: string): Promise<void> {
    console.log(
      `Starting summary generation for conversation: ${conversationId}`,
    );

    const conversation = await this.getConversationById(conversationId);
    const messages = conversation.messages
      .slice(-10) // Last 10 messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize the following conversation in French:\n${messages}`;
    const summaryStream = await this.queryLocalLLMStream(prompt);

    let summary = '';
    for await (const chunk of summaryStream) {
      summary += chunk;
    }

    console.log('Final summary:', summary);

    // Store the summary
    await this.storeSummary(conversationId, summary);
    console.log(`Summary stored for conversation: ${conversationId}`);
  }

  /**
   * Store a summary for a conversation.
   */
  async storeSummary(conversationId: string, summary: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    conversation.summary = summary;
    await this.conversationRepository.save(conversation);
  }

  //   /**
  //    * Ingest a file using PrivateGPT.
  //    */
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
}

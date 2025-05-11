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

      // console.log('Relevant chunks:', response.data);
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
  ): Promise<
    AsyncGenerator<{ content: string; docIds: string[] }, void, unknown>
  > {
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
  ): Promise<
    AsyncGenerator<{ content: string; docIds: string[] }, void, unknown>
  > {
    try {
      const request = {
        prompt: content,
        includeSources: true,
        useContext: true,
        contextFilter: docIds ? { docsIds: docIds } : undefined,
        stream: true,
      };

      const stream =
        await this.privateGptClient.contextualCompletions.promptCompletionStream(
          request,
          undefined,
          abortSignal,
        );

      const collectedDocIds = new Set<string>();

      const generator: AsyncGenerator<{ content: string; docIds: string[] }> =
        (async function* () {
          for await (const chunk of stream) {
            const sources = chunk.choices?.[0]?.sources || [];

            sources.forEach((source) => {
              if (source.document?.docMetadata) {
                collectedDocIds.add(
                  typeof source.document?.docMetadata === 'string'
                    ? source.document.docMetadata
                    : JSON.stringify(source.document?.docMetadata),
                );
              }
            });

            const content = chunk.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, docIds: Array.from(collectedDocIds) };
            }
          }
        })();

      return generator;
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
      summary += chunk.content;
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

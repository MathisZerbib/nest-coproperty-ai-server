import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';
import { DocumentUpload } from './pinecone-model';

@Injectable()
export class PineconeService {
  private pc: Pinecone;
  private indexName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('PINECONE_API_KEY');
    if (!apiKey) {
      throw new Error('Pinecone API key is required');
    }

    this.pc = new Pinecone({ apiKey });
    this.indexName = this.configService.get<string>('PINECONE_INDEX') || '';
    if (!this.indexName) {
      throw new Error('Pinecone index name is required');
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Hugging Face API key is missing in environment variables.',
      );
    }

    console.log('[Pinecone Service] Generating embedding for text:', text);

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
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
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  public async upsertDocuments(documents: DocumentUpload[]): Promise<void> {
    if (!documents || documents.length === 0) {
      console.log('No documents to upsert');
      return;
    }

    const index = this.pc.Index(this.indexName);

    // Batch processing with error handling
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      try {
        const vectors = await Promise.all(
          batch.map(async (doc) => {
            try {
              const embedding = await this.generateEmbedding(doc.text);
              return {
                id: doc.id,
                values: embedding,
                metadata: {
                  text: doc.text,
                  ...(doc.fileName && { fileName: doc.fileName }),
                  ...(doc.date && { date: doc.date }),
                  ...(doc.size && { size: doc.size }),
                  ...(doc.type && { type: doc.type }),
                },
              };
            } catch (err: any) {
              console.error(
                `Failed to process document ${doc.id}:`,
                err instanceof Error ? err.message : err,
              );
              return null;
            }
          }),
        );

        // Filter out failed documents
        const validVectors = vectors.filter((v) => v !== null);

        if (validVectors.length > 0) {
          await index.upsert(validVectors);
          console.log(
            `Uploaded batch ${Math.floor(i / batchSize) + 1} (${validVectors.length} vectors)`,
          );
        }
      } catch (batchError: any) {
        console.error(
          `Batch ${Math.floor(i / batchSize) + 1} failed:`,
          batchError instanceof Error ? batchError.message : batchError,
        );
      }
    }
  }

  public async ingestChunk(
    id: string,
    text: string,
    additionalMetadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(text);
      const metadata = {
        text,
        ...additionalMetadata,
      };

      const index = this.pc.Index(this.indexName);
      await index.upsert([
        {
          id,
          values: embedding,
          metadata,
        },
      ]);
      console.log(`Successfully ingested chunk with ID: ${id}`);
    } catch (error) {
      console.error(`Failed to ingest chunk with ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Retrieve context from Pinecone by querying similar embeddings.
   */
  public async getContext(
    queryEmbedding: number[],
    topK: number = 3,
  ): Promise<string> {
    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error('Invalid query embedding: Empty vector');
    }

    if (!Array.isArray(queryEmbedding)) {
      throw new Error('Invalid query embedding: Expected an array of numbers');
    }

    if (
      queryEmbedding.some((value) => typeof value !== 'number' || isNaN(value))
    ) {
      throw new Error('Invalid query embedding: Contains non-numeric values');
    }

    try {
      const index = this.pc.Index(this.indexName);
      if (!index) {
        throw new Error(`Index ${this.indexName} not found`);
      }

      const results = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      if (!results.matches || results.matches.length === 0) {
        console.warn('No matches found for the query embedding');
        return '';
      }

      return results.matches
        .filter((match) => match.metadata?.text)
        .map((match) => {
          console.log('Match metadata:', match.metadata);
          return match.metadata?.text ?? '';
        })
        .join('\n');
    } catch (error) {
      console.error('Context retrieval error:', error);
      throw new Error('Failed to retrieve context');
    }
  }
}

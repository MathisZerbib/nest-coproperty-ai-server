import { ConfigModule } from '@nestjs/config';
import {
  PineconeConfig,
  PineconeQueryResponse,
  PineconeMatch,
} from './pinecone-model';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables from .env file
void ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

class PineconeContextRetriever {
  private pc: Pinecone;
  private indexName: string;

  constructor(config: PineconeConfig) {
    if (!config.apiKey) {
      throw new Error('Pinecone API key is required');
    }
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid Pinecone API key.');
    }
    const pc: Pinecone = new Pinecone({
      apiKey,
    });
    this.pc = pc;
    this.indexName = process.env.PINECONE_INDEX || '';
    if (!this.indexName) {
      throw new Error('Pinecone index name is required');
    }
  }
  public async getContext(
    queryEmbedding: number[],
    topK: number = 3,
  ): Promise<string> {
    this.validateEmbedding(queryEmbedding);
    try {
      const index = this.pc.Index(this.indexName);
      if (!index) {
        throw new Error(`Index ${this.indexName} not found`);
      }
      const results = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      }) as PineconeQueryResponse;

      if (results.matches) {
        results.matches = results.matches.map((match) => ({
          ...match,
          score: match.score ?? 0, // Ensure score is a number
        }));
      }
      return this.processResults(results);
    } catch (error: unknown) {
      console.error('Context retrieval error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve context: ${errorMessage}`);
    }
  }
  private validateEmbedding(embedding: number[]): void {
    if (!embedding || embedding.length === 0) {
      throw new Error('Invalid query embedding: Empty vector');
    }

    if (!Array.isArray(embedding)) {
      throw new Error('Invalid query embedding: Expected an array of numbers');
    }

    if (embedding.some((value) => typeof value !== 'number' || isNaN(value))) {
      throw new Error('Invalid query embedding: Contains non-numeric values');
    }
  }

  private processResults(results: PineconeQueryResponse): string {
    if (!results.matches || results.matches.length === 0) {
      console.warn('No matches found for the query embedding');
      return '';
    }

    return results.matches
      .filter((match: PineconeMatch) => match.metadata?.text)
      .map((match: PineconeMatch) => {
        console.log('Match metadata:', match.metadata);
        return match.metadata.text;
      })
      .join('\n');
  }
}

// Initialize with configuration
const pineconeConfig: PineconeConfig = {
  apiKey: process.env.PINECONE_API_KEY || '',
};

if (!pineconeConfig.apiKey) {
  throw new Error('Pinecone API key not configured');
}

const pineconeRetriever = new PineconeContextRetriever(pineconeConfig);

export { pineconeRetriever };

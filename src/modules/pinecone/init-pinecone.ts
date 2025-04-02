import { Pinecone, CreateIndexOptions } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const indexName = process.env.PINECONE_INDEX || '';
const dimension = parseInt(process.env.PINECONE_DIMENSION || '', 10);

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone API key is missing in the environment variables.');
}

if (!indexName) {
  throw new Error(
    'Pinecone index name is missing in the environment variables.',
  );
}

if (isNaN(dimension)) {
  throw new Error(
    'Pinecone dimension is missing or invalid in the environment variables.',
  );
}

async function createIndex(): Promise<void> {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid Pinecone API key.');
  }

  const pc: Pinecone = new Pinecone({
    apiKey,
  });

  try {
    const options: CreateIndexOptions = {
      name: indexName,
      dimension: dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    };

    await pc.createIndex(options);

    console.log('Pinecone index created!');
  } catch (error: any) {
    if (error instanceof Error) {
      console.error('Error creating Pinecone index:', error.message);
    } else {
      console.error('Error creating Pinecone index:', error);
    }
    throw new Error('Failed to create Pinecone index.');
  }
}

createIndex().catch((error) => {
  console.error(
    'Initialization failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});

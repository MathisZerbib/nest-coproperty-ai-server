import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

async function checkIndexStats(): Promise<void> {
  const apiKey = process.env.PINECONE_API_KEY || '';
  const indexName = process.env.PINECONE_INDEX || '';

  if (!apiKey) {
    throw new Error('Pinecone API key is missing in the environment variables.');
  }

  if (!indexName) {
    throw new Error('Pinecone index name is missing in the environment variables.');
  }

  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index(indexName);

  try {
    const stats = await index.describeIndexStats();
    console.log(stats);
  } catch (error: any) {
    console.error('Error fetching index stats:', error.message || error);
    throw new Error('Failed to fetch Pinecone index stats.');
  }
}

checkIndexStats().catch((error) => {
  console.error('Error:', error.message || error);
});
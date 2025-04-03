import { ConfigModule } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables from .env file
void ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

async function checkLastUploadedIndex(): Promise<void> {
  const apiKey = process.env.PINECONE_API_KEY || '';
  const indexName = process.env.PINECONE_INDEX || '';

  if (!apiKey) {
    throw new Error(
      'Pinecone API key is missing in the environment variables.',
    );
  }

  if (!indexName) {
    throw new Error(
      'Pinecone index name is missing in the environment variables.',
    );
  }

  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index(indexName);

  try {
    // Fetch index statistics
    const stats = await index.describeIndexStats();

    console.log('Index Stats:', stats);

    // Check for the last uploaded index based on metadata or timestamp
    const namespaces = stats.namespaces || {};
    const lastUploaded = Object.entries(namespaces)
      .map(([namespace, data]) => ({
        namespace,
        timestamp: Number(data?.recordCount) || 0, // Use `vectorCount` or another valid property
      }))
      .sort((a, b) => b.timestamp - a.timestamp)[0]; // Sort by timestamp descending

    if (lastUploaded) {
      console.log(
        `Last uploaded index: Namespace "${lastUploaded.namespace}" at timestamp ${lastUploaded.timestamp}`,
      );
    } else {
      console.log('No uploaded indexes found.');
    }
  } catch (error: any) {
    console.error(
      'Error fetching index stats:',
      error instanceof Error ? error.message : error,
    );
    throw new Error('Failed to fetch Pinecone index stats.');
  }
}

checkLastUploadedIndex().catch((error) => {
  console.error('Error:', error instanceof Error ? error.message : error);
});

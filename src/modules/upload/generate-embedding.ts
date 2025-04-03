import axios from 'axios';

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  if (!apiKey) {
    throw new Error(
      'Hugging Face API key is missing in the environment variables.',
    );
  }

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

import { Pinecone, Index } from '@pinecone-database/pinecone';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Pinecone with environment configuration
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
  throw new Error(
    'Pinecone API key or index name is missing in the environment variables.',
  );
}

// Improved embedding generation with retries and fallback
async function generateEmbedding(text: string): Promise<number[]> {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Empty embedding response');
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 503) {
        // Model loading - exponential backoff
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retries++;
      } else {
        console.error(`Attempt ${retries + 1} failed:`, error.message || error);
        if (retries === maxRetries - 1) {
          throw new Error(
            `Embedding failed after ${maxRetries} attempts: ${error.message || error}`,
          );
        }
        retries++;
      }
    }
  }

  throw new Error('Failed to generate embedding after maximum retries');
}

interface Document {
  id: string;
  text: string;
  fileName?: string;
  date?: string;
  size?: string;
  type?: string;
}

async function upsertDocuments(): Promise<void> {
  const index: Index = pc.index(process.env.PINECONE_INDEX || '');

  const documents: Document[] = [
    // Example documents
    {
      id: '1',
      text: 'Kourikaou Apartments: A modern residential complex in the heart of Montpellier.',
    },
    {
      id: '2',
      text: 'Kourikaou Apartments have been recognized for their eco-friendly design.',
    },
    //         {
    //           id: '1',
    //           text: 'Kourikaou Apartments: A modern residential complex in the heart of Montpellier\'s Saint-Roch district, offering luxury living with 24/7 security and premium amenities.'
    //         },
    //         {
    //           id: '2',
    //           text: 'Kourikaou Apartments have been recognized for their eco-friendly design and energy-efficient features, perfectly situated in the vibrant Saint-Roch neighborhood.'
    //         },
    //         {
    //           id: '3',
    //           text: 'Located at 123 Rue de la Paix, 34000 Montpellier, Kourikaou Apartments are in the center of Saint-Roch, providing easy access to shopping, schools, and public transport.'
    //         },

    //         // ------ APARTMENT FEATURES ------
    //         {
    //           id: '4',
    //           text: 'Each unit at Kourikaou Apartments is equipped with modern appliances, including smart home technology for convenience, with many offering views of Saint-Roch\'s historic streets.'
    //         },
    //         {
    //           id: '5',
    //           text: 'The Kourikaou Apartments community in Saint-Roch is known for its diverse mix of residents, from young professionals to families, creating a vibrant urban atmosphere.'
    //         },

    //         // ------ LOCATION HIGHLIGHTS ------
    //         {
    //           id: '6',
    //           text: 'Kourikaou Apartments are just 5 minutes walk from Place de la Comédie, the beating heart of Montpellier\'s Saint-Roch district, surrounded by cafes and cultural venues.'
    //         },
    //         {
    //           id: '7',
    //           text: 'The Saint-Roch neighborhood where Kourikaou Apartments are located is known for its beautiful 19th-century architecture and lively street markets.'
    //         },
    //         {
    //           id: '8',
    //           text: 'From Kourikaou Apartments in Saint-Roch, the Mediterranean beaches at Palavas-les-Flots are just a 20-minute drive away.'
    //         },

    //         // ------ AMENITIES & SERVICES ------
    //         {
    //           id: '9',
    //           text: 'Kourikaou Apartments feature a rooftop terrace with panoramic views of Montpellier, including the Saint-Roch church spire and the Mediterranean beyond.'
    //         },
    //         {
    //           id: '10',
    //           text: 'Residents enjoy 24/7 concierge services, secure parking, and access to a fitness center - all in the heart of Saint-Roch.'
    //         },

    //         // ------ TRANSPORT LINKS ------
    //         {
    //           id: '11',
    //           text: 'Kourikaou Apartments are 3 minutes walk from Rondelet tram stop (Line 2), connecting directly to Saint-Roch train station in just 2 stops.'
    //         },
    //         {
    //           id: '12',
    //           text: 'Montpellier Saint-Roch station, just 10 minutes walk from the apartments, offers TGV connections to Paris in 3.5 hours.'
    //         },

    //         // ------ LOCAL CULTURE ------
    //         {
    //           id: '13',
    //           text: 'The Saint-Roch district surrounding Kourikaou Apartments hosts the annual Montpellier Dance Festival and numerous art galleries.'
    //         },
    //         {
    //           id: '14',
    //           text: 'Musée Fabre, one of France\'s finest art museums, is just 7 minutes walk from Kourikaou Apartments in Saint-Roch.'
    //         },

    //         // ------ DOCUMENTS ------
    //         {
    //           id: '15',
    //           text: 'Co-ownership Regulations 2025',
    //           fileName: 'Co-ownership Regulations 2025',
    //           date: '15/01/2025',
    //           size: '2.4 MB',
    //           type: 'Regulations'
    //         },
    //         {
    //           id: '16',
    //           text: 'General Assembly Minutes of 15/12/2024',
    //           fileName: 'General Assembly Minutes',
    //           date: '20/12/2024',
    //           size: '1.8 MB',
    //           type: 'Minutes'
    //         },
    //         {
    //           id: '17',
    //           text: 'Facade Renovation Estimate',
    //           fileName: 'Facade Renovation Estimate',
    //           date: '05/02/2025',
    //           size: '3.2 MB',
    //           type: 'Estimate'
    //         },
    //         {
    //           id: '18',
    //           text: 'Elevator Maintenance Contract',
    //           fileName: 'Elevator Maintenance Contract',
    //           date: '10/01/2025',
    //           size: '1.5 MB',
    //           type: 'Contract'
    //         },
    //         {
    //           id: '19',
    //           text: 'Heating Bills T1 2025',
    //           fileName: 'Heating Bills T1',
    //           date: '02/04/2025',
    //           size: '0.8 MB',
    //           type: 'Bill'
    //         },

    //         // ------ EXPANDED LOCATION DETAILS ------
    //         {
    //           id: '20',
    //           text: 'The Saint-Roch farmers market at Halles Laissac, just 400m from Kourikaou Apartments, offers fresh local produce every morning except Monday.'
    //         },
    //         {
    //           id: '21',
    //           text: 'Kourikaou Apartments are surrounded by Saint-Roch\'s famous wine bars, showcasing the best of Languedoc-Roussillon vineyards.'
    //         },
    //         {
    //           id: '22',
    //           text: 'Parc du Peyrou, Montpellier\'s grandest park with stunning city views, is just 8 minutes walk from the apartments in Saint-Roch.'
    //         },

    //         // ------ BUSINESS & EDUCATION ------
    //         {
    //           id: '23',
    //           text: 'The Saint-Roch district is home to Montpellier Business School and numerous tech startups, making Kourikaou Apartments ideal for professionals.'
    //         },
    //         {
    //           id: '24',
    //           text: 'University of Montpellier\'s historic faculties are within 15 minutes walk of Kourikaou Apartments in Saint-Roch.'
    //         },

    //         // ------ SHOPPING & DINING ------
    //         {
    //           id: '25',
    //           text: 'Polygone Shopping Center, with 120 stores and cinemas, is 10 minutes walk from Kourikaou Apartments through Saint-Roch\'s charming streets.'
    //         },
    //         {
    //           id: '26',
    //           text: 'Saint-Roch\'s Rue de la Loge, just behind Kourikaou Apartments, offers boutique shopping and some of Montpellier\'s best restaurants.'
    //         },

    //         // ------ HEALTH & WELLNESS ------
    //         {
    //           id: '27',
    //           text: 'Saint-Roch Health Center, 500m from Kourikaou Apartments, provides excellent medical facilities for residents.'
    //         },
    //         {
    //           id: '28',
    //           text: 'The apartments\' rooftop yoga deck overlooks Saint-Roch\'s historic rooftops and the Mediterranean in the distance.'
    //         },

    //         // ------ GREEN SPACES ------
    //         {
    //           id: '29',
    //           text: 'Jardin des Plantes, France\'s oldest botanical garden, is 12 minutes walk from Kourikaou Apartments through Saint-Roch.'
    //         },
    //         {
    //           id: '30',
    //           text: 'The Lez River pedestrian path begins just 200m from the apartments, perfect for morning runs through Saint-Roch.'
    //         },

    //         // ------ ADDITIONAL DOCUMENTS ------
    //         {
    //           id: '31',
    //           text: 'Annual Budget 2025',
    //           fileName: 'Annual Budget',
    //           date: '10/01/2025',
    //           size: '2.1 MB',
    //           type: 'Financial'
    //         },
    //         {
    //           id: '32',
    //           text: 'Insurance Policy Renewal',
    //           fileName: 'Insurance Policy',
    //           date: '01/03/2025',
    //           size: '1.7 MB',
    //           type: 'Insurance'
    //         },

    //         // ------ NEIGHBORHOOD HISTORY ------
    //         {
    //           id: '33',
    //           text: 'The Saint-Roch district where Kourikaou Apartments stand was once Montpellier\'s medieval center, with some buildings dating to the 12th century.'
    //         },
    //         {
    //           id: '34',
    //           text: 'Saint-Roch church, 5 minutes walk from the apartments, is a beautiful example of southern Gothic architecture.'
    //         },

    //         // ------ FAMILY FRIENDLY ------
    //         {
    //           id: '35',
    //           text: 'International School of Montpellier is just 15 minutes by tram from Kourikaou Apartments in Saint-Roch.'
    //         },
    //         {
    //           id: '36',
    //           text: 'The apartments\' location in Saint-Roch provides safe, pedestrian-friendly streets with excellent schools nearby.'
    //         },

    //         // ------ SUSTAINABILITY ------
    //         {
    //           id: '37',
    //           text: 'Kourikaou Apartments in Saint-Roch have achieved Gold certification in France\'s sustainable building program.'
    //         },
    //         {
    //           id: '38',
    //           text: 'Electric vehicle charging stations in the apartment garage support Saint-Roch\'s low-emission zone policies.'
    //         },

    //         // ------ SPECIAL FEATURES ------
    //         {
    //           id: '39',
    //           text: 'The penthouse suites at Kourikaou Apartments offer private terraces with 360° views of Saint-Roch and beyond.'
    //         },
    //         {
    //           id: '40',
    //           text: 'Monthly wine tastings in the lobby showcase Saint-Roch\'s best vineyards, exclusive to Kourikaou residents.'
    //         }
  ];

  // Batch processing with error handling
  const batchSize = 10;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    try {
      const vectors = await Promise.all(
        batch.map(async (doc) => {
          try {
            const embedding = await generateEmbedding(doc.text);
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
              err.message || err,
            );
            return null;
          }
        }),
      );

      // Filter out failed documents
      const validVectors = vectors.filter((v) => v !== null);

      if (validVectors.length > 0) {
        await index.upsert(validVectors as any); // Type assertion for Pinecone upsert
        console.log(
          `Uploaded batch ${i / batchSize + 1} (${validVectors.length} vectors)`,
        );
      }
    } catch (batchError: any) {
      console.error(
        `Batch ${i / batchSize + 1} failed:`,
        batchError.message || batchError,
      );
    }
  }
}

// Verify Pinecone connection first
async function run(): Promise<void> {
  try {
    await pc.listIndexes(); // Test connection
    console.log('Connected to Pinecone successfully');

    await upsertDocuments();
    console.log('Data upload completed');
  } catch (err: any) {
    console.error(
      'Initialization failed:',
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }
}
run().catch((error) => {
  console.error('Error during execution:', error.message || error);
  process.exit(1);
});

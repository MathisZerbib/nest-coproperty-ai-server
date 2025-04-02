// Type definitions
export type PineconeMatch = {
  id: string;
  score: number;
  metadata: {
    text: string;
    [key: string]: any;
  };
  values?: number[];
};

export type PineconeQueryResponse = {
  matches: PineconeMatch[];
  namespace: string;
};

export type PineconeConfig = {
  apiKey: string;
  environment?: string;
};

export type QueryOptions = {
  vector: number[];
  topK: number;
  includeMetadata: boolean;
};

export type Document = {
  id: string;
  text: string;
  fileName?: string;
  date?: string;
  size?: string;
  type?: string;
};

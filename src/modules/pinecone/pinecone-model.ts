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

export type DocumentUpload = {
  id: string;
  text: string;
  fileName?: string;
  date?: string;
  size?: string;
  type?: string;
  metadata?: Metadata;
};

export type Metadata = {
  author?: string;
  type?: string; // The type of the document (e.g., "document", "legal", "resident")
  tags?: string[];
  year?: number;
  [key: string]: any; // Allow additional dynamic key-value pairs ??? TODO is this useful ?
};

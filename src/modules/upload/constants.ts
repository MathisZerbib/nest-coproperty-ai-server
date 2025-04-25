import * as path from 'path';

export const ALLOWED_FOLDERS = ['document', 'legal', 'resident'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const CHUNK_SIZE = 500;
export const ACCEPTED_FILES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const generateFileName = (file: Express.Multer.File) => {
  // Convert original filename to UTF-8
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const ext = path.extname(file.originalname).toLowerCase(); // Extract file extension
  const nameWithoutExt = path.basename(file.originalname, ext);

  // Normalize the filename (remove accents and diacritical marks)
  const normalized = nameWithoutExt
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritical marks

  // Replace spaces with hyphens and remove invalid characters
  const sanitized = normalized
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-|-$/g, ''); // Remove leading or trailing hyphens

  return `${sanitized}${ext}`;
};

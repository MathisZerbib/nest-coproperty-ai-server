import { diskStorage, Options } from 'multer';
import { Request } from 'express';

declare module 'express' {
  export interface Request {
    fileValidationError?: string;
  }
}

interface MulterFile extends Express.Multer.File {
  originalname: string;
  mimetype: string;
}

interface FileFilterCallback {
  (error: Error | null, acceptFile: boolean): void;
}

export const multerOptions: Options = {
  storage: diskStorage({
    destination: './uploads',
    filename: (
      req: Request,
      file: MulterFile,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const originalName = file.originalname.replace(/\s+/g, '-');
      const filename = `${uniqueSuffix}-${originalName}`;
      callback(null, filename);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },
  fileFilter: (
    req: Request,
    file: MulterFile,
    callback: FileFilterCallback,
  ) => {
    // Allow only PDF and DOCX files
    if (
      !file.mimetype.match(
        /\/(pdf|vnd.openxmlformats-officedocument.wordprocessingml.document)$/,
      )
    ) {
      req.fileValidationError = 'Only PDF and DOCX files are allowed!';
      return callback(null, false);
    }
    callback(null, true);
  },
};

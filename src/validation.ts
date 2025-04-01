import { ValidationPipe } from '@nestjs/common';

import { INestApplication } from '@nestjs/common';

export function setupValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTOs
      forbidNonWhitelisted: true, // Reject unexpected properties
      whitelist: true, // Strip properties not in the DTO
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error messages in production
    }),
  );
}

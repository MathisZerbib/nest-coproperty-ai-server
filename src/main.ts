import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Load environment variables from .env file
void ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS with environment-based configuration
  app.enableCors({
    origin: 'http://localhost:3000', // Replace with your frontend URL
    credentials: true, // Allow cookies and credentials
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Enable shutdown hooks for proper cleanup
  app.enableShutdownHooks();

  // Use global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTOs
      forbidNonWhitelisted: true, // Reject unexpected properties
      whitelist: true, // Strip properties not in the DTO
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error messages in production
    }),
  );

  // Start the application on the specified port
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8888;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
void bootstrap();

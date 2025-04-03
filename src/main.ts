import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { setupValidation } from './validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS with environment-based configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Replace with your frontend URL
    credentials: true, // Allow cookies and credentials
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Enable shutdown hooks for proper cleanup
  app.enableShutdownHooks();

  // Setup validation pipes
  setupValidation(app);

  // Setup Swagger for API documentation
  setupSwagger(app);

  // Start the application on the specified port
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8888;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(
    `Swagger documentation is available at: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Copoperty AI API')
    .setDescription('API documentation for Copoperty AI')
    .setVersion('1.0')
    .addBearerAuth() // Add JWT Bearer token support
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Swagger UI available at /api/docs
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Client } from 'pg';

async function ensureChatDatabaseExists(logger: Logger) {
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || '5432');
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgres';

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'chat_db'");
    if (res.rowCount === 0) {
      await client.query("CREATE DATABASE chat_db");
      logger.log("Database 'chat_db' created successfully.");
    } else {
      logger.log("Database 'chat_db' already exists.");
    }
  } catch (err) {
    logger.error("Error checking or creating 'chat_db': " + err.message);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  await ensureChatDatabaseExists(logger);
  const app = await NestFactory.create(AppModule);

  // Kích hoạt shutdown hooks để NestJS xử lý các signal tắt ứng dụng (SIGTERM, SIGINT)
  app.enableShutdownHooks();

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('Tài liệu API của NestJS Notification & Real-time Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('notification-docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Notification Service running on port ${port}`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  const fastify = app.getHttpAdapter().getInstance();
  await fastify.register(helmet, { global: true });
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.enableCors({ origin: true, credentials: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));

  await app.listen(3000, '0.0.0.0');
}
bootstrap();

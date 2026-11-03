import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LessonsController, QuestionsController } from './controllers';
import { Store } from './store';

@Module({ controllers: [LessonsController, QuestionsController], providers: [Store] })
class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: process.env.NODE_ENV === 'test' ? false : undefined });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Interview English API')
    .setDescription('Backend NestJS cho dự án Interview English. Hai API collections: Lessons và Questions. Dữ liệu khởi tạo lấy từ 3 bài và 9 câu trong app Expo. Đây là API demo công khai, chưa có đăng nhập; chỉ dùng dữ liệu thử nghiệm. App Expo hiện chưa kết nối backend này. Dữ liệu lưu JSON trên một server; trên hosting không có ổ đĩa bền vững, dữ liệu có thể được khởi tạo lại khi deploy hoặc restart.')
    .setVersion('1.0.0')
    .addTag('1. Lessons - Bài học', 'Danh sách, chi tiết, tạo, sửa, xóa và lấy câu hỏi theo bài.')
    .addTag('2. Questions - Câu hỏi', 'Danh sách, lọc theo bài, chi tiết, tạo, sửa và xóa.')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
    swaggerOptions: { persistAuthorization: false, docExpansion: 'list', displayRequestDuration: true },
    customSiteTitle: 'Interview English | Swagger Docs',
  });
  const express = app.getHttpAdapter().getInstance();
  express.get('/', (_req: unknown, res: { redirect: (url: string) => void }) => res.redirect('/docs'));
  express.get('/health', (_req: unknown, res: { json: (body: unknown) => void }) => res.json({ status: 'ok', service: 'interview-english-api' }));
  app.enableShutdownHooks();
  return app;
}

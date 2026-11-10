import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LessonsController, QuestionsController } from './controllers';
import { PostgresStore } from './postgres-store';
import { DatabaseService } from './database.service';
import { AdminWriteGuard } from './admin-write.guard';

  @Module({
    controllers: [LessonsController, QuestionsController],
    providers: [
      DatabaseService,
      PostgresStore,
      {
        provide: APP_GUARD,
        useClass: AdminWriteGuard,
      },
    ],
  })
class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: process.env.NODE_ENV === 'test' ? false : undefined });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Interview English API')
      .setDescription('Backend NestJS cho Interview English, gồm Lessons và Questions. App Expo đọc nội dung qua API. GET công khai; POST, PATCH và DELETE yêu cầu Bearer token quản trị. Dữ liệu bài học và câu hỏi lưu trong PostgreSQL. Chưa có tài khoản người dùng; tiến độ học vẫn lưu trên điện thoại.')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        description: 'Nhập token quản trị để thêm, sửa hoặc xóa dữ liệu.',
      },
      'admin-token',
    )
    .setVersion('1.0.0')
    .addTag('1. Lessons - Bài học', 'Danh sách, chi tiết, tạo, sửa, xóa và lấy câu hỏi theo bài.')
    .addTag('2. Questions - Câu hỏi', 'Danh sách, lọc theo bài, chi tiết, tạo, sửa và xóa.')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Swagger yêu cầu token cho các thao tác ghi dữ liệu.
  for (const path of Object.values(document.paths)) {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const operation = path[method];

      if (operation) {
        operation.security = [{ 'admin-token': [] }];
        operation.responses['401'] = {
          description: 'Thiếu token quản trị hoặc token không hợp lệ.',
        };
        operation.responses['503'] = {
          description: 'Server chưa cấu hình token quản trị.',
        };
      }
    }
  }
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

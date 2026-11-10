import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class AdminWriteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    // Cho phép đọc dữ liệu mà không cần token quản trị.
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Token được cấu hình trên server, không viết trong code.
    const expectedToken = process.env.ADMIN_API_KEY;

    if (!expectedToken?.trim()) {
      throw new ServiceUnavailableException(
        'Server chưa cấu hình quyền quản trị.',
      );
    }

    // Yêu cầu có dạng: Authorization: Bearer <token>
    const authorization = request.headers.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'Cần token quản trị hợp lệ.',
      );
    }

    const suppliedToken = authorization.slice(7);

    const expectedHash = createHash('sha256')
      .update(expectedToken)
      .digest();

    const suppliedHash = createHash('sha256')
      .update(suppliedToken)
      .digest();

    if (!timingSafeEqual(expectedHash, suppliedHash)) {
      throw new UnauthorizedException(
        'Cần token quản trị hợp lệ.',
      );
    }

    return true;
  }
}
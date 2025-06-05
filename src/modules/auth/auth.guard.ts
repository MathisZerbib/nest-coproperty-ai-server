import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

declare module 'express' {
  export interface Request {
    user?: JwtPayload;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('[Auth Guard] No token provided in request');
      throw new UnauthorizedException();
    }

    try {
      this.logger.debug(`[Auth Guard] Verifying token: ${token}`);
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtConstants.secret,
      });

      this.logger.debug(
        `[Auth Guard] Token verified successfully:
        - User ID: ${payload.sub}
        - Email: ${payload.email}
        - Role: ${payload.role}
        - Expires: ${new Date(payload.exp * 1000).toISOString()}
        - Issued At: ${new Date(payload.iat * 1000).toISOString()}`,
      );

      request['user'] = payload;
      return true;
    } catch (error) {
      this.logger.error(
        `[Auth Guard] Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

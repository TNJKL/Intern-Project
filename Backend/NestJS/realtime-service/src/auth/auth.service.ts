import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  fullName?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface VerifyResult {
  valid: boolean;
  userId?: string;
  email?: string;
  role?: string;
  fullName?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis;

  constructor(private jwtService: JwtService) {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis connection failed, continuing without Redis');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });
  }

  async onModuleInit() {
    try {
      await this.redis.connect();
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.warn('Redis connection failed, continuing without Redis blacklist check');
    }
  }

  async verifyToken(token: string): Promise<VerifyResult> {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      throw new Error('JWT_SECRET_KEY environment variable is required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      const isBlacklisted = await this.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        fullName: payload.fullName,
      };
    } catch {
      return { valid: false };
    }
  }

  async isTokenBlacklisted(jti: string | undefined): Promise<boolean> {
    if (!jti) return false;

    try {
      if (this.redis.status !== 'ready') {
        return false;
      }
      const result = await this.redis.get(`blacklist:${jti}`);
      return result === '1';
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  getJtiFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.jti || null;
    } catch {
      return null;
    }
  }
}

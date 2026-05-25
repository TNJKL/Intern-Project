import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['accessToken'];
          }
          if (!token && req && req.headers && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').map((c) => c.trim());
            const cookie = cookies.find((c) => c.startsWith('accessToken='));
            if (cookie) {
              token = cookie.substring('accessToken='.length);
            }
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: Buffer.from(process.env.JWT_SECRET_KEY || '', 'base64'),
    });
  }

  async validate(payload: any) {
    const isBlacklisted = await this.authService.isTokenBlacklisted(payload.jti);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    };
  }
}

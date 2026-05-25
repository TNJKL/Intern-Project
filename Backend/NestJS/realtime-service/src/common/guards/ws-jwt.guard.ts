import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();

    this.logger.debug(`Handshake auth: ${JSON.stringify(client.handshake?.auth)}`);
    this.logger.debug(`Authorization header: ${client.handshake?.headers?.authorization ? 'Present' : 'Absent'}`);

    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '');

    this.logger.debug(`Extracted token: ${token ? token.substring(0, 15) + '...' : 'none'}`);

    if (!token) {
      this.logger.warn('No token provided in handshake');
      throw new WsException('Unauthorized: No token provided');
    }

    const result = await this.authService.verifyToken(token);
    this.logger.debug(`Token verification result: ${JSON.stringify(result)}`);

    if (!result.valid) {
      this.logger.warn('Invalid token verification');
      throw new WsException('Unauthorized: Invalid token');
    }

    (client as any).user = result;
    return true;
  }
}

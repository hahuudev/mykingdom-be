import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ROLES_KEY } from '@/shared/decorator/adminRoles.decorator';
import { AdminRoles } from '@/shared/enums';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('auth.secret'),
      });

      // Check if token is admin token
      if (payload.type !== 'ADMIN_ACCESS_TOKEN') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check roles if specified
      const requiredRoles = this.reflector.getAllAndOverride<AdminRoles[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles) {
        const hasRole = requiredRoles.some(role => 
          role === (payload.role === 'SUPER_ADMIN' ? AdminRoles.IS_SUPER_ADMIN : AdminRoles.IS_ADMIN)
        );
        
        if (!hasRole) {
          throw new UnauthorizedException('Insufficient permissions');
        }
      }

      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
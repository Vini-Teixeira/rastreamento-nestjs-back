import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FlexibleAuthGuard } from '../flexible-auth.guard';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private flexibleAuthGuard: FlexibleAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isAuthenticated = await this.flexibleAuthGuard.canActivate(context);
      if (!isAuthenticated) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      throw new UnauthorizedException('Sua sessão é inválida ou expirou.');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }
    return true;
  }
}

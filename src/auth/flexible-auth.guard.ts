import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';

@Injectable()
export class FlexibleAuthGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private firebaseGuard: FirebaseAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const canActivateJwt = await this.jwtGuard.canActivate(context);
      if (canActivateJwt) {
        return true;
      }
    } catch (error) {}

    try {
      const canActivateFirebase = await this.firebaseGuard.canActivate(context);
      if (canActivateFirebase) {
        return true;
      }
    } catch (error) {}
    return false;
  }
}

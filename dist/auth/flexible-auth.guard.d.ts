import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FirebaseAuthGuard } from './firebase-auth/firebase-auth.guard';
export declare class FlexibleAuthGuard implements CanActivate {
    private jwtGuard;
    private firebaseGuard;
    constructor(jwtGuard: JwtAuthGuard, firebaseGuard: FirebaseAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}

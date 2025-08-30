import { CanActivate, ExecutionContext } from '@nestjs/common';
import * as admin from 'firebase-admin';
export declare class FirebaseAuthGuard implements CanActivate {
    private readonly firebase;
    constructor(firebase: admin.app.App);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}

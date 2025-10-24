import { CanActivate, ExecutionContext } from '@nestjs/common';
import { FlexibleAuthGuard } from '../flexible-auth.guard';
export declare class AdminAuthGuard implements CanActivate {
    private flexibleAuthGuard;
    constructor(flexibleAuthGuard: FlexibleAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}

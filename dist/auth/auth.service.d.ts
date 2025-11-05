import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { AdminDocument } from 'src/admin/schemas/admin.schema';
export declare class AuthService {
    private jwtService;
    private readonly firebase;
    private readonly adminModel;
    constructor(jwtService: JwtService, firebase: admin.app.App, adminModel: Model<AdminDocument>);
    loginDriver(driver: any): Promise<{
        access_token: string;
        firebase_token: string;
    }>;
    loginLojista(lojista: any): Promise<{
        access_token: string;
    }>;
    loginComFirebaseToken(firebaseToken: string): Promise<{
        access_token: string;
    }>;
    registerAdminWithFirebaseToken(firebaseToken: string): Promise<AdminDocument>;
}

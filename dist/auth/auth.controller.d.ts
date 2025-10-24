import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    loginComFirebase(firebaseLoginDto: FirebaseLoginDto): Promise<{
        access_token: string;
    }>;
    registerAdmin(FirebaseLoginDto: FirebaseLoginDto): Promise<import("../admin/schemas/admin.schema").AdminDocument>;
}

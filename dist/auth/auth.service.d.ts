import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    loginDriver(driver: any): Promise<{
        access_token: string;
    }>;
    loginLojista(lojista: any): Promise<{
        access_token: string;
    }>;
}

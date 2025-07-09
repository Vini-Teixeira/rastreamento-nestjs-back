import { AuthService } from './auth.service';
import { DriverLoginDto } from './dto/driver-login.dto';
import { LojistaLoginDto } from './dto/lojista-login.dto';
import { CreateLojistaDto } from 'src/lojistas/dto/create-lojista.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    driverLogin(driverLoginDto: DriverLoginDto): Promise<{
        message: string;
        access_token: string;
    }>;
    registerLojista(createLojistaDto: CreateLojistaDto): Promise<import("../lojistas/schemas/lojista.schema").Lojista>;
    lojistaLogin(lojistaLoginDto: LojistaLoginDto): Promise<{
        message: string;
        access_token: string;
    }>;
}

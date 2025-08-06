import { AuthService } from './auth.service';
import { LojistasService } from 'src/lojistas/lojistas.service';
import { LojistaLoginDto } from './dto/lojista-login.dto';
export declare class AuthController {
    private readonly authService;
    private readonly lojistasService;
    constructor(authService: AuthService, lojistasService: LojistasService);
    lojistaLogin(lojistaLoginDto: LojistaLoginDto): Promise<{
        access_token: string;
    }>;
}

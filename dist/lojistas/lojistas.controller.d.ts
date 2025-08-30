import { LojistasService } from './lojistas.service';
import { AuthService } from '../auth/auth.service';
import { LojistaLoginDto } from '../auth/dto/lojista-login.dto';
export declare class LojistasController {
    private readonly lojistasService;
    private readonly authService;
    constructor(lojistasService: LojistasService, authService: AuthService);
    login(lojistaLoginDto: LojistaLoginDto): Promise<{
        access_token: string;
    }>;
}

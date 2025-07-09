import { JwtService } from '@nestjs/jwt';
import { EntregadoresService } from 'src/entregadores/entregadores.service';
import { EntregadorDocument } from 'src/entregadores/schemas/entregador.schema';
import { CreateLojistaDto } from 'src/lojistas/dto/create-lojista.dto';
import { LojistasService } from 'src/lojistas/lojistas.service';
export declare class AuthService {
    private entregadoresService;
    private lojistasService;
    private jwtService;
    constructor(entregadoresService: EntregadoresService, lojistasService: LojistasService, jwtService: JwtService);
    validateDriver(telefone: string, pass: string): Promise<Omit<EntregadorDocument, 'password'> | null>;
    loginDriver(driver: any): Promise<{
        message: string;
        access_token: string;
    }>;
    registerLojista(createLojistaDto: CreateLojistaDto): Promise<import("../lojistas/schemas/lojista.schema").Lojista>;
    validateLojista(email: string, pass: string): Promise<any>;
    loginLojista(lojista: any): Promise<{
        message: string;
        access_token: string;
    }>;
}

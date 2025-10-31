import { LojistasService } from './lojistas.service';
import { AuthService } from '../auth/auth.service';
import { LojistaLoginDto } from '../auth/dto/lojista-login.dto';
import { CreateLojistaDto } from './dto/create-lojista.dto';
import { UpdateLojistaDto } from './dto/update-lojista.dto';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';
export declare class LojistasController {
    private readonly lojistasService;
    private readonly authService;
    constructor(lojistasService: LojistasService, authService: AuthService);
    findAll(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/lojista.schema").LojistaDocument, {}> & import("./schemas/lojista.schema").Lojista & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    login(lojistaLoginDto: LojistaLoginDto): Promise<{
        access_token: string;
    }>;
    create(createLojistaDto: CreateLojistaDto): Promise<import("./schemas/lojista.schema").Lojista>;
    update(id: string, updateLojistaDto: UpdateLojistaDto): Promise<import("./schemas/lojista.schema").Lojista>;
    delete(id: string): Promise<{
        message: string;
    }>;
    getDashboardSummary(request: {
        user: AuthenticatedUser;
    }): Promise<{
        concluidas: any;
        emAndamento: any;
        canceladas: any;
    }>;
    findAllForSelection(): Promise<import("./schemas/lojista.schema").Lojista[]>;
}

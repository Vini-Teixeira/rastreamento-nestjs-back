import { SocorrosService } from './socorros.service';
import { CreateSocorroDto } from './dto/create-socorro.dto';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';
import { ChegueiAoLocalDto } from './dto/cheguei-ao-local.dto';
import { FinalizarSocorroDto } from './dto/finalizar-socorro.dto';
import { RejeicaoDto } from 'src/entregas/dto/rejeicao.dto';
export declare class SocorrosController {
    private readonly socorrosService;
    constructor(socorrosService: SocorrosService);
    findMySocorros(request: {
        user: AuthenticatedUser;
    }): Promise<import("./schemas/socorro.schema").Socorro[]>;
    create(createSocorroDto: CreateSocorroDto, request: {
        user: AuthenticatedUser;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAllByLojista(request: {
        user: AuthenticatedUser;
    }, page?: string, limit?: string, status?: string): Promise<{
        data: import("./schemas/socorro.schema").Socorro[];
        total: number;
        page: number;
        limit: number;
    }>;
    recusarSocorro(socorroId: string, request: {
        user: AuthenticatedUser;
    }, rejeicaoDto: RejeicaoDto): Promise<{
        message: string;
    }>;
    accept(socorroId: string, request: {
        user: AuthenticatedUser;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    iniciarDeslocamento(socorroId: string, request: {
        user: AuthenticatedUser;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    chegueiAoLocal(socorroId: string, request: {
        user: AuthenticatedUser;
    }, chegueiAoLocalDto: ChegueiAoLocalDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    liberarCheckIn(socorroId: string, request: {
        user: AuthenticatedUser;
    }): Promise<import("./schemas/socorro.schema").Socorro>;
    finalizarSocorro(socorroId: string, request: {
        user: AuthenticatedUser;
    }, finalizarSocorroDto: FinalizarSocorroDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}

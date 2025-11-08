import { SocorrosService } from './socorros.service';
import { CreateSocorroDto } from './dto/create-socorro.dto';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';
import { ChegueiAoLocalDto } from './dto/cheguei-ao-local.dto';
import { FinalizarSocorroDto } from './dto/finalizar-socorro.dto';
export declare class SocorrosController {
    private readonly socorrosService;
    constructor(socorrosService: SocorrosService);
    create(createSocorroDto: CreateSocorroDto, request: {
        user: AuthenticatedUser;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findMySocorros(request: {
        user: AuthenticatedUser;
    }): Promise<import("./schemas/socorro.schema").Socorro[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/socorro.schema").Socorro, {}> & import("./schemas/socorro.schema").Socorro & Required<{
        _id: unknown;
    }> & {
        __v: number;
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

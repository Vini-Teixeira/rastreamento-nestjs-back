import { EntregadoresService } from './entregadores.service';
import { AuthService } from 'src/auth/auth.service';
import { DriverLoginDto } from 'src/auth/dto/driver-login.dto';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
export declare class EntregadoresController {
    private readonly entregadoresService;
    private readonly authService;
    constructor(entregadoresService: EntregadoresService, authService: AuthService);
    login(driverLoginDto: DriverLoginDto): Promise<{
        access_token: string;
    }>;
    updateMyLocation(req: any, updateLocationDto: UpdateLocationDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    create(createEntregadorDto: CreateEntregadorDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    delete(id: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
}

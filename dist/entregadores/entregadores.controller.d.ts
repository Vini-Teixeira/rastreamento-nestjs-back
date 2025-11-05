import { Request } from 'express';
import { EntregadoresService } from './entregadores.service';
import { AuthService } from 'src/auth/auth.service';
import { DriverLoginDto } from 'src/auth/dto/driver-login.dto';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuthenticatedUser } from 'src/types/authenticated-user.type';
import { Job } from './interfaces/job.interface';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
export declare class EntregadoresController {
    private readonly entregadoresService;
    private readonly authService;
    constructor(entregadoresService: EntregadoresService, authService: AuthService);
    heartbeat(request: {
        user: AuthenticatedUser;
    }): Promise<void>;
    login(driverLoginDto: DriverLoginDto): Promise<{
        access_token: string;
        firebase_token: string;
    }>;
    logout(request: {
        user: AuthenticatedUser;
    }): Promise<void>;
    updateMyLocation(req: Request, updateLocationDto: UpdateLocationDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getMyJobs(request: {
        user: AuthenticatedUser;
    }): Promise<Job[]>;
    findAll(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }, {}> & import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(createEntregadorDto: CreateEntregadorDto): Promise<import("./schemas/entregador.schema").Entregador>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/entregador.schema").Entregador, {}> & import("./schemas/entregador.schema").Entregador & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    updateFcmToken(request: {
        user: AuthenticatedUser;
    }, updateFcmTokenDto: UpdateFcmTokenDto): Promise<void>;
}

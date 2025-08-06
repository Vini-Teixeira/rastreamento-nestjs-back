import { Model } from 'mongoose';
import { EntregadorDocument } from './schemas/entregador.schema';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
export declare class EntregadoresService {
    private entregadorModel;
    constructor(entregadorModel: Model<EntregadorDocument>);
    validatePassword(telefone: string, pass: string): Promise<EntregadorDocument | any>;
    create(createEntregadorDto: CreateEntregadorDto): Promise<EntregadorDocument>;
    findOneByPhoneWithPassword(telefone: string): Promise<EntregadorDocument | null>;
    findAll(): Promise<EntregadorDocument[]>;
    findOne(id: string): Promise<EntregadorDocument | null>;
    update(id: string, updateEntregadorDto: UpdateEntregadorDto): Promise<EntregadorDocument | null>;
    delete(id: string): Promise<EntregadorDocument | null>;
    updateLocation(driverId: string, updateLocationDto: UpdateLocationDto): Promise<EntregadorDocument>;
}

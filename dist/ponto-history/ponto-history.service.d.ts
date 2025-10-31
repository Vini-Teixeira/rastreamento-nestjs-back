import { Model, Types } from "mongoose";
import { PontoHistory, PontoHistoryDocument, PontoAction } from "./schemas/ponto-history.schema";
export declare class PontoHistoryService {
    private readonly pontoHistoryModel;
    constructor(pontoHistoryModel: Model<PontoHistoryDocument>);
    registrarPonto(driverId: Types.ObjectId, action: PontoAction): Promise<PontoHistory>;
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PontoHistory, PontoHistoryDocument, PontoAction } from "./schemas/ponto-history.schema";

@Injectable()
export class PontoHistoryService {
    constructor(
        @InjectModel(PontoHistory.name)
        private readonly pontoHistoryModel: Model<PontoHistoryDocument>,
    ) {}

    async registrarPonto(
        driverId: Types.ObjectId,
        action: PontoAction
    ): Promise<PontoHistory> {
        const novoRegistro = new this.pontoHistoryModel({
            driverId, action
        })
        return novoRegistro.save()
    }
}
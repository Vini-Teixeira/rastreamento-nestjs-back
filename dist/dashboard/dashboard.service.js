"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const delivery_schema_1 = require("../entregas/schemas/delivery.schema");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
let DashboardService = class DashboardService {
    constructor(deliveryModel) {
        this.deliveryModel = deliveryModel;
    }
    async getDashboardSummary() {
        const timeZone = 'America/Sao_Paulo';
        const agora = new Date();
        const hojeInicio = (0, date_fns_1.startOfDay)((0, date_fns_tz_1.toZonedTime)(agora, timeZone));
        hojeInicio.setHours(0, 0, 0, 0);
        const hojeFim = (0, date_fns_1.endOfDay)((0, date_fns_tz_1.toZonedTime)(agora, timeZone));
        hojeFim.setHours(23, 59, 59, 999);
        const [summaryResult, rankingResult] = await Promise.all([
            this.deliveryModel.aggregate([
                { $match: { createdAt: { $gte: hojeInicio, $lte: hojeFim } } },
                {
                    $group: {
                        _id: null,
                        concluidas: {
                            $sum: {
                                $cond: [{ $eq: [{ $toUpper: '$status' }, 'DELIVERED'] }, 1, 0],
                            },
                        },
                        emAndamento: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [{ $toUpper: '$status' }, ['ACCEPTED', 'ON_THE_WAY']],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        canceladas: {
                            $sum: {
                                $cond: [{ $eq: [{ $toUpper: '$status' }, 'CANCELLED'] }, 1, 0],
                            },
                        },
                        valorTotalArrecadado: {
                            $sum: {
                                $cond: [
                                    { $eq: [{ $toUpper: '$status' }, 'DELIVERED'] },
                                    '$valor',
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            this.deliveryModel.aggregate([
                {
                    $match: {
                        status: 'DELIVERED',
                        createdAt: { $gte: hojeInicio, $lte: hojeFim },
                    },
                },
                { $group: { _id: '$driverId', totalEntregas: { $sum: 1 } } },
                { $sort: { totalEntregas: -1 } },
                { $limit: 3 },
                {
                    $lookup: {
                        from: 'entregadores',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'entregadorInfo',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        driverId: '$_id',
                        nome: { $arrayElemAt: ['$entregadorInfo.nome', 0] },
                        totalEntregas: '$totalEntregas',
                    },
                },
            ]),
        ]);
        const summaryData = summaryResult[0] || {
            concluidas: 0,
            emAndamento: 0,
            canceladas: 0,
            valorTotalArrecadado: 0,
        };
        const response = {
            resumoDoDia: {
                concluidas: summaryData.concluidas,
                emAndamento: summaryData.emAndamento,
                canceladas: summaryData.canceladas,
            },
            topEntregadores: rankingResult,
            financeiro: {
                valorTotalArrecadado: summaryData.valorTotalArrecadado,
                moeda: 'BRL',
            },
            dataReferencia: new Date(),
        };
        return response;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map
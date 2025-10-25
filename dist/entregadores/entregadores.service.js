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
var EntregadoresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregadoresService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const entregador_schema_1 = require("./schemas/entregador.schema");
const bcrypt = require("bcrypt");
const delivery_schema_1 = require("../entregas/schemas/delivery.schema");
const delivery_status_enum_1 = require("../entregas/enums/delivery-status.enum");
const socorro_schema_1 = require("../socorros/schemas/socorro.schema");
const ponto_history_service_1 = require("../ponto-history/ponto-history.service");
const ponto_history_schema_1 = require("../ponto-history/schemas/ponto-history.schema");
const schedule_1 = require("@nestjs/schedule");
const logger = new common_1.Logger('EntregadoresService');
let EntregadoresService = EntregadoresService_1 = class EntregadoresService {
    constructor(deliveryModel, socorroModel, entregadorModel, pontoHistoryService) {
        this.deliveryModel = deliveryModel;
        this.socorroModel = socorroModel;
        this.entregadorModel = entregadorModel;
        this.pontoHistoryService = pontoHistoryService;
        this.logger = new common_1.Logger(EntregadoresService_1.name);
    }
    async updateHeartbeat(driverId) {
        const result = await this.entregadorModel
            .updateOne({ _id: driverId }, {
            $set: {
                lastHeartbeat: new Date(),
                ativo: true,
            },
        })
            .exec();
        if (result.modifiedCount === 0) {
            throw new common_1.NotFoundException(`Entregador com ID ${driverId} não encontrado para o hearbeat.`);
        }
    }
    async markAsActive(driverId) {
        const driverObjectId = new mongoose_2.Types.ObjectId(driverId);
        await Promise.all([
            this.entregadorModel.updateOne({ _id: driverObjectId }, {
                $set: {
                    ativo: true,
                    lastHeartbeat: new Date()
                }
            }).exec(),
            this.pontoHistoryService.registrarPonto(driverObjectId, ponto_history_schema_1.PontoAction.LOGIN)
        ]);
        this.logger.log(`Entregador ${driverId} reativado via login e ponto registrado.`);
    }
    async registerLogout(driverId) {
        const driverObjectId = new mongoose_2.Types.ObjectId(driverId);
        await this.pontoHistoryService.registrarPonto(driverObjectId, ponto_history_schema_1.PontoAction.LOGOUT);
        this.logger.log(`Ponto de Logout registrado para o entregador ${driverId}.`);
    }
    async validatePassword(telefone, pass) {
        const driver = await this.entregadorModel
            .findOne({ telefone })
            .select('+password')
            .exec();
        if (driver && (await bcrypt.compare(pass, driver.password))) {
            const { password, ...result } = driver.toObject();
            return result;
        }
        return null;
    }
    async create(createEntregadorDto) {
        const newEntregador = new this.entregadorModel({
            ...createEntregadorDto,
            ativo: true,
        });
        return newEntregador.save();
    }
    async update(id, updateEntregadorDto) {
        const entregador = await this.entregadorModel.findById(id).exec();
        if (!entregador) {
            return null;
        }
        Object.assign(entregador, updateEntregadorDto);
        return entregador.save();
    }
    async findOneByPhoneWithPassword(telefone) {
        return this.entregadorModel
            .findOne({ telefone })
            .select('+password')
            .exec();
    }
    async findOne(id) {
        return this.entregadorModel.findById(id).exec();
    }
    async findAll(query) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const [entregadores, total] = await Promise.all([
            this.entregadorModel
                .find()
                .sort({ nome: 1 })
                .populate('lojaBaseId', 'nomeFantasia')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.entregadorModel.countDocuments(),
        ]);
        return {
            data: entregadores,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async delete(id) {
        return this.entregadorModel.findByIdAndDelete(id).exec();
    }
    async updateLocation(driverId, updateLocationDto) {
        const { lat, lng } = updateLocationDto;
        logger.log(`updateLocation -> driverId: ${driverId} | lat:${lat} lng:${lng}`);
        const geoJsonPoint = {
            type: 'Point',
            coordinates: [lng, lat],
        };
        const updatedDriver = await this.entregadorModel
            .findByIdAndUpdate(driverId, { $set: { localizacao: geoJsonPoint } }, { new: true })
            .exec();
        if (!updatedDriver) {
            logger.warn(`Entregador não encontrado (id: ${driverId}) ao tentar atualizar localização.`);
            throw new common_1.NotFoundException(`Entregador com ID ${driverId} não encontrado.`);
        }
        logger.log(`updateLocation -> sucesso para entregador ${driverId}`);
        return updatedDriver;
    }
    async findMyJobs(driverId) {
        const activeStatuses = [
            delivery_status_enum_1.DeliveryStatus.PENDENTE,
            delivery_status_enum_1.DeliveryStatus.ACEITO,
            delivery_status_enum_1.DeliveryStatus.A_CAMINHO,
            delivery_status_enum_1.DeliveryStatus.EM_ATENDIMENTO,
        ];
        const driverObjectId = new mongoose_2.Types.ObjectId(driverId);
        const [deliveries, socorros] = await Promise.all([
            this.deliveryModel
                .find({
                driverId: driverObjectId,
                status: { $in: activeStatuses },
            })
                .exec(),
            this.socorroModel
                .find({
                driverId: driverObjectId,
                status: { $in: activeStatuses },
            })
                .exec(),
        ]);
        const mappedDeliveries = deliveries.map((d) => ({
            ...d.toObject(),
            createdAt: d.createdAt ?? new Date(),
            type: 'entrega',
        }));
        const mappedSocorros = socorros.map((s) => ({
            ...s.toObject(),
            createdAt: s.createdAt ?? new Date(),
            type: 'socorro',
        }));
        const allJobs = [...mappedDeliveries, ...mappedSocorros];
        allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return allJobs;
    }
    async updateFcmToken(driverId, fcmToken) {
        await this.entregadorModel.updateOne({ _id: driverId }, { $set: { fcmToken: fcmToken } }).exec();
        this.logger.log(`FCM token atualizado para o entregador ${driverId}.`);
    }
    async checkStaleHeartbeats() {
        this.logger.log('A verificar heartbeats de entregadores...');
        const threshold = new Date();
        threshold.setMinutes(threshold.getMinutes() - 2);
        const query = {
            ativo: true,
            lastHeartbeat: { $lt: threshold },
        };
        const result = await this.entregadorModel
            .updateMany(query, { $set: { ativo: false } })
            .exec();
        if (result.modifiedCount > 0) {
            this.logger.warn(`Desativados ${result.modifiedCount} entregadores por inatividade.`);
        }
    }
};
exports.EntregadoresService = EntregadoresService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EntregadoresService.prototype, "checkStaleHeartbeats", null);
exports.EntregadoresService = EntregadoresService = EntregadoresService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __param(1, (0, mongoose_1.InjectModel)(socorro_schema_1.Socorro.name)),
    __param(2, (0, mongoose_1.InjectModel)(entregador_schema_1.Entregador.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        ponto_history_service_1.PontoHistoryService])
], EntregadoresService);
//# sourceMappingURL=entregadores.service.js.map
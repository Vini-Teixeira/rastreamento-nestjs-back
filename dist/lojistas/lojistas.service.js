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
exports.LojistasService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const lojista_schema_1 = require("./schemas/lojista.schema");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const delivery_schema_1 = require("../entregas/schemas/delivery.schema");
const socorro_schema_1 = require("../socorros/schemas/socorro.schema");
const delivery_status_enum_1 = require("../entregas/enums/delivery-status.enum");
let LojistasService = class LojistasService {
    constructor(lojistaModel, deliveryModel, socorroModel, googleMapsService) {
        this.lojistaModel = lojistaModel;
        this.deliveryModel = deliveryModel;
        this.socorroModel = socorroModel;
        this.googleMapsService = googleMapsService;
    }
    async getDashboardSummary(solicitanteId) {
        const id = new mongoose_2.Types.ObjectId(solicitanteId);
        const statusConcluido = [
            delivery_status_enum_1.DeliveryStatus.FINALIZADO
        ];
        const statusEmAndamento = [
            delivery_status_enum_1.DeliveryStatus.PENDENTE,
            delivery_status_enum_1.DeliveryStatus.ACEITO,
            delivery_status_enum_1.DeliveryStatus.A_CAMINHO,
            delivery_status_enum_1.DeliveryStatus.EM_ATENDIMENTO,
        ];
        const statusCancelado = [
            delivery_status_enum_1.DeliveryStatus.CANCELADO
        ];
        const deliverySummary = await this.deliveryModel.aggregate([
            { $match: { solicitanteId: id } },
            {
                $group: {
                    _id: null,
                    concluidas: { $sum: { $cond: [{ $in: ['$status', statusConcluido] }, 1, 0] } },
                    emAndamento: { $sum: { $cond: [{ $in: ['$status', statusEmAndamento] }, 1, 0] } },
                    canceladas: { $sum: { $cond: [{ $in: ['$status', statusCancelado] }, 1, 0] } },
                },
            },
        ]);
        const socorroSummary = await this.socorroModel.aggregate([
            { $match: { solicitanteId: id } },
            {
                $group: {
                    _id: null,
                    concluidas: { $sum: { $cond: [{ $in: ['$status', statusConcluido] }, 1, 0] } },
                    emAndamento: { $sum: { $cond: [{ $in: ['$status', statusEmAndamento] }, 1, 0] } },
                    canceladas: { $sum: { $cond: [{ $in: ['$status', statusCancelado] }, 1, 0] } },
                },
            },
        ]);
        const totalConcluidas = (deliverySummary[0]?.concluidas || 0) + (socorroSummary[0]?.concluidas || 0);
        const totalEmAndamento = (deliverySummary[0]?.emAndamento || 0) + (socorroSummary[0]?.emAndamento || 0);
        const totalCanceladas = (deliverySummary[0]?.canceladas || 0) + (socorroSummary[0]?.canceladas || 0);
        return {
            concluidas: totalConcluidas,
            emAndamento: totalEmAndamento,
            canceladas: totalCanceladas,
        };
    }
    async create(createLojistaDto) {
        const { email, endereco } = createLojistaDto;
        const existingLojista = await this.findOneByEmail(email);
        if (existingLojista) {
            throw new common_1.ConflictException('Este email já está cadastrado.');
        }
        const coordinates = await this.googleMapsService.geocodeAddress(endereco);
        const dadosCompletosDoLojista = {
            ...createLojistaDto,
            coordinates: coordinates,
        };
        const createdLojista = new this.lojistaModel(dadosCompletosDoLojista);
        return createdLojista.save();
    }
    async update(id, updateLojistaDto) {
        if (updateLojistaDto.password) {
            const salt = await bcrypt.genSalt();
            updateLojistaDto.password = await bcrypt.hash(updateLojistaDto.password, salt);
        }
        if (updateLojistaDto.endereco) {
            const coordinates = await this.googleMapsService.geocodeAddress(updateLojistaDto.endereco);
            updateLojistaDto.coordinates = coordinates;
        }
        return this.lojistaModel.findByIdAndUpdate(id, updateLojistaDto, { new: true }).exec();
    }
    async delete(id) {
        return this.lojistaModel.findByIdAndDelete(id).exec();
    }
    async findAll(query) {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const [lojistas, total] = await Promise.all([
            this.lojistaModel
                .find()
                .sort({ nomeFantasia: 1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.lojistaModel.countDocuments(),
        ]);
        return {
            data: lojistas,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOneByEmail(email) {
        return this.lojistaModel.findOne({ email }).exec();
    }
    async findOneByEmailWithPassword(email) {
        return this.lojistaModel.findOne({ email }).select('+password').exec();
    }
    async validatePassword(email, pass) {
        const lojista = await this.findOneByEmailWithPassword(email);
        if (lojista && (await bcrypt.compare(pass, lojista.password))) {
            const { password, ...result } = lojista.toObject();
            return result;
        }
        return null;
    }
    async findAllForSelection() {
        return this.lojistaModel.find().select('_id nomeFantasia').exec();
    }
};
exports.LojistasService = LojistasService;
exports.LojistasService = LojistasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lojista_schema_1.Lojista.name)),
    __param(1, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __param(2, (0, mongoose_1.InjectModel)(socorro_schema_1.Socorro.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        google_maps_service_1.GoogleMapsService])
], LojistasService);
//# sourceMappingURL=lojistas.service.js.map
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
exports.SocorrosService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const socorro_schema_1 = require("./schemas/socorro.schema");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const entregas_service_1 = require("../entregas/entregas.service");
const entregadores_gateway_1 = require("../entregadores/entregadores.gateway");
const entregador_schema_1 = require("../entregadores/schemas/entregador.schema");
const fcm_service_1 = require("../fcm/fcm.service");
let SocorrosService = class SocorrosService {
    constructor(socorroModel, entregadorModel, connection, googleMapsService, entregasService, entregadoresGateway, fcmService) {
        this.socorroModel = socorroModel;
        this.entregadorModel = entregadorModel;
        this.connection = connection;
        this.googleMapsService = googleMapsService;
        this.entregasService = entregasService;
        this.entregadoresGateway = entregadoresGateway;
        this.fcmService = fcmService;
    }
    async create(createSocorroDto, lojistaId) {
        const clientCoordinates = await this.googleMapsService.geocodeAddress(createSocorroDto.clientLocation.address);
        const nearestDriver = await this.entregasService.findNearestDriverInfo(clientCoordinates);
        if (!nearestDriver) {
            throw new common_1.NotFoundException('Nenhum entregador disponível encontrado.');
        }
        let codigoUnico = '';
        let codigoJaExiste = true;
        while (codigoJaExiste) {
            codigoUnico = 'S-' + this.gerarCodigoAleatorio(6);
            const socorroExistente = await this.socorroModel
                .findOne({ codigoSocorro: codigoUnico })
                .exec();
            if (!socorroExistente) {
                codigoJaExiste = false;
            }
        }
        const newSocorro = new this.socorroModel({
            lojistaId,
            driverId: nearestDriver._id,
            clientLocation: {
                address: createSocorroDto.clientLocation.address,
                coordinates: clientCoordinates,
            },
            serviceDescription: createSocorroDto.serviceDescription,
            codigoSocorro: codigoUnico,
        });
        const savedSocorro = await newSocorro.save();
        this.entregadoresGateway.notifyNewDelivery(nearestDriver._id.toString(), savedSocorro.toObject());
        if (nearestDriver.fcmToken) {
            this.fcmService.sendPushNotification(nearestDriver.fcmToken, 'Novo Socorro Solicitado!', `Local: ${savedSocorro.clientLocation.address}`, { deliveryId: savedSocorro.id, type: 'socorro' });
        }
        return savedSocorro;
    }
    async findOne(id) {
        const socorro = await this.socorroModel.findById(id).exec();
        if (!socorro) {
            throw new common_1.NotFoundException(`Socorro com ID ${id} não encontrado.`);
        }
        return socorro;
    }
    async acceptSocorro(socorroId, driverId) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const socorro = await this.socorroModel
                .findById(socorroId)
                .session(session);
            if (!socorro) {
                throw new common_1.NotFoundException('Socorro não encontrado.');
            }
            if (socorro.driverId?.toString() !== driverId) {
                throw new common_1.ForbiddenException('Este socorro já foi atribuído a outro entregador.');
            }
            if (socorro.status !== socorro_schema_1.SocorroStatus.PENDING) {
                throw new common_1.BadRequestException('Este socorro não está mais pendente.');
            }
            socorro.driverId = new mongoose_2.Types.ObjectId(driverId);
            socorro.status = socorro_schema_1.SocorroStatus.ACCEPTED;
            const socorroSavePromise = socorro.save({ session });
            const driverUpdatePromise = this.entregadorModel
                .updateOne({ _id: driverId }, { $set: { emEntrega: true, recusasConsecutivas: 0 } }, { session })
                .exec();
            const [savedSocorro] = await Promise.all([
                socorroSavePromise,
                driverUpdatePromise,
            ]);
            await session.commitTransaction();
            return savedSocorro;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async iniciarDeslocamento(socorroId, driverId) {
        const socorro = await this.socorroModel.findById(socorroId).exec();
        if (!socorro) {
            throw new common_1.NotFoundException('Socorro não encontrado');
        }
        if (socorro.driverId?.toString() !== driverId) {
            throw new common_1.ForbiddenException('Este Socorro pertence a outro entregador');
        }
        if (socorro.status !== socorro_schema_1.SocorroStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Só é possível iniciar o deslocamento de um socorro que já foi aceito por você.');
        }
        socorro.status = socorro_schema_1.SocorroStatus.ON_THE_WAY;
        const savedSocorro = await socorro.save();
        this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
        return savedSocorro;
    }
    async chegueiAoLocal(socorroId, driverId, chegueiAoLocalDto) {
        const socorro = await this.socorroModel.findById(socorroId).exec();
        if (!socorro) {
            throw new common_1.NotFoundException('Socorro não encontrado.');
        }
        if (socorro.driverId?.toString() !== driverId) {
            throw new common_1.ForbiddenException('Este socorro não lhe pertence.');
        }
        if (socorro.status !== socorro_schema_1.SocorroStatus.ON_THE_WAY) {
            throw new common_1.BadRequestException('Apenas socorros "a caminho" podem ser marcados como "cheguei ao local".');
        }
        if (socorro.codigoSocorro.toUpperCase() !==
            chegueiAoLocalDto.codigoSocorro.toUpperCase() &&
            !socorro.checkInLiberadoManualmente) {
            throw new common_1.BadRequestException('Código de confirmação inválido.');
        }
        socorro.status = socorro_schema_1.SocorroStatus.ON_SITE;
        const savedSocorro = await socorro.save();
        this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
        return savedSocorro;
    }
    async liberarCheckInManual(socorroId, lojistaId) {
        const socorro = await this.socorroModel.findById(socorroId).exec();
        if (!socorro) {
            throw new common_1.NotFoundException(`Socorro com ID ${socorroId} não encontrado.`);
        }
        if (socorro.solicitanteId.toString() !== lojistaId) {
            throw new common_1.ForbiddenException('Você não tem permissão para modificar este socorro.');
        }
        const statusPermitidos = [socorro_schema_1.SocorroStatus.ACCEPTED, socorro_schema_1.SocorroStatus.ON_THE_WAY];
        if (!statusPermitidos.includes(socorro.status)) {
            throw new common_1.BadRequestException(`Não é possível liberar o check-in para um socorro com status "${socorro.status}".`);
        }
        socorro.checkInLiberadoManualmente = true;
        const savedSocorro = await socorro.save();
        this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
        return savedSocorro;
    }
    async finalizarSocorro(socorroId, driverId, finalizarSocorroDto) {
        const socorro = await this.socorroModel.findById(socorroId).exec();
        if (!socorro) {
            throw new common_1.NotFoundException('Socorro não encontrado.');
        }
        if (socorro.driverId?.toString() !== driverId) {
            throw new common_1.ForbiddenException('Este socorro não lhe pertence.');
        }
        if (socorro.status !== socorro_schema_1.SocorroStatus.ON_SITE) {
            throw new common_1.BadRequestException('Apenas socorros com status "no local" podem ser finalizados.');
        }
        socorro.fotos = finalizarSocorroDto.fotos;
        socorro.status = socorro_schema_1.SocorroStatus.COMPLETED;
        const savedSocorro = await socorro.save();
        this.entregadoresGateway.notifyDeliveryStatusChanged(savedSocorro);
        return savedSocorro;
    }
    gerarCodigoAleatorio(tamanho) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let resultado = '';
        for (let i = 0; i < tamanho; i++) {
            resultado += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return resultado;
    }
};
exports.SocorrosService = SocorrosService;
exports.SocorrosService = SocorrosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(socorro_schema_1.Socorro.name)),
    __param(1, (0, mongoose_1.InjectModel)(entregador_schema_1.Entregador.name)),
    __param(2, (0, mongoose_1.InjectConnection)()),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregadores_gateway_1.EntregadoresGateway))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Connection,
        google_maps_service_1.GoogleMapsService,
        entregas_service_1.EntregasService,
        entregadores_gateway_1.EntregadoresGateway,
        fcm_service_1.FcmService])
], SocorrosService);
//# sourceMappingURL=socorros.service.js.map
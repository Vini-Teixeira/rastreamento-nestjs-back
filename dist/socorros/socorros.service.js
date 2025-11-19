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
var SocorrosService_1;
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
const schedule_1 = require("@nestjs/schedule");
const fcm_service_1 = require("../fcm/fcm.service");
const lojistas_service_1 = require("../lojistas/lojistas.service");
let SocorrosService = SocorrosService_1 = class SocorrosService {
    constructor(socorroModel, entregadorModel, connection, googleMapsService, entregasService, lojistasService, entregadoresGateway, schedulerRegistry, fcmService) {
        this.socorroModel = socorroModel;
        this.entregadorModel = entregadorModel;
        this.connection = connection;
        this.googleMapsService = googleMapsService;
        this.entregasService = entregasService;
        this.lojistasService = lojistasService;
        this.entregadoresGateway = entregadoresGateway;
        this.schedulerRegistry = schedulerRegistry;
        this.fcmService = fcmService;
        this.logger = new common_1.Logger(SocorrosService_1.name);
    }
    async recusarSocorro(socorroId, driverId, rejeicaoDto) {
        const timeoutName = `socorro-timeout-${socorroId}`;
        try {
            if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
                this.schedulerRegistry.deleteTimeout(timeoutName);
                this.logger.log(`Timeout para o Socorro ${socorroId} cancelado devido a recusa manual`);
            }
        }
        catch (e) {
            this.logger.warn(`Falha ao tentar apagar o timout ${timeoutName}. Pode já ter sido executado.`);
        }
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const socorro = await this.socorroModel.findById(socorroId).session(session);
            if (!socorro)
                throw new common_1.NotFoundException('Socorro não encontrado');
            if (socorro.driverId?.toString() !== driverId) {
                throw new common_1.ForbiddenException('Você não pode recusar um socorro que não é seu.');
            }
            if (socorro.status !== socorro_schema_1.SocorroStatus.PENDING) {
                throw new common_1.BadRequestException('Este socorro não pode mais ser recusado.');
            }
            socorro.historicoRejeicoes.push({
                ...rejeicaoDto,
                driverId: new mongoose_2.Types.ObjectId(driverId),
                timestamp: new Date()
            });
            await socorro.save({ session });
            if (socorro.historicoRejeicoes.length >= 3) {
                this.logger.warn(`O socorro ${socorroId} foi recusado ${socorro.historicoRejeicoes.length} vezes. 
          Notificando Administrador e Lojista...`);
            }
            await this._findAndReassignSocorro(socorro, session);
            await session.commitTransaction();
            return { message: 'Socorro recusado e reatribuído com sucesso.' };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async handleSocorroTimeout(socorroId, driverId) {
        this.logger.log(`Verificando timeout para o socorro ${socorroId} do entregador ${driverId}...`);
        const socorro = await this.socorroModel.findById(socorroId);
        if (socorro &&
            socorro.status === socorro_schema_1.SocorroStatus.PENDING &&
            socorro.driverId?.toString() === driverId) {
            this.logger.warn(`Timeout! Entregador ${driverId} não respondeu. Recusa automática iniciada.`);
            const rejeicaoDto = {
                motivo: 'Recusa automática',
                texto: 'O entregador não respondeu a tempo.',
            };
            await this.recusarSocorro(socorroId, driverId, rejeicaoDto);
        }
        else {
            this.logger.log(`Timeout para ${socorroId} ignorado. Socorro já foi aceito ou recusado.`);
        }
    }
    async _findAndReassignSocorro(socorro, session) {
        const novoEntregador = await this.entregadorModel.findOne({ ativo: true });
        if (novoEntregador) {
            socorro.driverId = novoEntregador._id;
            socorro.status = socorro_schema_1.SocorroStatus.PENDING;
            await socorro.save({ session });
            this.logger.log(`Socorro ${socorro.id} reatribuído para ${novoEntregador.nome}`);
        }
        else {
            this.logger.warn(`Nenhum entregador disponível para o socorro ${socorro.id}`);
        }
    }
    async findAllBySolicitanteId(solicitanteId, page, limit, status) {
        const query = { solicitanteId: new mongoose_2.Types.ObjectId(solicitanteId) };
        if (status) {
            query.status = status;
        }
        this.logger.log(`Buscando socorros para Lojista ${solicitanteId} com query ${JSON.stringify(query)}`);
        const total = await this.socorroModel.countDocuments(query);
        const data = await this.socorroModel
            .find(query)
            .populate('driverId', 'nome telefone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        return {
            data,
            total,
            page,
            limit
        };
    }
    async findAllByDriverId(driverId) {
        this.logger.log(`Buscando socorros ativos para o driverId: ${driverId}`);
        const driverObjectId = new mongoose_2.Types.ObjectId(driverId);
        return this.socorroModel
            .find({
            driverId: driverObjectId,
            status: {
                $in: [
                    socorro_schema_1.SocorroStatus.PENDING,
                    socorro_schema_1.SocorroStatus.ACCEPTED,
                    socorro_schema_1.SocorroStatus.ON_THE_WAY,
                    socorro_schema_1.SocorroStatus.ON_SITE,
                ],
            },
        })
            .sort({ createdAt: -1 })
            .exec();
    }
    async create(createSocorroDto, lojistaId) {
        this.logger.debug(`[CHECKLIST] DTO Recebido: ${JSON.stringify(createSocorroDto)}, solicitanteId=${lojistaId}`);
        const { clientLocation, serviceDescription, clienteNome, clienteTelefone, placaVeiculo, modeloVeiculo, } = createSocorroDto;
        let clientCoordinates;
        if (clientLocation.coordinates) {
            this.logger.log('Socorro: Coordenadas recebidas do frontend. Pulando geocoding.');
            clientCoordinates = {
                type: 'Point',
                coordinates: [
                    clientLocation.coordinates.lng,
                    clientLocation.coordinates.lat,
                ],
            };
        }
        else {
            this.logger.warn('Socorro: Coordenadas NÃO recebidas. Acionando geocoding manual (fallback)...');
            try {
                clientCoordinates = await this.googleMapsService.geocodeAddress(clientLocation.address);
                if (!clientCoordinates ||
                    (clientCoordinates.coordinates[0] === 0 &&
                        clientCoordinates.coordinates[1] === 0)) {
                    throw new Error('Geocoding manual (Socorro) retornou coordenadas inválidas.');
                }
            }
            catch (error) {
                this.logger.error(`Falha no geocoding manual (Socorro): ${error.message}`);
                throw new common_1.BadRequestException('O endereço do cliente (manual) não pôde ser encontrado ou é inválido.');
            }
        }
        const nearestDriver = await this.entregasService.findNearestDriverInfo(clientCoordinates);
        if (!nearestDriver) {
            throw new common_1.NotFoundException('Nenhum entregador disponível encontrado.');
        }
        this.logger.log(`Socorro: Entregador mais próximo: ${nearestDriver.nome} a ${nearestDriver.distanciaCalculada.toFixed(0)} metros.`);
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
        this.logger.log(`Socorro: Código único gerado: ${codigoUnico}`);
        const lojista = await this.lojistasService.findById(lojistaId);
        if (!lojista) {
            throw new common_1.NotFoundException("Lojista solicitante não encontrado");
        }
        const newSocorro = new this.socorroModel({
            solicitanteId: new mongoose_2.Types.ObjectId(lojistaId),
            solicitanteNome: lojista.nomeFantasia,
            driverId: nearestDriver._id,
            clientLocation: {
                address: clientLocation.address,
                coordinates: clientCoordinates,
            },
            codigoSocorro: codigoUnico,
            status: 'pendente',
            clienteNome: clienteNome,
            clienteTelefone: clienteTelefone,
            placaVeiculo: placaVeiculo,
            modeloVeiculo: modeloVeiculo,
            serviceDescription: serviceDescription,
        });
        const savedSocorro = await newSocorro.save();
        this.entregadoresGateway.notifyNewDelivery(nearestDriver._id.toString(), savedSocorro.toObject());
        this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro.toObject());
        if (nearestDriver.fcmToken) {
            this.fcmService.sendPushNotification(nearestDriver.fcmToken, `Novo Socorro de ${lojista.nomeFantasia} Solicitado!`, `Local: ${savedSocorro.clientLocation.address}`, { deliveryId: savedSocorro.id, type: 'socorro', solicitanteNome: lojista.nomeFantasia });
        }
        this.entregadoresGateway.notifyStoreSocorroCreated(savedSocorro.toObject());
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
        this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
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
        this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
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
        this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
        return savedSocorro;
    }
    async finalizarSocorro(socorroId, driverId, finalizarSocorroDto) {
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
                throw new common_1.ForbiddenException('Este socorro não lhe pertence.');
            }
            if (socorro.status !== socorro_schema_1.SocorroStatus.ON_SITE) {
                throw new common_1.BadRequestException('Apenas socorros com status "no local" podem ser finalizados.');
            }
            socorro.fotos = finalizarSocorroDto.fotos;
            socorro.status = socorro_schema_1.SocorroStatus.COMPLETED;
            const socorroSavePromise = socorro.save({ session });
            const driverUpdatePromise = this.entregadorModel
                .updateOne({ _id: new mongoose_2.Types.ObjectId(driverId) }, { $set: { emEntrega: false } }, { session })
                .exec();
            const [savedSocorro] = await Promise.all([
                socorroSavePromise,
                driverUpdatePromise,
            ]);
            await session.commitTransaction();
            this.entregadoresGateway.notifySocorroStatusChanged(savedSocorro);
            return savedSocorro;
        }
        catch (error) {
            await session.abortTransaction();
            this.logger.error(`Falha ao finalizar socorro (transação revertida): ${error.message}`);
            throw error;
        }
        finally {
            session.endSession();
        }
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
exports.SocorrosService = SocorrosService = SocorrosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(socorro_schema_1.Socorro.name)),
    __param(1, (0, mongoose_1.InjectModel)(entregador_schema_1.Entregador.name)),
    __param(2, (0, mongoose_1.InjectConnection)()),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => lojistas_service_1.LojistasService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregadores_gateway_1.EntregadoresGateway))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Connection,
        google_maps_service_1.GoogleMapsService,
        entregas_service_1.EntregasService,
        lojistas_service_1.LojistasService,
        entregadores_gateway_1.EntregadoresGateway,
        schedule_1.SchedulerRegistry,
        fcm_service_1.FcmService])
], SocorrosService);
//# sourceMappingURL=socorros.service.js.map
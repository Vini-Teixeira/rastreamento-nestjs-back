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
var EntregasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntregasService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const delivery_schema_1 = require("./schemas/delivery.schema");
const delivery_status_enum_1 = require("./enums/delivery-status.enum");
const entregador_schema_1 = require("../entregadores/schemas/entregador.schema");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const entregadores_gateway_1 = require("../entregadores/entregadores.gateway");
const schedule_1 = require("@nestjs/schedule");
const fcm_service_1 = require("../fcm/fcm.service");
const lojista_schema_1 = require("../lojistas/schemas/lojista.schema");
function toGeoJSONPoint(lat, lng) {
    return { type: 'Point', coordinates: [lng, lat] };
}
function toGeoJSONWithTimestamp(lat, lng, timestamp) {
    const p = toGeoJSONPoint(lat, lng);
    if (timestamp)
        p.timestamp = timestamp;
    return p;
}
function getLatLngFromGeoJSONOrLatLng(input) {
    if (input?.type === 'Point' &&
        Array.isArray(input.coordinates)) {
        const [lng, lat] = input.coordinates;
        return { lat, lng };
    }
    return input;
}
function isObjectIdLike(value) {
    if (!value)
        return false;
    if (value instanceof mongoose_2.Types.ObjectId)
        return true;
    if (typeof value === 'string' && mongoose_2.Types.ObjectId.isValid(value))
        return true;
    if (value._id && mongoose_2.Types.ObjectId.isValid(String(value._id)))
        return true;
    return false;
}
let EntregasService = EntregasService_1 = class EntregasService {
    constructor(deliveryModel, entregadorModel, googleMapsService, entregadoresGateway, connection, schedulerRegistry, fcmService, lojistaModel) {
        this.deliveryModel = deliveryModel;
        this.entregadorModel = entregadorModel;
        this.googleMapsService = googleMapsService;
        this.entregadoresGateway = entregadoresGateway;
        this.connection = connection;
        this.schedulerRegistry = schedulerRegistry;
        this.fcmService = fcmService;
        this.lojistaModel = lojistaModel;
        this.logger = new common_1.Logger(EntregasService_1.name);
    }
    async findNearestDriverInfo(originCoordinates, excludeDriverIds = []) {
        const { lat, lng } = getLatLngFromGeoJSONOrLatLng(originCoordinates);
        const query = {
            ativo: true,
            emEntrega: false,
            localizacao: { $exists: true },
        };
        if (excludeDriverIds.length > 0) {
            query._id = {
                $nin: excludeDriverIds.map((id) => new mongoose_2.Types.ObjectId(id)),
            };
        }
        const drivers = await this.entregadorModel.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [lng, lat] },
                    distanceField: 'distanciaCalculada',
                    query: query,
                    spherical: true,
                },
            },
            { $limit: 1 },
        ]);
        return drivers.length > 0 ? drivers[0] : null;
    }
    async _findAndReassignDelivery(delivery, session) {
        this.logger.log(`Procurando novo entregador para a entrega ${delivery.id}...`);
        const excludedDriverIds = delivery.historicoRejeicoes
            .filter((rejeicao) => rejeicao.motivo !== 'Recusa Automática')
            .map((rejeicao) => rejeicao.driverId.toString());
        this.logger.log(`Excluindo os seguintes entregadores da busca: [${excludedDriverIds.join(', ')}]`);
        const newDriver = await this.findNearestDriverInfo(delivery.origin.coordinates, excludedDriverIds);
        if (newDriver) {
            this.logger.log(`Novo entregador ${newDriver.nome} encontrado...`);
            delivery.driverId = newDriver._id;
            await delivery.save({ session });
            this.entregadoresGateway.notifyNewDelivery(newDriver._id.toString(), delivery);
            const timeoutName = `delivery-timeout-${delivery.id}`;
            const timeout = setTimeout(() => this.handleDeliveryTimeout(delivery.id, newDriver._id.toString()), 32000);
            this.schedulerRegistry.addTimeout(timeoutName, timeout);
            this.logger.log(`Timeout de 14s agendado para a entrega ${delivery.id}`);
        }
        else {
            this.logger.warn(`Nenhum outro entregador disponível. A entrega ${delivery.id} voltará para a fila.`);
            delivery.driverId = undefined;
            await delivery.save({ session });
        }
    }
    async create(createDeliveryDto, solicitanteId) {
        const { destination, itemDescription, origemId } = createDeliveryDto;
        const idDaLojaDeOrigem = origemId || solicitanteId;
        const lojaDeOrigem = await this.lojistaModel
            .findById(idDaLojaDeOrigem)
            .exec();
        if (!lojaDeOrigem) {
            throw new common_1.NotFoundException(`Loja de origem com ID ${idDaLojaDeOrigem} não encontrada.`);
        }
        const nearestDriverInfo = await this.findNearestDriverInfo(lojaDeOrigem.coordinates);
        if (!nearestDriverInfo) {
            throw new common_1.NotFoundException('Nenhum entregador disponível foi encontrado perto da loja de origem.');
        }
        this.logger.log(`Entregador mais próximo: ${nearestDriverInfo.nome} a ${nearestDriverInfo.distanciaCalculada.toFixed(0)} metros.`);
        let destinationGeo;
        try {
            destinationGeo = await this.googleMapsService.geocodeAddress(destination.address);
        }
        catch (error) {
            throw new common_1.BadRequestException('O endereço de destino não pôde ser encontrado.');
        }
        let codigoUnico = '';
        let codigoJaExiste = true;
        while (codigoJaExiste) {
            codigoUnico = gerarCodigoAleatorio(6);
            const entregaExistente = await this.deliveryModel
                .findOne({
                codigoEntrega: codigoUnico,
            })
                .exec();
            if (!entregaExistente) {
                codigoJaExiste = false;
            }
        }
        this.logger.log(`Código de entrega único gerado: ${codigoUnico}`);
        const newDelivery = new this.deliveryModel({
            solicitanteId: new mongoose_2.Types.ObjectId(solicitanteId),
            origemId: new mongoose_2.Types.ObjectId(idDaLojaDeOrigem),
            itemDescription,
            status: delivery_status_enum_1.DeliveryStatus.PENDENTE,
            origin: {
                address: lojaDeOrigem.endereco,
                coordinates: lojaDeOrigem.coordinates,
            },
            destination: {
                address: destination.address,
                coordinates: destinationGeo,
            },
            driverId: nearestDriverInfo._id,
            codigoEntrega: codigoUnico,
        });
        const saved = await newDelivery.save();
        try {
            this.entregadoresGateway.notifyNewDelivery(nearestDriverInfo._id.toString(), saved);
            if (nearestDriverInfo.fcmToken) {
                this.fcmService.sendPushNotification(nearestDriverInfo.fcmToken, 'Nova Entrega Disponível!', `Destino: ${saved.destination.address}`, { deliveryId: saved.id, type: 'entrega' });
            }
            this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
        }
        catch (err) {
            this.logger.error('Falha ao notificar o entregador', err?.stack);
        }
        return saved.toObject();
    }
    async recusarEntrega(deliveryId, driverId, rejeicaoDto) {
        const timeoutName = `delivery-timeout-${deliveryId}`;
        try {
            if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
                this.schedulerRegistry.deleteTimeout(timeoutName);
                this.logger.log(`Timeout para a entrega ${deliveryId} cancelado devido a recusa manual.`);
            }
        }
        catch (e) {
            this.logger.warn(`Falha ao tentar apagar o timeout ${timeoutName}. Pode já ter sido executado.`);
        }
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const delivery = await this.deliveryModel
                .findById(deliveryId)
                .session(session);
            if (!delivery) {
                throw new common_1.NotFoundException('Entrega não encontrada.');
            }
            if (delivery.driverId?.toString() !== driverId) {
                throw new common_1.ForbiddenException('Você não pode recusar uma entrega que não é sua.');
            }
            if (delivery.status !== delivery_status_enum_1.DeliveryStatus.PENDENTE) {
                throw new common_1.BadRequestException('Esta entrega não pode mais ser recusada.');
            }
            delivery.historicoRejeicoes.push({
                ...rejeicaoDto,
                driverId: new mongoose_2.Types.ObjectId(driverId),
                timestamp: new Date(),
            });
            await delivery.save({ session });
            if (delivery.historicoRejeicoes.length >= 3) {
                this.logger.warn(`A entrega ${deliveryId} foi recusada ${delivery.historicoRejeicoes.length} vezes. Notificando administrador...`);
            }
            await this._findAndReassignDelivery(delivery, session);
            await session.commitTransaction();
            return { message: 'Entrega recusada e reatribuída com sucesso.' };
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async handleDeliveryTimeout(deliveryId, driverId) {
        this.logger.log(`Verificando timeout para a entrega ${deliveryId} do entregador ${driverId}...`);
        const delivery = await this.deliveryModel.findById(deliveryId);
        if (delivery &&
            delivery.status === delivery_status_enum_1.DeliveryStatus.PENDENTE &&
            delivery.driverId?.toString() === driverId) {
            this.logger.warn(`Timeout! Entregador ${driverId} não respondeu. Recusa automática iniciada.`);
            const rejeicaoDto = {
                motivo: 'Recusa automática',
                texto: 'O entregador não respondeu a tempo.',
            };
            await this.recusarEntrega(deliveryId, driverId, rejeicaoDto);
        }
        else {
            this.logger.log(`Timeout para ${deliveryId} ignorado. Entrega já foi aceita ou recusada.`);
        }
    }
    async acceptDelivery(id, driverId) {
        const timeoutName = `delivery-timeout-${id}`;
        if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
            try {
                this.schedulerRegistry.deleteTimeout(timeoutName);
                this.logger.log(`Timeout para a entrega ${id} cancelado`);
            }
            catch (e) {
                this.logger.warn(`Falha ao deletar timeout ${timeoutName} em acceptDelivery. Pode já ter sido executado.`);
            }
        }
        const [delivery, driver] = await Promise.all([
            this.deliveryModel.findById(id).populate('driverId').exec(),
            this.entregadorModel.findById(driverId).exec(),
        ]);
        if (!delivery)
            throw new common_1.NotFoundException(`Entrega com ID ${id} não encontrada.`);
        if (!driver)
            throw new common_1.NotFoundException(`Entregador com ID ${driverId} não encontrado.`);
        const assignedDriverId = delivery.driverId
            ? (delivery.driverId._id ?? delivery.driverId).toString()
            : null;
        if (assignedDriverId && assignedDriverId !== driverId) {
            throw new common_1.ForbiddenException('Entrega atribuída a outro entregador.');
        }
        if (delivery.status !== delivery_status_enum_1.DeliveryStatus.PENDENTE) {
            throw new common_1.BadRequestException('Entrega não está mais disponível para aceitar.');
        }
        const session = await this.connection.startSession();
        session.startTransaction();
        let saved = null;
        try {
            delivery.status = delivery_status_enum_1.DeliveryStatus.ACEITO;
            delivery.driverId = driver._id;
            if (driver.localizacao) {
                delivery.driverCurrentLocation = driver.localizacao;
                this.logger.log(`Definindo driverCurrentLocation inicial para entrega ${id} com base no entregador ${driverId}`);
            }
            else {
                this.logger.warn(`Entregador ${driverId} sem localização registrada ao aceitar ${id}. driverCurrentLocation ficará nulo.`);
                delivery.driverCurrentLocation = undefined;
            }
            const savedDeliveryPromise = delivery.save({ session });
            const updateDriverPromise = this.entregadorModel
                .updateOne({ _id: driverId }, { $set: { emEntrega: true, recusasConsecutivas: 0 } }, { session })
                .exec();
            [saved] = await Promise.all([savedDeliveryPromise, updateDriverPromise]);
            await session.commitTransaction();
            this.logger.log(`Transação para aceitar entrega ${id} concluída.`);
        }
        catch (error) {
            await session.abortTransaction();
            this.logger.error(`Transação para aceitar ${id} FALHOU e foi revertida.`, error?.stack);
            throw error;
        }
        finally {
            session.endSession();
        }
        if (saved) {
            try {
                this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
            }
            catch (err) {
                this.logger.error('Falha ao emitir delivery_update após aceitar entrega.', err?.stack);
            }
            return saved.toObject();
        }
        else {
            this.logger.error(`Aceite da entrega ${id} concluído, mas objeto 'saved' nulo. Buscando novamente...`);
            const finalDelivery = await this.findOne(id);
            if (!finalDelivery)
                throw new common_1.InternalServerErrorException('Falha ao buscar entrega após aceite.');
            return finalDelivery;
        }
    }
    async collectItem(id, driverId) {
        const [delivery, driver] = await Promise.all([
            this.deliveryModel.findById(id).exec(),
            this.entregadorModel.findById(driverId).exec(),
        ]);
        if (!delivery) {
            throw new common_1.NotFoundException('Entrega não encontrada.');
        }
        if (!driver) {
            throw new common_1.NotFoundException(`Entregador com ID ${driverId} não encontrado.`);
        }
        const assigned = delivery.driverId?.toString() ?? null;
        if (!assigned || assigned !== driverId) {
            throw new common_1.UnauthorizedException('Você não tem permissão para modificar esta entrega.');
        }
        if (delivery.status !== delivery_status_enum_1.DeliveryStatus.ACEITO) {
            throw new common_1.ForbiddenException('Apenas entregas com status ACEITO podem ser coletadas.');
        }
        delivery.status = delivery_status_enum_1.DeliveryStatus.A_CAMINHO;
        if (driver.localizacao) {
            delivery.driverCurrentLocation = driver.localizacao;
            this.logger.log(`Atualizando driverCurrentLocation na coleta para entrega ${id}`);
        }
        else {
            this.logger.warn(`Entregador ${driverId} sem localização registrada ao coletar item para ${id}. driverCurrentLocation não será atualizado.`);
        }
        const saved = await delivery.save();
        this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
        return saved;
    }
    async liberarCheckInManual(deliveryId, solicitanteId) {
        const delivery = await this.deliveryModel.findById(deliveryId).exec();
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID ${deliveryId} não encontrada.`);
        }
        if (delivery.solicitanteId.toString() !== solicitanteId) {
            throw new common_1.ForbiddenException('Você não tem permissão para modificar esta entrega');
        }
        const statusPermitidos = [delivery_status_enum_1.DeliveryStatus.ACEITO, delivery_status_enum_1.DeliveryStatus.A_CAMINHO];
        if (!statusPermitidos.includes(delivery.status)) {
            throw new common_1.BadRequestException(`Não é possível liberar o CheckIn para uma entrega com status "${delivery.status}".`);
        }
        delivery.checkInLiberadoManualmente = true;
        const saved = await delivery.save();
        this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
        return saved;
    }
    async realizarCheckIn(deliveryId, driverId, instalandoDto) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const delivery = await this.deliveryModel
                .findById(deliveryId)
                .session(session);
            if (!delivery)
                throw new common_1.NotFoundException('Entrega não encontrada');
            if (delivery.driverId?.toString() !== driverId) {
                throw new common_1.ForbiddenException('Esta entrega não lhe pertence.');
            }
            if (delivery.codigoEntrega !== instalandoDto.codigoEntrega &&
                !delivery.checkInLiberadoManualmente) {
                throw new common_1.BadRequestException('Código de confirmação inválido.');
            }
            delivery.status = delivery_status_enum_1.DeliveryStatus.EM_ATENDIMENTO;
            const deliverySavePromise = delivery.save({ session });
            const driverUpdatePromise = this.entregadorModel
                .updateOne({ _id: driverId }, { $set: { emEntrega: false } }, { session })
                .exec();
            const [savedDelivery] = await Promise.all([
                deliverySavePromise,
                driverUpdatePromise,
            ]);
            await session.commitTransaction();
            this.entregadoresGateway.notifyDeliveryStatusChanged(savedDelivery);
            return savedDelivery;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async finishDelivery(id, driverId) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const delivery = await this.deliveryModel
                .findById(id)
                .session(session)
                .exec();
            if (!delivery) {
                throw new common_1.NotFoundException(`Entrega com ID ${id} não encontrada.`);
            }
            const assigned = delivery.driverId?.toString() ?? null;
            if (!assigned || assigned !== driverId) {
                throw new common_1.UnauthorizedException('Você não tem permissão para finalizar esta entrega.');
            }
            if (delivery.status !== delivery_status_enum_1.DeliveryStatus.EM_ATENDIMENTO) {
                throw new common_1.ForbiddenException('Apenas entregas "a caminho" podem ser finalizadas.');
            }
            delivery.status = delivery_status_enum_1.DeliveryStatus.FINALIZADO;
            const savedDeliveryPromise = delivery.save({ session });
            const updateDriverPromise = this.entregadorModel
                .updateOne({ _id: delivery.driverId }, { $set: { emEntrega: false } }, { session })
                .exec();
            const [savedDelivery] = await Promise.all([
                savedDeliveryPromise,
                updateDriverPromise,
            ]);
            await session.commitTransaction();
            this.entregadoresGateway.notifyDeliveryStatusChanged(savedDelivery);
            return savedDelivery;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async cancelarEntrega(deliveryId, solicitanteId) {
        const session = await this.connection.startSession();
        session.startTransaction();
        this.logger.log(`Iniciando transação para cancelar entrega ${deliveryId}`);
        try {
            const delivery = await this.deliveryModel
                .findById(deliveryId)
                .session(session)
                .exec();
            if (!delivery) {
                throw new common_1.NotFoundException(`Entrega com ID "${deliveryId}" não encontrada.`);
            }
            if (delivery.solicitanteId.toString() !== solicitanteId) {
                throw new common_1.ForbiddenException('Você não tem permissão para cancelar esta entrega.');
            }
            const nonCancelableStatuses = [
                delivery_status_enum_1.DeliveryStatus.FINALIZADO,
                delivery_status_enum_1.DeliveryStatus.CANCELADO,
            ];
            if (nonCancelableStatuses.includes(delivery.status)) {
                throw new common_1.BadRequestException('Esta entrega não pode mais ser cancelada.');
            }
            const driverId = delivery.driverId;
            const driverEstaAtivo = driverId &&
                [
                    delivery_status_enum_1.DeliveryStatus.ACEITO,
                    delivery_status_enum_1.DeliveryStatus.A_CAMINHO,
                    delivery_status_enum_1.DeliveryStatus.EM_ATENDIMENTO,
                ].includes(delivery.status);
            delivery.status = delivery_status_enum_1.DeliveryStatus.CANCELADO;
            const deliverySavePromise = delivery.save({ session });
            const promises = [deliverySavePromise];
            if (driverEstaAtivo) {
                this.logger.log(`Liberando entregador ${driverId} da entrega cancelada ${deliveryId}.`);
                promises.push(this.entregadorModel
                    .updateOne({ _id: driverId }, { $set: { emEntrega: false } }, { session })
                    .exec());
            }
            const [savedDelivery] = await Promise.all(promises);
            await session.commitTransaction();
            this.logger.log(`Transação de cancelamento para ${deliveryId} concluída.`);
            this.entregadoresGateway.notifyDeliveryStatusChanged(savedDelivery);
            return savedDelivery;
        }
        catch (error) {
            await session.abortTransaction();
            this.logger.error(`Erro na transação de cancelamento da entrega ${deliveryId}`, error?.stack);
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async handleStaleDeliveries() {
        this.logger.log('Executando verificação de entregas pendentes...');
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const staleDeliveries = await this.deliveryModel
            .find({
            status: delivery_status_enum_1.DeliveryStatus.PENDENTE,
            createdAt: { $lt: oneMinuteAgo },
        })
            .exec();
        if (staleDeliveries.length === 0) {
            this.logger.log('Nenhuma entrega pendente encontrada.');
            return;
        }
        this.logger.warn(`Encontradas ${staleDeliveries.length} entregas pendentes. Tentando reatribuir...`);
        for (const delivery of staleDeliveries) {
            await this._findAndReassignDelivery(delivery);
        }
    }
    async findAll(query) {
        const { page = 1, limit = 8, status } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (status) {
            const statusArray = status.split(',');
            const regexArray = statusArray.map((s) => new RegExp(`^${s}$`, 'i'));
            filter.status = { $in: regexArray };
        }
        const [deliveries, total] = await Promise.all([
            this.deliveryModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.deliveryModel.countDocuments(filter),
        ]);
        return {
            deliveries: deliveries,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findAllBySolicitanteId(solicitanteId, page = 1, limit = 10, status) {
        this.logger.debug(`Buscando entregas para o Lojista ID: ${solicitanteId} com status: ${status}`);
        const skip = (page - 1) * limit;
        const query = { solicitanteId: new mongoose_2.Types.ObjectId(solicitanteId) };
        if (status) {
            const statusArray = status.split(',');
            const regexArray = statusArray.map((s) => new RegExp(`^${s}$`, 'i'));
            query.status = { $in: regexArray };
        }
        this.logger.debug(`Query enviada para o MongoDB: ${JSON.stringify(query)}`);
        try {
            const [deliveries, total] = await Promise.all([
                this.deliveryModel
                    .find(query)
                    .populate('driverId', 'nome')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.deliveryModel.countDocuments(query).exec(),
            ]);
            this.logger.debug(`Encontradas ${total} entregas para este lojista.`);
            const plainDeliveries = deliveries.map((d) => d.toObject());
            this.logger.debug(`Dados retornados (após serialização): ${JSON.stringify(plainDeliveries)}`);
            return { deliveries: plainDeliveries, total, page, limit };
        }
        catch (error) {
            this.logger.error(`Erro ao executar a busca por solicitanteId: ${solicitanteId}`, error);
            throw error;
        }
    }
    async findFilteredAndPaginated(statuses, page = 1, limit = 8) {
        const skip = (page - 1) * limit;
        const query = statuses?.length ? { status: { $in: statuses } } : {};
        try {
            const [deliveries, total] = await Promise.all([
                this.deliveryModel
                    .find(query)
                    .populate('driverId')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.deliveryModel.countDocuments(query).exec(),
            ]);
            return { deliveries: deliveries || [], total, page, limit };
        }
        catch (error) {
            this.logger.error('Falha ao buscar entregas paginadas', error?.stack);
            return { deliveries: [], total: 0, page, limit };
        }
    }
    async findOne(id) {
        const delivery = await this.deliveryModel
            .findById(id)
            .populate('driverId')
            .exec();
        if (!delivery)
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada.`);
        return delivery;
    }
    async update(id, updateDeliveryDto) {
        const existingDelivery = await this.deliveryModel.findById(id).exec();
        if (!existingDelivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada para atualização.`);
        }
        if (updateDeliveryDto.status)
            existingDelivery.status = updateDeliveryDto.status;
        if (updateDeliveryDto.driverId)
            existingDelivery.driverId = new mongoose_2.Types.ObjectId(updateDeliveryDto.driverId);
        if (updateDeliveryDto.itemDescription)
            existingDelivery.itemDescription = updateDeliveryDto.itemDescription;
        if (updateDeliveryDto.routeHistory?.length) {
            existingDelivery.routeHistory = updateDeliveryDto.routeHistory.map((p) => toGeoJSONWithTimestamp(p.lat, p.lng, p.timestamp ? new Date(p.timestamp) : new Date()));
        }
        if (updateDeliveryDto.driverCurrentLocation) {
            const p = updateDeliveryDto.driverCurrentLocation;
            existingDelivery.driverCurrentLocation = toGeoJSONWithTimestamp(p.lat, p.lng, p.timestamp ? new Date(p.timestamp) : new Date());
        }
        const saved = await existingDelivery.save();
        try {
            this.entregadoresGateway.notifyDeliveryStatusChanged(saved);
        }
        catch (err) {
            this.logger.error('Falha ao emitir delivery_updated após update()', err?.stack);
        }
        return saved;
    }
    async delete(id) {
        const result = await this.deliveryModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada para exclusão.`);
        }
    }
    async findAllByDriverId(driverId, status) {
        const query = {
            driverId: isObjectIdLike(driverId)
                ? new mongoose_2.Types.ObjectId(driverId)
                : driverId,
        };
        if (status?.length)
            query.status = { $in: status };
        return (await this.deliveryModel.find(query).exec()) || [];
    }
    async addRoutePoint(deliveryId, lat, lng) {
        const delivery = await this.deliveryModel.findById(deliveryId).exec();
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${deliveryId}" não encontrada para adicionar ponto de rota.`);
        }
        if (!delivery.routeHistory)
            delivery.routeHistory = [];
        delivery.routeHistory.push(toGeoJSONWithTimestamp(lat, lng, new Date()));
        return delivery.save();
    }
    async updateDriverLocation(deliveryId, lat, lng) {
        const delivery = await this.deliveryModel.findById(deliveryId).exec();
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${deliveryId}" não encontrada para atualizar localização do entregador.`);
        }
        const now = new Date();
        const geoPoint = toGeoJSONWithTimestamp(lat, lng, now);
        delivery.driverCurrentLocation = geoPoint;
        if (!Array.isArray(delivery.routeHistory)) {
            delivery.routeHistory = [];
        }
        delivery.routeHistory.push(geoPoint);
        const payload = {
            deliveryId,
            driverId: delivery.driverId ? String(delivery.driverId) : null,
            location: {
                type: geoPoint.type,
                coordinates: geoPoint.coordinates,
                timestamp: now.toISOString(),
            },
            routeHistory: delivery.routeHistory.map((point) => ({
                type: point.type,
                coordinates: point.coordinates,
                timestamp: point.timestamp,
            })),
        };
        const updatedDelivery = await delivery.save();
        try {
            this.logger.log(`[WS] Emitindo 'novaLocalizacao' para ${deliveryId}. Histórico com ${payload.routeHistory.length} pontos.`);
            this.entregadoresGateway.emitDriverLocation(deliveryId, payload);
        }
        catch (err) {
            this.logger.error('Falha ao emitir novaLocalizacao via WebSocket', err?.stack);
        }
        return updatedDelivery;
    }
    async getSnappedRoutePolyline(origin, destination) {
        return this.googleMapsService.getDirections(origin, destination);
    }
    async getDriverToDestinationPolyline(driverLocation, destination) {
        return this.googleMapsService.getDirections(driverLocation, destination);
    }
    async bulkUpdateDriverLocations(driverId, locations) {
        this.logger.log(`Sincronizando ${locations.length} pontos de localização para o entregador ${driverId}`);
        const byDelivery = new Map();
        for (const loc of locations) {
            if (!byDelivery.has(loc.deliveryId))
                byDelivery.set(loc.deliveryId, []);
            byDelivery.get(loc.deliveryId).push(loc);
        }
        for (const [deliveryId, points] of byDelivery.entries()) {
            try {
                const delivery = await this.deliveryModel.findById(deliveryId);
                if (!delivery) {
                    this.logger.warn(`Sync: Entrega com ID ${deliveryId} não encontrada.`);
                    continue;
                }
                if (!delivery.driverId) {
                    this.logger.error(`Sync: A entrega ${deliveryId} não possui um entregador associado.`);
                    continue;
                }
                const deliveryDriverId = delivery.driverId?._id?.toString() ??
                    delivery.driverId?.toString() ??
                    '';
                if (String(deliveryDriverId) !== String(driverId)) {
                    this.logger.error(`Sync: Não autorizado. Entregador ${driverId} tentando atualizar entrega ${deliveryId}`);
                    continue;
                }
                points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                const toAdd = points.map((p) => toGeoJSONWithTimestamp(p.lat, p.lng, new Date(p.timestamp)));
                if (!delivery.routeHistory)
                    delivery.routeHistory = [];
                delivery.routeHistory.push(...toAdd);
                const latest = points[points.length - 1];
                delivery.driverCurrentLocation = toGeoJSONWithTimestamp(latest.lat, latest.lng, new Date(latest.timestamp));
                await delivery.save();
                try {
                    const geo = delivery.driverCurrentLocation;
                    this.entregadoresGateway.emitDriverLocation(deliveryId, {
                        driverId: String(deliveryDriverId),
                        location: {
                            type: geo.type,
                            coordinates: geo.coordinates,
                            timestamp: new Date(latest.timestamp).toISOString(),
                        },
                    });
                }
                catch (err) {
                    this.logger.error(`Erro ao emitir novaLocalizacao para a entrega ${deliveryId}`, err?.stack);
                }
            }
            catch (error) {
                this.logger.error(`Erro ao sincronizar pontos para a entrega ${deliveryId}: ${error.message}`);
            }
        }
    }
};
exports.EntregasService = EntregasService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EntregasService.prototype, "handleStaleDeliveries", null);
exports.EntregasService = EntregasService = EntregasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __param(1, (0, mongoose_1.InjectModel)(entregador_schema_1.Entregador.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregadores_gateway_1.EntregadoresGateway))),
    __param(4, (0, mongoose_1.InjectConnection)()),
    __param(7, (0, mongoose_1.InjectModel)(lojista_schema_1.Lojista.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        google_maps_service_1.GoogleMapsService,
        entregadores_gateway_1.EntregadoresGateway,
        mongoose_2.Connection,
        schedule_1.SchedulerRegistry,
        fcm_service_1.FcmService,
        mongoose_2.Model])
], EntregasService);
function gerarCodigoAleatorio(tamanho) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < tamanho; i++) {
        resultado += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return resultado;
}
//# sourceMappingURL=entregas.service.js.map
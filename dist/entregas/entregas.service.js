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
const entregadores_service_1 = require("../entregadores/entregadores.service");
const google_maps_service_1 = require("../google-maps/google-maps.service");
const entregadores_gateway_1 = require("../entregadores/entregadores.gateway");
let EntregasService = EntregasService_1 = class EntregasService {
    constructor(deliveryModel, entregadoresService, googleMapsService, entregadoresGateway) {
        this.deliveryModel = deliveryModel;
        this.entregadoresService = entregadoresService;
        this.googleMapsService = googleMapsService;
        this.entregadoresGateway = entregadoresGateway;
        this.logger = new common_1.Logger(EntregasService_1.name);
    }
    async create(createDeliveryDto) {
        const destinationAddress = createDeliveryDto.destination.address;
        let destinationCoordinates;
        try {
            destinationCoordinates = await this.googleMapsService.geocodeAddress(destinationAddress);
        }
        catch (error) {
            this.logger.error(`Falha no geocoding para o endereço: ${destinationAddress}`, error);
            throw new common_1.BadRequestException('O endereço de destino não pôde ser encontrado. Por favor, verifique e tente novamente.');
        }
        const newDelivery = new this.deliveryModel({
            ...createDeliveryDto,
            destination: {
                address: destinationAddress,
                coordinates: destinationCoordinates,
            },
            status: delivery_schema_1.DeliveryStatus.PENDING,
        });
        const entregadores = await this.entregadoresService.findAll();
        if (entregadores.length > 0) {
            newDelivery.driverId = entregadores[0]._id;
        }
        else {
            this.logger.warn('Nenhum entregador disponível para a nova entrega.');
        }
        return newDelivery.save();
    }
    async findFilteredAndPaginated(statuses = Object.values(delivery_schema_1.DeliveryStatus), page = 1, limit = 8) {
        const skip = (page - 1) * limit;
        const query = {};
        if (statuses && statuses.length > 0) {
            query.status = { $in: statuses };
        }
        const [deliveries, total] = await Promise.all([
            this.deliveryModel
                .find(query)
                .populate('driverId')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.deliveryModel.countDocuments(query).exec(),
        ]);
        return { deliveries, total, page, limit };
    }
    async findOne(id) {
        const delivery = await this.deliveryModel
            .findById(id)
            .populate('driverId')
            .exec();
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada.`);
        }
        return delivery;
    }
    async update(id, updateDeliveryDto) {
        const existingDelivery = await this.deliveryModel
            .findById(id)
            .exec();
        if (!existingDelivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada para atualização.`);
        }
        if (updateDeliveryDto.status) {
            existingDelivery.status = updateDeliveryDto.status;
        }
        if (updateDeliveryDto.driverId) {
            existingDelivery.driverId = new mongoose_2.Types.ObjectId(updateDeliveryDto.driverId);
        }
        if (updateDeliveryDto.itemDescription) {
            existingDelivery.itemDescription = updateDeliveryDto.itemDescription;
        }
        if (updateDeliveryDto.routeHistory) {
            existingDelivery.routeHistory = updateDeliveryDto.routeHistory.map((coordDto) => ({
                lat: coordDto.lat,
                lng: coordDto.lng,
                timestamp: coordDto.timestamp ?? new Date(),
            }));
        }
        if (updateDeliveryDto.driverCurrentLocation) {
            existingDelivery.driverCurrentLocation = {
                lat: updateDeliveryDto.driverCurrentLocation.lat,
                lng: updateDeliveryDto.driverCurrentLocation.lng,
                timestamp: updateDeliveryDto.driverCurrentLocation.timestamp ?? new Date(),
            };
        }
        return existingDelivery.save();
    }
    async delete(id) {
        const result = await this.deliveryModel
            .deleteOne({ _id: id })
            .exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException(`Entrega com ID "${id}" não encontrada para exclusão.`);
        }
        return { message: 'Entrega excluída com sucesso!' };
    }
    async findAllByDriverId(driverId) {
        return this.deliveryModel.find({ driverId: driverId }).exec();
    }
    async addRoutePoint(deliveryId, lat, lng) {
        const delivery = await this.deliveryModel.findById(deliveryId).exec();
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${deliveryId}" não encontrada para adicionar ponto de rota.`);
        }
        if (!delivery.routeHistory) {
            delivery.routeHistory = [];
        }
        delivery.routeHistory.push({ lat, lng, timestamp: new Date() });
        return delivery.save();
    }
    async updateDriverLocation(deliveryId, lat, lng) {
        const delivery = await this.deliveryModel.findById(deliveryId).exec();
        if (!delivery) {
            throw new common_1.NotFoundException(`Entrega com ID "${deliveryId}" não encontrada para atualizar localização do entregador.`);
        }
        delivery.driverCurrentLocation = {
            lat,
            lng,
            timestamp: new Date(),
        };
        const updatedDelivery = await delivery.save();
        this.entregadoresGateway.server.to(deliveryId).emit('novaLocalizacao', {
            deliveryId: deliveryId,
            driverId: updatedDelivery.driverId
                ? updatedDelivery.driverId.toString()
                : null,
            lat: lat,
            lng: lng,
            timestamp: updatedDelivery.driverCurrentLocation?.timestamp?.toISOString(),
        });
        this.logger.log(`WS Service: Localização da entrega ${deliveryId} transmitida para sala: ${lat}, ${lng}`);
        return updatedDelivery;
    }
    async getSnappedRoutePolyline(origin, destination) {
        return this.googleMapsService.getDirections(origin, destination);
    }
    async getDriverToDestinationPolyline(driverLocation, destination) {
        return this.googleMapsService.getDirections(driverLocation, destination);
    }
};
exports.EntregasService = EntregasService;
exports.EntregasService = EntregasService = EntregasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(delivery_schema_1.Delivery.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => entregadores_gateway_1.EntregadoresGateway))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        entregadores_service_1.EntregadoresService,
        google_maps_service_1.GoogleMapsService,
        entregadores_gateway_1.EntregadoresGateway])
], EntregasService);
//# sourceMappingURL=entregas.service.js.map
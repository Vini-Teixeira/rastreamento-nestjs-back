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
exports.EntregadoresService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const entregador_schema_1 = require("./schemas/entregador.schema");
const bcrypt = require("bcrypt");
let EntregadoresService = class EntregadoresService {
    constructor(entregadorModel) {
        this.entregadorModel = entregadorModel;
    }
    async validatePassword(telefone, pass) {
        const driver = await this.entregadorModel.findOne({ telefone }).select('+password').exec();
        if (driver && await bcrypt.compare(pass, driver.password)) {
            const { password, ...result } = driver.toObject();
            return result;
        }
        return null;
    }
    async create(createEntregadorDto) {
        const newEntregador = new this.entregadorModel(createEntregadorDto);
        return newEntregador.save();
    }
    async findOneByPhoneWithPassword(telefone) {
        return this.entregadorModel.findOne({ telefone }).select('+password').exec();
    }
    async findAll() {
        return this.entregadorModel.find().exec();
    }
    async findOne(id) {
        return this.entregadorModel.findById(id).exec();
    }
    async update(id, updateEntregadorDto) {
        return this.entregadorModel.findByIdAndUpdate(id, updateEntregadorDto, { new: true }).exec();
    }
    async delete(id) {
        return this.entregadorModel.findByIdAndDelete(id).exec();
    }
    async updateLocation(driverId, updateLocationDto) {
        const { lat, lng } = updateLocationDto;
        const geoJsonPoint = {
            type: 'Point',
            coordinates: [lng, lat],
        };
        const updatedDriver = await this.entregadorModel.findByIdAndUpdate(driverId, { $set: { localizacao: geoJsonPoint } }, { new: true }).exec();
        if (!updatedDriver) {
            throw new common_1.NotFoundException(`Entregador com ID ${driverId} não encontrado.`);
        }
        return updatedDriver;
    }
};
exports.EntregadoresService = EntregadoresService;
exports.EntregadoresService = EntregadoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(entregador_schema_1.Entregador.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EntregadoresService);
//# sourceMappingURL=entregadores.service.js.map
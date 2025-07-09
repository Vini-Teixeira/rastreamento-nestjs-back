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
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
let EntregadoresService = class EntregadoresService {
    constructor(entregadorModel, configService) {
        this.entregadorModel = entregadorModel;
        this.configService = configService;
        this.distanceMatrixApiUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
        const apiKey = this.configService.get('Maps_API_KEY');
        if (!apiKey) {
            throw new Error('Maps_API_KEY não configurada para EntregadoresService.');
        }
        this.googleMapsApiKey = apiKey;
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
    async encontrarEntregadorMaisProximo(latDestino, lngDestino, entregadores) {
        let entregadorMaisProximo = null;
        let menorDistancia = Infinity;
        for (const entregador of entregadores) {
            if (!entregador.localizacao || entregador.localizacao.lat == null || entregador.localizacao.lng == null) {
                console.warn(`Entregador ${entregador.nome} (${entregador._id}) não tem localização válida. Pulando.`);
                continue;
            }
            const url = `${this.distanceMatrixApiUrl}?origins=${entregador.localizacao.lat},${entregador.localizacao.lng}&destinations=${latDestino},${lngDestino}&mode=driving&key=${this.googleMapsApiKey}`;
            try {
                const resposta = await axios_1.default.get(url);
                if (resposta.data.status === 'OK' &&
                    resposta.data.rows &&
                    resposta.data.rows[0] &&
                    resposta.data.rows[0].elements &&
                    resposta.data.rows[0].elements[0] &&
                    resposta.data.rows[0].elements[0].distance) {
                    const distancia = resposta.data.rows[0].elements[0].distance.value;
                    if (distancia < menorDistancia) {
                        menorDistancia = distancia;
                        entregadorMaisProximo = entregador;
                    }
                }
                else {
                    console.error('Resposta inválida da Distance Matrix API:', resposta.data);
                }
            }
            catch (error) {
                console.error('Erro ao chamar Distance Matrix API para entregador:', entregador.nome, error.message);
            }
        }
        return entregadorMaisProximo;
    }
    async atualizarLocalizacao(id, lat, lng) {
        try {
            const updatedEntregador = await this.entregadorModel.findByIdAndUpdate(id.toString(), { localizacao: { lat, lng } }, { new: true }).exec();
            if (!updatedEntregador) {
                throw new common_1.NotFoundException('Entregador não encontrado para atualização de localização.');
            }
            return updatedEntregador;
        }
        catch (error) {
            console.error('Erro ao atualizar localização:', error);
            throw error;
        }
    }
    async buscarLocalizacaoPorTelefone(telefone) {
        const entregador = await this.entregadorModel.findOne({ telefone }).exec();
        if (!entregador) {
            return null;
        }
        if (!entregador.localizacao || entregador.localizacao.lat == null || entregador.localizacao.lng == null) {
            console.warn(`Localização do entregador ${entregador.nome} (${entregador._id}) não é válida.`);
            return null;
        }
        return {
            lat: entregador.localizacao.lat,
            lng: entregador.localizacao.lng,
        };
    }
};
exports.EntregadoresService = EntregadoresService;
exports.EntregadoresService = EntregadoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(entregador_schema_1.Entregador.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService])
], EntregadoresService);
//# sourceMappingURL=entregadores.service.js.map
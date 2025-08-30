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
var GoogleMapsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleMapsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
let GoogleMapsService = GoogleMapsService_1 = class GoogleMapsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleMapsService_1.name);
        this.googleMapsApiUrl = 'https://maps.googleapis.com/maps/api/directions/json';
        this.geocodingApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const apiKey = this.configService.get('Maps_API_KEY');
        if (!apiKey) {
            throw new common_1.InternalServerErrorException('Maps_API_KEY não configurada no ambiente.');
        }
        this.googleMapsApiKey = apiKey;
    }
    async getDirections(origin, destination) {
        try {
            const response = await axios_1.default.get(this.googleMapsApiUrl, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    key: this.googleMapsApiKey,
                    mode: 'driving',
                    alternatives: false,
                },
            });
            if (response.data.status === 'OK' && response.data.routes.length > 0) {
                return response.data.routes[0].overview_polyline.points;
            }
            else if (response.data.status === 'ZERO_RESULTS') {
                throw new common_1.NotFoundException('Não foi encontrada nenhuma rota entre os pontos fornecidos.');
            }
            else {
                console.error('Erro na Google Directions API:', response.data.error_message || response.data.status);
                throw new common_1.InternalServerErrorException('Falha ao obter rota do Google Maps.');
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('Erro Axios na Google Directions API:', error.response?.data || error.message);
                throw new common_1.InternalServerErrorException(`Erro na comunicação com a API Directions: ${error.response?.data?.error_message || error.message}`);
            }
            console.error('Erro inesperado ao chamar Google Directions API:', error);
            throw new common_1.InternalServerErrorException('Erro inesperado ao obter rota.');
        }
    }
    async geocodeAddress(address) {
        const url = `${this.geocodingApiUrl}?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`;
        this.logger.debug(`Enviando requisição de Geocoding para a URL: ${url}`);
        try {
            const response = await axios_1.default.get(url);
            if (response.data.status === 'OK' && response.data.results.length > 0) {
                this.logger.log(`Geocoding bem-sucedido para: ${address}`);
                const location = response.data.results[0].geometry.location;
                return {
                    lat: location.lat,
                    lng: location.lng,
                };
            }
            else {
                this.logger.error(`Google Geocoding API retornou status: ${response.data.status} para o endereço: ${address}`);
                throw new common_1.NotFoundException(`Não foi possível encontrar coordenadas para o endereço: ${address}`);
            }
        }
        catch (error) {
            this.logger.error('Erro ao chamar Google Geocoding API:', error.response?.data || error.message);
            throw new Error('Falha ao converter endereço em coordenadas.');
        }
    }
};
exports.GoogleMapsService = GoogleMapsService;
exports.GoogleMapsService = GoogleMapsService = GoogleMapsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleMapsService);
//# sourceMappingURL=google-maps.service.js.map
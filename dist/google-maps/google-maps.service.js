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
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const config_1 = require("@nestjs/config");
let GoogleMapsService = GoogleMapsService_1 = class GoogleMapsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleMapsService_1.name);
        this.client = new google_maps_services_js_1.Client({});
        const key = this.configService.get('GOOGLE_MAPS_API_KEY') ||
            this.configService.get('Maps_API_KEY');
        if (!key) {
            throw new common_1.InternalServerErrorException('Variável de ambiente GOOGLE_MAPS_API_KEY/Maps_API_KEY não configurada.');
        }
        this.apiKey = key;
    }
    toLatLng(coords) {
        const [lng, lat] = coords.coordinates;
        return { lat, lng };
    }
    async geocodeAddress(address) {
        try {
            const response = await this.client.geocode({
                params: { address, key: this.apiKey },
            });
            const results = response.data?.results || [];
            if (results.length === 0) {
                this.logger.warn(`Geocode sem resultados para: ${address}`);
                return { type: 'Point', coordinates: [0, 0] };
            }
            const location = results[0].geometry?.location;
            const lat = location?.lat;
            const lng = location?.lng;
            if (lat == null || lng == null) {
                this.logger.warn(`Geocode retornou lat/lng inválidos para: ${address}`);
                return { type: 'Point', coordinates: [0, 0] };
            }
            const coords = { type: 'Point', coordinates: [lng, lat] };
            this.logger.debug(`GoogleMapsService geocode result: ${JSON.stringify(coords)}`);
            return coords;
        }
        catch (err) {
            this.logger.error('Erro ao chamar Google Geocoding API', err?.response?.data || err?.message || err);
            return { type: 'Point', coordinates: [0, 0] };
        }
    }
    async getDirections(origin, destination) {
        const o = this.toLatLng(origin);
        const d = this.toLatLng(destination);
        try {
            const response = await this.client.directions({
                params: {
                    origin: o,
                    destination: d,
                    key: this.apiKey,
                    mode: google_maps_services_js_1.TravelMode.driving,
                    alternatives: false,
                },
            });
            const data = response.data;
            if (data.status === 'OK' && data.routes?.length) {
                return data.routes[0].overview_polyline.points;
            }
            if (data.status === 'ZERO_RESULTS') {
                throw new common_1.NotFoundException('Não foi encontrada nenhuma rota entre os pontos fornecidos.');
            }
            this.logger.error(`Erro na Directions API: ${data.status} - ${data.error_message || 'sem mensagem'}`);
            throw new common_1.InternalServerErrorException('Falha ao obter rota do Google Maps.');
        }
        catch (err) {
            this.logger.error('Erro inesperado ao chamar Google Directions API', err?.response?.data || err?.message || err);
            throw new common_1.InternalServerErrorException('Erro inesperado ao obter rota.');
        }
    }
};
exports.GoogleMapsService = GoogleMapsService;
exports.GoogleMapsService = GoogleMapsService = GoogleMapsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleMapsService);
//# sourceMappingURL=google-maps.service.js.map
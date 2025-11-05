import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import { ConfigService } from '@nestjs/config';
import { Coordinates } from '../entregas/schemas/delivery.schema';

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({});
    const key = this.configService.get<string>('GOOGLE_MAPS_BACKEND_API_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'Variável de ambiente GOOGLE_MAPS_BACKEND_API_KEY não configurada.',
      );
    }
    this.apiKey = key;
  }

  private toLatLng(coords: Coordinates): { lat: number; lng: number } {
    const [lng, lat] = coords.coordinates;
    return { lat, lng };
  }

  async geocodeAddress(address: string): Promise<Coordinates> {
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

      const coords: Coordinates = { type: 'Point', coordinates: [lng, lat] };
      this.logger.debug(
        `GoogleMapsService geocode result: ${JSON.stringify(coords)}`,
      );
      return coords;
    } catch (err: any) {
      this.logger.error(
        'Erro ao chamar Google Geocoding API',
        err?.response?.data || err?.message || err,
      );
      return { type: 'Point', coordinates: [0, 0] };
    }
  }

  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<string> {
    const o = this.toLatLng(origin);
    const d = this.toLatLng(destination);

    try {
      const response = await this.client.directions({
        params: {
          origin: o,
          destination: d,
          key: this.apiKey,
          mode: TravelMode.driving,
          alternatives: false,
        },
      });

      const data = response.data;
      if (data.status === 'OK' && data.routes?.length) {
        return data.routes[0].overview_polyline.points;
      }

      if (data.status === 'ZERO_RESULTS') {
        throw new NotFoundException(
          'Não foi encontrada nenhuma rota entre os pontos fornecidos.',
        );
      }

      this.logger.error(
        `Erro na Directions API: ${data.status} - ${data.error_message || 'sem mensagem'}`,
      );
      throw new InternalServerErrorException(
        'Falha ao obter rota do Google Maps.',
      );
    } catch (err: any) {
      this.logger.error(
        'Erro inesperado ao chamar Google Directions API',
        err?.response?.data || err?.message || err,
      );
      throw new InternalServerErrorException('Erro inesperado ao obter rota.');
    }
  }
}

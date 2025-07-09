import { Injectable, InternalServerErrorException, NotFoundException, Logger} from '@nestjs/common';
import axios from 'axios'; 
import { ConfigService } from '@nestjs/config';
import { Coordinates as CoordinatesEntity } from 'src/entregas/schemas/delivery.schema';

interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name)
  private googleMapsApiKey: string;
  private googleMapsApiUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  private readonly geocodingApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('Maps_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Maps_API_KEY não configurada no ambiente.');
    }
    this.googleMapsApiKey = apiKey;
  }

  /**
   * @param origin 
   * @param destination 
   * @returns 
   */
  async getDirections(origin: Coordinates, destination: Coordinates): Promise<string> {
    try {
      const response = await axios.get(this.googleMapsApiUrl, {
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
      } else if (response.data.status === 'ZERO_RESULTS') {
        throw new NotFoundException('Não foi encontrada nenhuma rota entre os pontos fornecidos.');
      } else {
        console.error('Erro na Google Directions API:', response.data.error_message || response.data.status);
        throw new InternalServerErrorException('Falha ao obter rota do Google Maps.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erro Axios na Google Directions API:', error.response?.data || error.message);
        throw new InternalServerErrorException(
          `Erro na comunicação com a API Directions: ${error.response?.data?.error_message || error.message}`,
        );
      }
      console.error('Erro inesperado ao chamar Google Directions API:', error);
      throw new InternalServerErrorException('Erro inesperado ao obter rota.');
    }
  }

  async geocodeAddress(address: string): Promise<CoordinatesEntity> {
    const url = `${this.geocodingApiUrl}?address=${encodeURIComponent(
      address,
    )}&key=${this.googleMapsApiKey}`;

    // --- LINHA DE DEBUG ADICIONADA ---
    this.logger.debug(`Enviando requisição de Geocoding para a URL: ${url}`);
    // --- FIM DA LINHA DE DEBUG ---

    try {
      const response = await axios.get(url);
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        this.logger.log(`Geocoding bem-sucedido para: ${address}`);
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      } else {
        // Loga a resposta do Google quando o status não é OK
        this.logger.error(`Google Geocoding API retornou status: ${response.data.status} para o endereço: ${address}`);
        throw new NotFoundException(
          `Não foi possível encontrar coordenadas para o endereço: ${address}`,
        );
      }
    } catch (error) {
      this.logger.error('Erro ao chamar Google Geocoding API:', error.response?.data || error.message);
      throw new Error('Falha ao converter endereço em coordenadas.');
    }
  }
}
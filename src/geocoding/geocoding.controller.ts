import { Controller, Get, Query, Logger, UseGuards } from '@nestjs/common';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { FlexibleAuthGuard } from 'src/auth/flexible-auth.guard';
// import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';
//import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('geocoding')
@UseGuards(FlexibleAuthGuard) 
export class GeocodingController {
  private readonly logger = new Logger(GeocodingController.name);

  constructor(private readonly googleMapsService: GoogleMapsService) {}

  @Get()
  async getCoordsFromAddress(@Query('address') address: string) {
    this.logger.debug(`GeocodingController recebeu o endereço: ${address}`);
    if (!address || address.trim().length === 0) {
      this.logger.debug('Endereço vazio recebido — retornando ponto (0,0)');
      return { type: 'Point', coordinates: [0, 0] };
    }

    try {
      const coords = await this.googleMapsService.geocodeAddress(address);
      this.logger.debug(`GeocodingController retornando: ${JSON.stringify(coords)}`);
      return coords;
    } catch (err) {
      this.logger.error('Erro no geocoding', err);
      return { type: 'Point', coordinates: [0, 0] };
    }
  }
}

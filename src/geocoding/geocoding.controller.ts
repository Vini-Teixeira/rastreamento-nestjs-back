import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';

@Controller('geocoding')
@UseGuards(FirebaseAuthGuard)
export class GeocodingController {
    constructor(private readonly googleMapsService: GoogleMapsService) {}

    @Get()
    async getCoordsFromAddress(@Query('address') address: string) {
    console.log('--- [DEBUG] GeocodingController recebeu o endereço: ---', address);
    console.log('----------------------------------------------------');
        if(!address) {
            return { lat: 0, lng: 0 }
        }
        return this.googleMapsService.geocodeAddress(address)
    }
}

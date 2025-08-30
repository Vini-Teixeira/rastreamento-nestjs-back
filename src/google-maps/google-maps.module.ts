import { Module } from '@nestjs/common';
import { GoogleMapsService } from './google-maps.service';
import { Coordinates } from 'src/entregas/schemas/delivery.schema';

@Module({
  imports: [],
  providers: [GoogleMapsService],
  exports: [GoogleMapsService], 
})
export class GoogleMapsModule {}
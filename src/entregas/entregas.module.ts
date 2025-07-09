import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntregasController } from './entregas.controller';
import { EntregasService } from './entregas.service';
import { Delivery, DeliverySchema } from './schemas/delivery.schema';
import { EntregadoresModule } from '../entregadores/entregadores.module';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Delivery.name, schema: DeliverySchema }]),
    forwardRef(() => EntregadoresModule),
    AuthModule
  ],
  controllers: [EntregasController],
  providers: [EntregasService, GoogleMapsService],
  exports: [EntregasService],
})
export class EntregasModule {}

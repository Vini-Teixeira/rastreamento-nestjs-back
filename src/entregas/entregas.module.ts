import { Module, forwardRef } from '@nestjs/common';
import { EntregasService } from './entregas.service';
import { EntregasController } from './entregas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleMapsModule } from 'src/google-maps/google-maps.module';
import { EntregadoresModule } from 'src/entregadores/entregadores.module';
import { Delivery, DeliverySchema } from './schemas/delivery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delivery.name, schema: DeliverySchema }
    ]),
    GoogleMapsModule,
    forwardRef(() => EntregadoresModule),
    AuthModule,
  ],
  controllers: [EntregasController],
  providers: [EntregasService],
  exports: [EntregasService]
})
export class EntregasModule {}
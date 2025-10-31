import { Module, forwardRef } from '@nestjs/common';
import { EntregasService } from './entregas.service';
import { EntregasController } from './entregas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleMapsModule } from 'src/google-maps/google-maps.module';
import { EntregadoresModule } from 'src/entregadores/entregadores.module';
import { Delivery, DeliverySchema } from './schemas/delivery.schema';
import { FirebaseModule } from 'src/auth/firebase.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { LojistasModule } from 'src/lojistas/lojistas.module';

@Module({
  imports: [
    FirebaseModule,
    MongooseModule.forFeature([
      { name: Delivery.name, schema: DeliverySchema }
    ]),
    GoogleMapsModule,
    forwardRef(() => EntregadoresModule),
    AuthModule,
    FcmModule,
    LojistasModule
  ],
  controllers: [EntregasController],
  providers: [EntregasService],
  exports: [EntregasService,
    MongooseModule.forFeature([{ name: Delivery.name, schema: DeliverySchema }])
  ]
})
export class EntregasModule {}
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LojistasService } from "./lojistas.service";
import { LojistasController } from "./lojistas.controller";
import { Lojista, LojistaSchema } from './schemas/lojista.schema';
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "src/auth/auth.module";
import { GoogleMapsModule } from "src/google-maps/google-maps.module";
import { Delivery, DeliverySchema } from 'src/entregas/schemas/delivery.schema';
import { Socorro, SocorroSchema } from 'src/socorros/schemas/socorro.schema';

@Module({
  imports: [GoogleMapsModule,
    AuthModule,
    JwtModule,
    MongooseModule.forFeature([
      { name: Lojista.name, schema: LojistaSchema },
      { name: Delivery.name, schema: DeliverySchema },
      { name: Socorro.name, schema: SocorroSchema },
    ]),
  ], 
  controllers: [LojistasController],
  providers: [LojistasService],
  exports: [LojistasService, MongooseModule],
})

export class LojistasModule {}
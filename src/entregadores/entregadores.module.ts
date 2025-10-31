import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntregadoresService } from './entregadores.service';
import { EntregadoresController } from './entregadores.controller';
import { EntregadoresGateway } from './entregadores.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { FirebaseModule } from 'src/auth/firebase.module';
import { PontoHistoryModule } from 'src/ponto-history/ponto-history.module';
import { Entregador, EntregadorSchema } from './schemas/entregador.schema';
import { Delivery, DeliverySchema } from '../entregas/schemas/delivery.schema';
import { Socorro, SocorroSchema } from '../socorros/schemas/socorro.schema';
import { EntregasModule } from 'src/entregas/entregas.module';

const EntregadorMongooseModule = MongooseModule.forFeature([
  { name: Entregador.name, schema: EntregadorSchema }
]);

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entregador.name, schema: EntregadorSchema },
      { name: Delivery.name, schema: DeliverySchema },
      { name: Socorro.name, schema: SocorroSchema },
    ]),
    FirebaseModule,
    PontoHistoryModule,
    forwardRef(() => AuthModule),
    forwardRef(() => EntregasModule)
  ],
  controllers: [EntregadoresController],
  providers: [EntregadoresService, EntregadoresGateway],
  exports: [EntregadoresService, EntregadoresGateway, EntregadorMongooseModule, MongooseModule],
})
export class EntregadoresModule {}
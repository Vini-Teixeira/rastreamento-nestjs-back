import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntregasModule } from '../entregas/entregas.module'; 
import { EntregadoresService } from './entregadores.service';
import { EntregadoresController } from './entregadores.controller';
import { EntregadoresGateway } from './entregadores.gateway';
import { Entregador, EntregadorSchema } from './schemas/entregador.schema';
import { AuthModule } from 'src/auth/auth.module';
import { FirebaseModule } from 'src/auth/firebase.module';

const EntregadorMongooseModule = MongooseModule.forFeature([
  { name: Entregador.name, schema: EntregadorSchema }
]);

@Module({
  imports: [
    FirebaseModule,
    EntregadorMongooseModule,
    forwardRef(() => EntregasModule),
    AuthModule,
  ],
  controllers: [EntregadoresController],
  providers: [EntregadoresService, EntregadoresGateway],
  exports: [EntregadoresService, EntregadoresGateway, EntregadorMongooseModule],
})
export class EntregadoresModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntregadoresService } from './entregadores.service';
import { EntregadoresController } from './entregadores.controller';
import { EntregadoresGateway } from './entregadores.gateway';
import { Entregador, EntregadorSchema } from './schemas/entregador.schema';


@Module({
  imports: [MongooseModule.forFeature([{ name: Entregador.name, schema: EntregadorSchema }])],
  providers: [EntregadoresService, EntregadoresGateway],
  controllers: [EntregadoresController],
  exports: [EntregadoresService]
})
export class EntregadoresModule {}

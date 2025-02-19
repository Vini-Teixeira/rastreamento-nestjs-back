import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { entregasController } from './entregas.controller';
import { EntregasService } from './entregas.service';
import { Entrega, EntregaSchema } from './schemas/entregas.schema';
import { EntregadoresModule } from '../entregadores/entregadores.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entrega.name, schema: EntregaSchema }]),
    EntregadoresModule, 
  ],
  controllers: [entregasController],
  providers: [EntregasService],
  exports: [EntregasService], 
})
export class EntregasModule {}
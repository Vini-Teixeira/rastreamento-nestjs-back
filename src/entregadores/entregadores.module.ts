import { Module, forwardRef } from '@nestjs/common'; 
import { MongooseModule } from '@nestjs/mongoose';
import { EntregasModule } from 'src/entregas/entregas.module'; 
import { EntregadoresService } from './entregadores.service';
import { EntregadoresController } from './entregadores.controller';
import { EntregadoresGateway } from './entregadores.gateway';
import { Entregador, EntregadorSchema } from './schemas/entregador.schema';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entregador.name, schema: EntregadorSchema }]), AuthModule,
    forwardRef(() => EntregasModule),
  ],
  controllers: [EntregadoresController],
  providers: [EntregadoresService, EntregadoresGateway],
  exports: [EntregadoresService, EntregadoresGateway],
})
export class EntregadoresModule {}
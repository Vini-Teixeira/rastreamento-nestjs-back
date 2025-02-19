import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntregadoresModule } from './entregadores/entregadores.module';
import { EntregadoresGateway } from './entregadores/entregadores.gateway';
import { EntregasModule } from './entregas/entregas.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [ MongooseModule.forRoot('mongodb://localhost/deliveryDB'), EntregadoresModule, EntregasModule],
  controllers: [AppController],
  providers: [AppService, EntregadoresGateway],
})
export class AppModule {}

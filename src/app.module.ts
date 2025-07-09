import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntregadoresModule } from './entregadores/entregadores.module';
import { EntregasModule } from './entregas/entregas.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { AuthModule } from './auth/auth.module';
import { LojasModule } from './lojas/lojas.module';
import { LojistasModule } from './lojistas/lojistas.module';

@Module({
  imports: [ 
    MongooseModule.forRoot('mongodb://localhost/deliveryDB'), 
    EntregadoresModule, 
    GoogleMapsModule, 
    EntregasModule,
    ConfigModule.forRoot({
    isGlobal: true
  }),
    AuthModule,
    LojasModule,
    LojistasModule
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: []
})
export class AppModule {}
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntregadoresModule } from './entregadores/entregadores.module';
import { EntregasModule } from './entregas/entregas.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { GoogleMapsService } from './google-maps/google-maps.service';
import { AuthModule } from './auth/auth.module';
import { LojasModule } from './lojas/lojas.module';
import { LojistasModule } from './lojistas/lojistas.module';
import { FirebaseModule } from './auth/firebase.module';
import { GeocodingController } from './geocoding/geocoding.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule], 
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'), 
      }),
      inject: [ConfigService], 
    }),
    EntregadoresModule,
    GoogleMapsModule,
    EntregasModule,
    AuthModule,
    LojasModule,
    LojistasModule,
    FirebaseModule
  ],
  controllers: [AppController, GeocodingController],
  providers: [AppService, GoogleMapsService],
  exports: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LojasService } from './lojas.service';
import { LojasController } from './lojas.controller';
import { Loja, LojaSchema } from './schemas/loja.schema';
import { AuthModule } from 'src/auth/auth.module';
import { FirebaseModule } from 'src/auth/firebase.module';

@Module({
  imports: [
    FirebaseModule,
    MongooseModule.forFeature([{ name: Loja.name, schema: LojaSchema }]),
    AuthModule,
  ],
  controllers: [LojasController],
  providers: [LojasService],
})
export class LojasModule {}

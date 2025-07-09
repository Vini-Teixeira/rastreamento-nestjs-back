import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LojistasService } from "./lojistas.service";
import { LojistasController } from "./lojistas.controller";
import { Lojista, LojistaSchema } from './schemas/lojista.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lojista.name, schema: LojistaSchema}]),
  ], 
  controllers: [LojistasController],
  providers: [LojistasService],
  exports: [LojistasService],
})

export class LojistasModule {}
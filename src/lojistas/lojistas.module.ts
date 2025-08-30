import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LojistasService } from "./lojistas.service";
import { LojistasController } from "./lojistas.controller";
import { Lojista, LojistaSchema } from './schemas/lojista.schema';
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    AuthModule,
    JwtModule,
    MongooseModule.forFeature([{ name: Lojista.name, schema: LojistaSchema}]),
  ], 
  controllers: [LojistasController],
  providers: [LojistasService],
  exports: [LojistasService],
})

export class LojistasModule {}
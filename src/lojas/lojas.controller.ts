import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { LojasService } from './lojas.service';
import { CreateLojaDto } from './dto/create-loja.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';

@Controller('lojas')
@UseGuards(FirebaseAuthGuard) 
export class LojasController {
  constructor(private readonly lojasService: LojasService) {}

  @Post()
  create(@Body(new ValidationPipe()) createLojaDto: CreateLojaDto) {
    return this.lojasService.create(createLojaDto);
  }

  @Get()
  findAll() {
    return this.lojasService.findAll();
  }
}

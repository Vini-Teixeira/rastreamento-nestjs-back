import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, 
  HttpStatus, HttpException, UseGuards, ValidationPipe } from '@nestjs/common';
import { EntregadoresService } from './entregadores.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth/firebase-auth.guard';
import { CreateEntregadorDto } from './dto/create-entregador.dto';
import { UpdateEntregadorDto } from './dto/update-entregador.dto';

@UseGuards(FirebaseAuthGuard)
@Controller('entregadores')
export class EntregadoresController {
  constructor(private readonly entregadoresService: EntregadoresService) {}

  @Get('localizacao/:telefone')
  async buscarLocalizacaoPorTelefone(@Param('telefone') telefone: string) {
    try {
      const localizacao = await this.entregadoresService.buscarLocalizacaoPorTelefone(telefone);
      if (!localizacao) {
        throw new NotFoundException('Localização não encontrada!');
      }
      return localizacao;
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      throw new HttpException('Falha ao buscar localização', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async create(@Body(new ValidationPipe()) createEntregadorDto: CreateEntregadorDto) {
    return this.entregadoresService.create(createEntregadorDto);
  }

  @Get()
  async findAll() {
    return this.entregadoresService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.entregadoresService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body(new ValidationPipe()) updateEntregadorDto: UpdateEntregadorDto) {
    return this.entregadoresService.update(id, updateEntregadorDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.entregadoresService.delete(id);
  }
}
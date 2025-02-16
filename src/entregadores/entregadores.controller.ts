import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, HttpStatus, HttpException } from '@nestjs/common';
import { EntregadoresService } from './entregadores.service';
import { CriarEntregaDto } from '../entregas/dto/criar-entrega.dto';

@Controller('entregadores')
export class EntregadoresController {
  constructor(private readonly entregadoresService: EntregadoresService) {}

  @Post()
  async create(@Body() data: any) {
    return this.entregadoresService.create(data);
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
  async update(@Param('id') id: string, @Body() data: any) {
    return this.entregadoresService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.entregadoresService.delete(id);
  }

  @Post('criar')
  async criarEntrega(@Body() entregaDto: CriarEntregaDto) {
    try {
      const entregadores = await this.entregadoresService.findAll();
      const entregador =
        await this.entregadoresService.encontrarEntregadorMaisProximo(
          entregaDto.lat,
          entregaDto.lng,
          entregadores,
        );

      if (!entregador) {
        throw new NotFoundException('Nenhum entregador disponível');
      }

      return { entregador, message: 'Entrega criada com sucesso!' };
    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      throw new HttpException(
        'Falha ao criar entrega',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

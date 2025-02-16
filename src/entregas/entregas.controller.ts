import { Controller, Post, Get, Put, Param, Body } from '@nestjs/common';
import { EntregasService } from './entregas.service';

@Controller('entregas')
export class entregasController {
  constructor(private readonly entregasService: EntregasService) {}

  @Post('criar')
  async criarEntrega(@Body() data: any) {
    return this.entregasService.criarEntrega(data);
  }

  @Get('listar')
  async listarEntregas() {
    return this.entregasService.listarEntregas();
  }

  @Put(':id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.entregasService.atualizarStatusEntrega(id, body.status);
  }
}
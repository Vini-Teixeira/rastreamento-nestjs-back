import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EntregadoresService } from 'src/entregadores/entregadores.service';
import { EntregadorDocument } from 'src/entregadores/schemas/entregador.schema';
import { CreateLojistaDto } from 'src/lojistas/dto/create-lojista.dto';
import { LojistasService } from 'src/lojistas/lojistas.service';

@Injectable()
export class AuthService {
  constructor(
    private entregadoresService: EntregadoresService,
    private lojistasService: LojistasService,
    private jwtService: JwtService,
  ) {}

  //---INÍCIO DA LÓGICA PARA ENTREGADOR---

  async validateDriver(
    telefone: string,
    pass: string,
  ): Promise<Omit<EntregadorDocument, 'password'> | null> {
    const driver = await this.entregadoresService.findOneByPhoneWithPassword(telefone);

    if (driver && (await bcrypt.compare(pass, driver.password))) {
      const { password, ...result } = driver.toObject();
      return result;
    }
    return null;
  }

  async loginDriver(driver: any) {
    const payload = { sub: driver._id, telefone: driver.telefone };
    return {
      message: 'Login bem-sucedido!',
      access_token: this.jwtService.sign(payload),
    };
  }
  //---FIM DA LÓGICA PARA ENTREGADOR---


  //---INÍCIO DA LÓGICA PARA LOJISTA---
  async registerLojista(createLojistaDto: CreateLojistaDto) {
    const existingLojista = await this.lojistasService.findOneByEmail(createLojistaDto.email);
    if(existingLojista) {
      throw new ConflictException('Este email já está cadastrado.');
    }
    return this.lojistasService.create(createLojistaDto);
  }

  async validateLojista(email: string, pass: string): Promise<any> {
    const lojista = await this.lojistasService.findOneByEmailWithPassword(email);
    if(lojista && (await bcrypt.compare(pass, lojista.password))) {
      const { password, ...result } = lojista.toObject();
      return result;
    }
    return null;
  }

  async loginLojista(lojista: any) {
    const payload = { sub: lojista._id, email: lojista.email, type: 'lojista'};
    return {
      message: 'Login bem sucedido!',
      access_token: this.jwtService.sign(payload),
    }
  }
}

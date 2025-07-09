import { IsString, IsBoolean, IsNotEmpty, MinLength } from 'class-validator';

export class CreateEntregadorDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  telefone: string;

  @IsBoolean()
  ativo: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}

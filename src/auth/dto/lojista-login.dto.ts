import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LojistaLoginDto {
  @IsEmail({}, { message: 'Por favor, insira um email válido.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
import {
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsMongoId,
} from 'class-validator';

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

  @IsString()
  @IsOptional()
  horarioTrabalho?: string;

  @IsMongoId()
  @IsOptional()
  lojaBaseId?: string;
}

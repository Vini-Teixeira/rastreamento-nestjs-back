import { IsString, IsBoolean, IsOptional, MinLength, IsMongoId } from 'class-validator';

export class UpdateEntregadorDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password?: string;

  @IsString()
  @IsOptional()
  horarioTrabalho?: string

  @IsMongoId()
  @IsOptional()
  lojaBaseId?: string
}

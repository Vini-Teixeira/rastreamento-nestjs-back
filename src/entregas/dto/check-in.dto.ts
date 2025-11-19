import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codigoEntrega?: string;
}
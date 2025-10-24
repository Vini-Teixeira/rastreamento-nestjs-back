import { IsNotEmpty, IsString } from 'class-validator';

export class ChegueiAoLocalDto {
  @IsString()
  @IsNotEmpty()
  codigoSocorro: string;
}
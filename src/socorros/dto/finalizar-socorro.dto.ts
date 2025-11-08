import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class FinalizarSocorroDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  fotos: string[];
}
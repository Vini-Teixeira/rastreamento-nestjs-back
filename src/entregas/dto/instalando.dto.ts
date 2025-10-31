import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class InstalandoDto {
    @IsString()
    @IsNotEmpty()
    codigoEntrega: string

    @IsArray()
    @ArrayMinSize(4)
    @IsString({ each: true })
    fotos: string[]
}
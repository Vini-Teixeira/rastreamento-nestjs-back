import { IsArray, IsNotEmpty, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class InstalandoDto {
    @IsString()
    @IsOptional()
    //@IsNotEmpty()
    codigoEntrega?: string

    @IsArray()
    @ArrayMinSize(4)
    @IsString({ each: true })
    fotos: string[]
}
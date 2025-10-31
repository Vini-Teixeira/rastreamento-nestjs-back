import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejeicaoDto {
    @IsString()
    @IsNotEmpty()
    motivo: string

    @IsString()
    @IsOptional()
    @MaxLength(250)
    texto?: string
}
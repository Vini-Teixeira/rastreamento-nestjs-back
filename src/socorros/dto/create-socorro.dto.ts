import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsNumber, ValidateNested, Length, isNotEmpty } from 'class-validator';

class CoordinatesDto {
    @IsNumber()
    @IsNotEmpty()
    lat: number;

    @IsNumber()
    @IsNotEmpty()
    lng: number;
}

class ClientLocationDto {
    @IsString()
    @IsNotEmpty({ message: 'O endereço do cliente é obrigatório.' })
    address: string

    @IsOptional()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates?: CoordinatesDto;
}

export class CreateSocorroDto {
    @IsObject()
    @ValidateNested()
    @Type(() => ClientLocationDto)
    clientLocation: ClientLocationDto

    @IsString({ message: 'O nome do cliente deve ser um texto.' })
    @IsNotEmpty({ message: 'O nome do cliente deve ser obrigatório' })
    @Length(2, 100, {message: 'O nome do cliente deve ter entre 2 e 100 caracteres'})
    clienteNome: string;

    @IsString({ message: 'O telefone do cliente deve ser um número de telefone' })
    @IsNotEmpty({ message: 'O telefone do cliente é obrigatório' })
    @Length(10, 15, { message: "O telefone do cliente deve ter entre 10 e 15 caracteres (ex: 79912345678)" })
    clienteTelefone: string;

    @IsString()
    @IsOptional()
    @Length(7, 8, { message: 'A placa deve ter entre 7 e 8 caracteres.' })
    placaVeiculo?: string;

    @IsString()
    @IsOptional()
    @Length(2, 50, { message: 'O modelo deve ter entre 2 e 50 caracteres.' })
    modeloVeiculo?: string;

    @IsString()
    @IsOptional()
    serviceDescription?: string
}
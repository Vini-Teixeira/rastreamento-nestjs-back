import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  ValidateNested,
  IsOptional, // 1. Importar o IsOptional
} from 'class-validator';

// DTO para as coordenadas, usado na Origem
class CoordinatesDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

// DTO para a Origem, que vem completa do App Admin
class OriginLocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsNotEmpty()
  coordinates: CoordinatesDto;
}

// 2. DTO SIMPLIFICADO para o Destino
// Ele só precisa do endereço, pois o backend fará o geocoding.
class DestinationLocationDto {
    @IsString()
    @IsNotEmpty()
    address: string;
}


export class CreateDeliveryDto {
  @ValidateNested()
  @Type(() => OriginLocationDto) // Usa o DTO de Origem completo
  @IsNotEmpty()
  origin: OriginLocationDto;

  @IsOptional()
  @IsMongoId({ message: 'O ID do entregador deve ser um MongoID válido.' })
  driverId?: string;

  @ValidateNested()
  @Type(() => DestinationLocationDto) // 3. Usa o DTO de Destino simplificado
  @IsNotEmpty()
  destination: DestinationLocationDto;

  @IsString()
  @IsNotEmpty()
  itemDescription: string;
}

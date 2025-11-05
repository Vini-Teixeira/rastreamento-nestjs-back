import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  ValidateNested,
  IsOptional,
  IsBoolean
} from 'class-validator';

class CoordinatesDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

class OriginLocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsNotEmpty()
  coordinates: CoordinatesDto;
}


class DestinationLocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class CreateDeliveryDto {
  @ValidateNested()
  @Type(() => OriginLocationDto) 
  @IsNotEmpty()
  @IsOptional()
  origin?: OriginLocationDto;

  @IsOptional()
  @IsMongoId({ message: 'O ID do entregador deve ser um MongoID válido.' })
  driverId?: string;

  @ValidateNested()
  @Type(() => DestinationLocationDto)
  @IsNotEmpty()
  destination: DestinationLocationDto;

  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @IsMongoId()
  @IsOptional()
  origemId?: string

  @IsOptional()
  @IsBoolean()
  recolherSucata?: boolean

  @IsOptional()
  @IsString()
  tipoEntrega?: 'propria' | 'parceira';

  @IsOptional()
  @IsString()
  tipoDocumento?: 'NF' | 'CUPOM FISCAL';

  @IsOptional()
  @IsString()
  numeroDocumento?: string;
}

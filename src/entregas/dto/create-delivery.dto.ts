import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  ValidateNested,
  IsOptional,
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
}


export class CreateDeliveryDto {
  @ValidateNested()
  @Type(() => OriginLocationDto) 
  @IsNotEmpty()
  origin: OriginLocationDto;

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
}

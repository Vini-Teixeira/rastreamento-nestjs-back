import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { DeliveryStatus } from "../schemas/delivery.schema";

export class CoordinatesDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsOptional()
  timestamp?: Date;
}

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsNotEmpty()
  coordinates: CoordinatesDto;
}


export class UpdateDeliveryDto {
  @IsOptional()
  @IsString()
  itemDescription?: string;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  driverCurrentLocation?: CoordinatesDto;

  @IsOptional()
  @ValidateNested({ each: true }) 
  @Type(() => CoordinatesDto) 
  routeHistory?: CoordinatesDto[]; 
}
import { IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsLongitude()
  lng: number;
}

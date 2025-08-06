import { IsLatitude, IsLongitude, IsNotEmpty } from "class-validator";

export class UpdateLocationDto {
    @IsNotEmpty()
    @IsLatitude()
    lat: number;

    @IsNotEmpty()
    @IsLatitude()
    lng: number;
}
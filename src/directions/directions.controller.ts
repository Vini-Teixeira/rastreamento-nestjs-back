import { Controller, Get, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { GoogleMapsService } from "src/google-maps/google-maps.service";
import { FlexibleAuthGuard } from "src/auth/flexible-auth.guard";
import { IsNotEmpty, isNotEmpty, IsString } from "class-validator";

class DirectionsQueryDto {
    @IsString()
    @IsNotEmpty()
    origin: string

    @IsString()
    @IsNotEmpty()
    destination: string
}

@Controller('directions')
@UseGuards(FlexibleAuthGuard)
export class DirectionsController {
    constructor(private readonly googleMapsService: GoogleMapsService) {}

    @Get()
    async getDirections(@Query(new ValidationPipe()) query: DirectionsQueryDto ) {
        const [originLat, originLng] = query.origin.split(',').map(Number)
        const [destLat, destLng] = query.destination.split(',').map(Number)

        const originCoords = { type: 'Point', coordinates: [originLng, originLat] }
        const destinationCoords = { type: 'Point', coordinates: [destLng, destLat] }

        const polyline = await this.googleMapsService.getDirections(originCoords, destinationCoords)
        return { polyline }
    }
}
import { Module } from "@nestjs/common";
import { DirectionsController } from "./directions.controller";
import { GoogleMapsModule } from "src/google-maps/google-maps.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
    imports: [
        GoogleMapsModule,
        AuthModule
    ],
    controllers: [DirectionsController],
})
export class DirectionsModule {}
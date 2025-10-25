import { DeliveryStatus } from "../enums/delivery-status.enum";
export declare class CoordinatesDto {
    lat: number;
    lng: number;
    timestamp?: Date;
}
export declare class LocationDto {
    address: string;
    coordinates: CoordinatesDto;
}
export declare class UpdateDeliveryDto {
    itemDescription?: string;
    status?: DeliveryStatus;
    driverId?: string;
    driverCurrentLocation?: CoordinatesDto;
    routeHistory?: CoordinatesDto[];
}

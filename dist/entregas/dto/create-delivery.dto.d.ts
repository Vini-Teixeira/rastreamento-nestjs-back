declare class CoordinatesDto {
    lat: number;
    lng: number;
}
declare class OriginLocationDto {
    address: string;
    coordinates: CoordinatesDto;
}
declare class DestinationLocationDto {
    address: string;
}
export declare class CreateDeliveryDto {
    origin: OriginLocationDto;
    driverId?: string;
    destination: DestinationLocationDto;
    itemDescription: string;
}
export {};

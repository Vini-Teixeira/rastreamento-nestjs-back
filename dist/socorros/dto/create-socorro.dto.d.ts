declare class CoordinatesDto {
    lat: number;
    lng: number;
}
declare class ClientLocationDto {
    address: string;
    coordinates?: CoordinatesDto;
}
export declare class CreateSocorroDto {
    clientLocation: ClientLocationDto;
    clienteNome: string;
    clienteTelefone: string;
    placaVeiculo?: string;
    modeloVeiculo?: string;
    serviceDescription?: string;
}
export {};

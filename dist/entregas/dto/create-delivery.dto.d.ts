import { EModoPagamento } from '../enums/pagamento.enum';
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
    coordinates: CoordinatesDto;
}
export declare class CreateDeliveryDto {
    origin?: OriginLocationDto;
    clienteNome: string;
    clienteTelefone: string;
    modalidadePagamento: EModoPagamento;
    observacoes?: string;
    driverId?: string;
    destination: DestinationLocationDto;
    itemDescription: string;
    origemId?: string;
    recolherSucata?: boolean;
    tipoEntrega?: 'propria' | 'parceira';
    tipoDocumento?: 'NF' | 'CUPOM FISCAL';
    numeroDocumento?: string;
}
export {};

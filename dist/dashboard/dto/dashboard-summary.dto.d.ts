export declare class TopDriverDto {
    driverId: string;
    nome: string;
    totalEntregas: number;
}
export declare class DashboardSummaryDto {
    resumoDoDia: {
        concluidas: number;
        emAndamento: number;
        canceladas: number;
    };
    topEntregadores: TopDriverDto[];
    financeiro: {
        valorTotalArrecadado: number;
        moeda: 'BRL';
    };
    dataReferencia: Date;
}

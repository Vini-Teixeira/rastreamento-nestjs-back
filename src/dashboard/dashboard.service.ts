import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Delivery,
  DeliveryDocument,
} from 'src/entregas/schemas/delivery.schema';
import { DashboardSummaryDto, TopDriverDto } from './dto/dashboard-summary.dto';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const timeZone = 'America/Sao_Paulo';
    const agora = new Date();

    const hojeInicio = startOfDay(toZonedTime(agora, timeZone));
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = endOfDay(toZonedTime(agora, timeZone));
    hojeFim.setHours(23, 59, 59, 999);

    const [summaryResult, rankingResult] = await Promise.all([
      this.deliveryModel.aggregate([
        { $match: { createdAt: { $gte: hojeInicio, $lte: hojeFim } } },
        {
          $group: {
            _id: null,
            concluidas: {
              $sum: {
                $cond: [{ $eq: [{ $toUpper: '$status' }, 'DELIVERED'] }, 1, 0],
              },
            },
            emAndamento: {
              $sum: {
                $cond: [
                  {
                    $in: [{ $toUpper: '$status' }, ['ACCEPTED', 'ON_THE_WAY']],
                  },
                  1,
                  0,
                ],
              },
            },
            canceladas: {
              $sum: {
                $cond: [{ $eq: [{ $toUpper: '$status' }, 'CANCELLED'] }, 1, 0],
              },
            },
            valorTotalArrecadado: {
              $sum: {
                $cond: [
                  { $eq: [{ $toUpper: '$status' }, 'DELIVERED'] },
                  '$valor',
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.deliveryModel.aggregate([
        {
          $match: {
            status: 'DELIVERED',
            createdAt: { $gte: hojeInicio, $lte: hojeFim },
          },
        },
        { $group: { _id: '$driverId', totalEntregas: { $sum: 1 } } },
        { $sort: { totalEntregas: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: 'entregadores',
            localField: '_id',
            foreignField: '_id',
            as: 'entregadorInfo',
          },
        },
        {
          $project: {
            _id: 0,
            driverId: '$_id',
            nome: { $arrayElemAt: ['$entregadorInfo.nome', 0] },
            totalEntregas: '$totalEntregas',
          },
        },
      ]),
    ]);

    const summaryData = summaryResult[0] || {
      concluidas: 0,
      emAndamento: 0,
      canceladas: 0,
      valorTotalArrecadado: 0,
    };

    const response: DashboardSummaryDto = {
      resumoDoDia: {
        concluidas: summaryData.concluidas,
        emAndamento: summaryData.emAndamento,
        canceladas: summaryData.canceladas,
      },
      topEntregadores: rankingResult as TopDriverDto[],
      financeiro: {
        valorTotalArrecadado: summaryData.valorTotalArrecadado,
        moeda: 'BRL',
      },
      dataReferencia: new Date(),
    };

    return response;
  }
}

import { Model } from 'mongoose';
import { DeliveryDocument } from 'src/entregas/schemas/delivery.schema';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
export declare class DashboardService {
    private deliveryModel;
    constructor(deliveryModel: Model<DeliveryDocument>);
    getDashboardSummary(): Promise<DashboardSummaryDto>;
}

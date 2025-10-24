import { Types } from 'mongoose';
export interface Job {
    createdAt: Date;
    type: 'entrega' | 'socorro';
    driverId?: Types.ObjectId;
    solicitanteId: Types.ObjectId;
    [key: string]: any;
}

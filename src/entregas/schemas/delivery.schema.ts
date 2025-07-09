import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose'; 

export type DeliveryDocument = Delivery & Document;

export enum DeliveryStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class Coordinates {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop()
  timestamp?: Date;
}
export const CoordinatesSchema = SchemaFactory.createForClass(Coordinates); 

@Schema({ _id: false })
export class Location {
  @Prop({ required: true })
  address: string;


  @Prop({ required: true, type: CoordinatesSchema })
  coordinates: Coordinates; 
}
export const LocationSchema = SchemaFactory.createForClass(Location); 


@Schema({ timestamps: true })
export class Delivery extends Document {
  @Prop({ required: true, type: LocationSchema })
  origin: Location;

  @Prop({ required: true, type: LocationSchema })
  destination: Location;

  @Prop({ required: true })
  itemDescription: string;

  @Prop({ type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  @Prop({ type: Types.ObjectId, ref: 'Entregador', default: null })
  driverId?: Types.ObjectId;

  @Prop({ type: [CoordinatesSchema] })
  routeHistory?: Coordinates[];

  @Prop({ type: CoordinatesSchema })
  driverCurrentLocation?: Coordinates;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  token!: string;

  @Prop({ type: String })
  device?: string;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;

  @Prop({ type: Boolean, default: false })
  revoked!: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleEnum } from '../enums/role.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['password'];
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, enum: RoleEnum, required: true })
  role!: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop({ default: false })
  twoFactorEnabled!: boolean;

  @Prop({ default: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date, default: null })
  lockUntil?: Date | null;

  @Prop({ type: Date, default: null })
  lastLogin?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

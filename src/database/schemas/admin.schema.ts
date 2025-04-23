import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminDocument = Admin & Document;
export enum AdminRole {
  ADMIN='ADMIN',
  SUPER_ADMIN='SUPER_ADMIN',
}

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true })
  username: string;

  @Prop({ type: String, default: null })
  avatar: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: [
      {
        provider: { type: String, required: true }, 
        providerId: { type: String, required: true },
      },
    ],
    default: [],
  })
  providers: {
    provider: string;
    providerId: string;
  }[];

  @Prop({ default: AdminRole.ADMIN })
  role: AdminRole;

  @Prop({ default: true })
  isActive: boolean;
}
export const AdminSchema = SchemaFactory.createForClass(Admin);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ShareLink {
  _id!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  token!: string;

  @Prop({ type: Types.ObjectId, ref: 'SavedView', required: true, index: true })
  savedViewId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ShareLinkDocument = ShareLink & Document;
export const ShareLinkSchema = SchemaFactory.createForClass(ShareLink);

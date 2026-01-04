import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Folder {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null })
  parentId!: Types.ObjectId | null;

  createdAt!: Date;
}

export type FolderDocument = Folder & Document;
export const FolderSchema = SchemaFactory.createForClass(Folder);

// Index for listing folders by team
FolderSchema.index({ teamId: 1 });

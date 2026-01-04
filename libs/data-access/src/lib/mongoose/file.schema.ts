import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FileType, FileVisibility } from '@cloudfiles/contracts';

@Schema({ timestamps: true })
export class File {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Folder', required: true })
  folderId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: String, required: true, enum: ['PDF', 'DOC', 'IMG', 'OTHER'] })
  type!: FileType;

  @Prop({ required: true })
  sizeBytes!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String, required: true, enum: ['TEAM', 'OWNER_ONLY'] })
  visibility!: FileVisibility;

  createdAt!: Date;
  updatedAt!: Date;
}

export type FileDocument = File & Document;
export const FileSchema = SchemaFactory.createForClass(File);

// Index for listing files by folder
FileSchema.index({ folderId: 1 });
// Index for filtering by type
FileSchema.index({ folderId: 1, type: 1 });
// Index for full-text search on name
FileSchema.index({ name: 'text' });

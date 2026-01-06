import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model } from 'mongoose';

@Schema({ _id: false })
export class SavedViewFilters {
  @Prop()
  q?: string;

  @Prop({ type: String, enum: ['PDF', 'DOC', 'IMG', 'OTHER'] })
  type?: string;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ type: String, enum: ['name', 'updatedAt'] })
  sort?: string;

  @Prop({ type: String, enum: ['asc', 'desc'] })
  order?: string;
}

@Schema({ timestamps: true })
export class SavedView {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Folder', required: true })
  folderId!: Types.ObjectId;

  @Prop({ required: true, maxlength: 100 })
  name!: string;

  @Prop({ type: SavedViewFilters, default: {} })
  filters!: SavedViewFilters;

  createdAt!: Date;
  updatedAt!: Date;
}

export type SavedViewDocument = SavedView & Document;
export const SavedViewSchema = SchemaFactory.createForClass(SavedView);

SavedViewSchema.index({ userId: 1, folderId: 1 });
SavedViewSchema.index({ userId: 1, name: 1 }, { unique: true });

// Cascade delete: Remove all ShareLinks when a SavedView is deleted
SavedViewSchema.pre('deleteOne', { document: false, query: true }, async function () {
  const filter = this.getFilter();
  const viewId = filter['_id'];
  if (viewId) {
    // Get the ShareLink model from the connection
    const ShareLinkModel = this.model.db.model('ShareLink') as Model<Document>;
    await ShareLinkModel.deleteMany({ savedViewId: viewId });
  }
});

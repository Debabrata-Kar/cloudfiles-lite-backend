import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavedViewDto, SavedViewFiltersDto } from '@cloudfiles/contracts';
import { SavedView, SavedViewDocument } from '../mongoose/saved-view.schema';
import { Folder, FolderDocument } from '../mongoose/folder.schema';
import {
  TeamMembership,
  TeamMembershipDocument,
} from '../mongoose/membership.schema';

@Injectable()
export class SavedViewRepository {
  constructor(
    @InjectModel(SavedView.name)
    private savedViewModel: Model<SavedViewDocument>,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(TeamMembership.name)
    private membershipModel: Model<TeamMembershipDocument>
  ) {}

  async createSavedView(params: {
    userId: string;
    folderId: string;
    name: string;
    filters: SavedViewFiltersDto;
  }): Promise<SavedViewDto> {
    const { userId, folderId, name, filters } = params;

    const userObjectId = new Types.ObjectId(userId);
    const folderObjectId = new Types.ObjectId(folderId);

    const folder = await this.folderModel.findById(folderObjectId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const membership = await this.membershipModel.findOne({
      userId: userObjectId,
      teamId: folder.teamId,
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this folder');
    }

    const existingView = await this.savedViewModel.findOne({
      userId: userObjectId,
      name: name,
    });

    if (existingView) {
      throw new ConflictException(
        `A saved view with name "${name}" already exists`
      );
    }

    const savedView = await this.savedViewModel.create({
      userId: userObjectId,
      folderId: folderObjectId,
      name,
      filters: {
        q: filters.q,
        type: filters.type,
        tags: filters.tags,
        sort: filters.sort,
        order: filters.order,
      },
    });

    return this.toDto(savedView);
  }

  async listSavedViewsForUser(userId: string): Promise<SavedViewDto[]> {
    const views = await this.savedViewModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 });

    return views.map((view) => this.toDto(view));
  }

  async getSavedView(params: {
    viewId: string;
    userId: string;
  }): Promise<SavedViewDto | null> {
    const { viewId, userId } = params;

    if (!Types.ObjectId.isValid(viewId)) {
      return null;
    }

    const view = await this.savedViewModel.findOne({
      _id: new Types.ObjectId(viewId),
      userId: new Types.ObjectId(userId),
    });

    if (!view) {
      return null;
    }

    return this.toDto(view);
  }

  async getSavedViewById(viewId: string): Promise<SavedViewDto | null> {
    if (!Types.ObjectId.isValid(viewId)) {
      return null;
    }

    const view = await this.savedViewModel.findById(new Types.ObjectId(viewId));

    if (!view) {
      return null;
    }

    return this.toDto(view);
  }

  async deleteSavedView(params: {
    viewId: string;
    userId: string;
  }): Promise<boolean> {
    const { viewId, userId } = params;

    if (!Types.ObjectId.isValid(viewId)) {
      return false;
    }

    const result = await this.savedViewModel.deleteOne({
      _id: new Types.ObjectId(viewId),
      userId: new Types.ObjectId(userId),
    });

    return result.deletedCount === 1;
  }

  private toDto(view: SavedViewDocument): SavedViewDto {
    return {
      id: view._id.toString(),
      userId: view.userId.toString(),
      folderId: view.folderId.toString(),
      name: view.name,
      filters: {
        q: view.filters?.q,
        type: view.filters?.type as SavedViewFiltersDto['type'],
        tags: view.filters?.tags,
        sort: view.filters?.sort as SavedViewFiltersDto['sort'],
        order: view.filters?.order as SavedViewFiltersDto['order'],
      },
      createdAt: view.createdAt.toISOString(),
      updatedAt: view.updatedAt.toISOString(),
    };
  }
}

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { ShareLinkDto, TeamRole } from '@cloudfiles/contracts';
import { ShareLink, ShareLinkDocument } from '../mongoose/share-link.schema';
import { SavedView, SavedViewDocument } from '../mongoose/saved-view.schema';
import { User, UserDocument } from '../mongoose/user.schema';
import { Folder, FolderDocument } from '../mongoose/folder.schema';
import {
  TeamMembership,
  TeamMembershipDocument,
} from '../mongoose/membership.schema';

@Injectable()
export class ShareLinkRepository {
  constructor(
    @InjectModel(ShareLink.name)
    private shareLinkModel: Model<ShareLinkDocument>,
    @InjectModel(SavedView.name)
    private savedViewModel: Model<SavedViewDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Folder.name)
    private folderModel: Model<FolderDocument>,
    @InjectModel(TeamMembership.name)
    private membershipModel: Model<TeamMembershipDocument>
  ) {}

  async createShareLink(params: {
    userId: string;
    savedViewId: string;
    expiresInHours?: number;
    baseUrl: string;
  }): Promise<ShareLinkDto> {
    const { userId, savedViewId, expiresInHours, baseUrl } = params;

    if (!Types.ObjectId.isValid(savedViewId)) {
      throw new NotFoundException('Saved view not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const viewObjectId = new Types.ObjectId(savedViewId);

    const savedView = await this.savedViewModel.findById(viewObjectId);
    if (!savedView) {
      throw new NotFoundException('Saved view not found');
    }

    if (!savedView.userId.equals(userObjectId)) {
      throw new ForbiddenException('You can only share your own views');
    }

    const token = nanoid(21);

    let expiresAt: Date | null = null;
    if (expiresInHours) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const shareLink = await this.shareLinkModel.create({
      token,
      savedViewId: viewObjectId,
      createdBy: userObjectId,
      expiresAt,
    });

    return this.toDto(shareLink, baseUrl);
  }

  async getShareLinkByToken(token: string): Promise<{
    shareLink: ShareLinkDocument;
    savedView: SavedViewDocument;
    folder: FolderDocument;
    ownerName: string;
    ownerRole: TeamRole;
  } | null> {
    const shareLink = await this.shareLinkModel.findOne({ token });
    if (!shareLink) {
      return null;
    }

    if (this.isExpired(shareLink.expiresAt)) {
      return null;
    }

    const savedView = await this.savedViewModel.findById(shareLink.savedViewId);
    if (!savedView) {
      return null;
    }

    const folder = await this.folderModel.findById(savedView.folderId);
    if (!folder) {
      return null;
    }

    const owner = await this.userModel.findById(shareLink.createdBy);
    if (!owner) {
      return null;
    }

    const membership = await this.membershipModel.findOne({
      userId: shareLink.createdBy,
      teamId: folder.teamId,
    });

    const ownerRole = (membership?.role as TeamRole) || TeamRole.MEMBER;

    return {
      shareLink,
      savedView,
      folder,
      ownerName: owner.name,
      ownerRole,
    };
  }

  async listShareLinksForView(params: {
    userId: string;
    savedViewId: string;
    baseUrl: string;
  }): Promise<ShareLinkDto[]> {
    const { userId, savedViewId, baseUrl } = params;

    if (!Types.ObjectId.isValid(savedViewId)) {
      throw new NotFoundException('Saved view not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const viewObjectId = new Types.ObjectId(savedViewId);

    const savedView = await this.savedViewModel.findById(viewObjectId);
    if (!savedView) {
      throw new NotFoundException('Saved view not found');
    }

    if (!savedView.userId.equals(userObjectId)) {
      throw new ForbiddenException('You can only view shares for your own views');
    }

    const links = await this.shareLinkModel
      .find({ savedViewId: viewObjectId })
      .sort({ createdAt: -1 });

    return links
      .filter((link) => !this.isExpired(link.expiresAt))
      .map((link) => this.toDto(link, baseUrl));
  }

  async deleteShareLink(params: {
    userId: string;
    savedViewId: string;
    linkId: string;
  }): Promise<boolean> {
    const { userId, savedViewId, linkId } = params;

    if (!Types.ObjectId.isValid(savedViewId) || !Types.ObjectId.isValid(linkId)) {
      return false;
    }

    const userObjectId = new Types.ObjectId(userId);
    const viewObjectId = new Types.ObjectId(savedViewId);
    const linkObjectId = new Types.ObjectId(linkId);

    const savedView = await this.savedViewModel.findById(viewObjectId);
    if (!savedView || !savedView.userId.equals(userObjectId)) {
      return false;
    }

    const result = await this.shareLinkModel.deleteOne({
      _id: linkObjectId,
      savedViewId: viewObjectId,
    });

    return result.deletedCount === 1;
  }

  private isExpired(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return expiresAt < new Date();
  }

  private toDto(link: ShareLinkDocument, baseUrl: string): ShareLinkDto {
    return {
      id: link._id.toString(),
      token: link.token,
      savedViewId: link.savedViewId.toString(),
      createdBy: link.createdBy.toString(),
      expiresAt: link.expiresAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
      shareUrl: `${baseUrl}/shared/${link.token}`,
    };
  }
}

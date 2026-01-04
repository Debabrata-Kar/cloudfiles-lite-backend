import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FolderDto } from '@cloudfiles/contracts';
import { Folder, FolderDocument } from '../mongoose/folder.schema';
import { TeamMembership, TeamMembershipDocument } from '../mongoose/membership.schema';
import { Team, TeamDocument } from '../mongoose/team.schema';

@Injectable()
export class FolderRepository {
  constructor(
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(TeamMembership.name) private membershipModel: Model<TeamMembershipDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>
  ) {}

  /**
   * Lists all folders accessible to a user based on their team memberships
   */
  async listFoldersForUser(userId: string): Promise<FolderDto[]> {
    // Get all team memberships for the user
    const memberships = await this.membershipModel.find({
      userId: new Types.ObjectId(userId),
    });

    if (memberships.length === 0) {
      return [];
    }

    const teamIds = memberships.map((m) => m.teamId);

    // Get all folders for those teams
    const folders = await this.folderModel
      .find({
        teamId: { $in: teamIds },
      })
      .sort({ createdAt: -1 });

    return folders.map((folder) => ({
      id: folder._id.toString(),
      teamId: folder.teamId.toString(),
      name: folder.name,
      parentId: folder.parentId?.toString() ?? null,
      createdAt: folder.createdAt.toISOString(),
    }));
  }

  /**
   * Gets a folder by ID
   */
  async getFolderById(folderId: string): Promise<FolderDocument | null> {
    return this.folderModel.findById(new Types.ObjectId(folderId));
  }
}

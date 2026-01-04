import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FileDto,
  ListFilesQuery,
  PaginatedFilesDto,
  TeamRole,
  FileVisibility,
} from '@cloudfiles/contracts';
import { canReadFile } from '@cloudfiles/permissions';
import { File, FileDocument } from '../mongoose/file.schema';
import { Folder, FolderDocument } from '../mongoose/folder.schema';
import { TeamMembership, TeamMembershipDocument } from '../mongoose/membership.schema';
import { cached, hashQuery } from '../redis/cache';

const CACHE_TTL_SECONDS = 60; // 1 minute cache

@Injectable()
export class FileRepository {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(TeamMembership.name) private membershipModel: Model<TeamMembershipDocument>
  ) {}

  /**
   * Lists files in a folder with filtering, sorting, and visibility rules.
   */
  async listFilesForFolder(params: {
    userId: string;
    folderId: string;
    query: ListFilesQuery;
  }): Promise<PaginatedFilesDto> {
    const { userId, folderId, query } = params;

    // Get the folder to find its team
    const folder = await this.folderModel.findById(new Types.ObjectId(folderId));
    if (!folder) {
      throw new ForbiddenException('Folder not found');
    }

    // Check user membership in the folder's team
    const membership = await this.membershipModel.findOne({
      userId: new Types.ObjectId(userId),
      teamId: folder.teamId,
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this folder');
    }

    const role = membership.role as TeamRole;

    const cacheKey = `files:list:${folderId}:${hashQuery(query as unknown as Record<string, unknown>)}`;

    return cached<PaginatedFilesDto>({
      key: cacheKey,
      ttlSeconds: CACHE_TTL_SECONDS,
      fn: async () => {
        return this.fetchFilesFromDb({ folderId, query, role });
      },
    });
  }

  /**
   * Fetches files from the database with filters applied
   */
  private async fetchFilesFromDb(params: {
    folderId: string;
    query: ListFilesQuery;
    role: TeamRole;
  }): Promise<PaginatedFilesDto> {
    const { folderId, query, role } = params;

    // Build the MongoDB query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mongoQuery: Record<string, any> = {
      folderId: new Types.ObjectId(folderId),
    };

    // Apply visibility filter based on role
    if (role === TeamRole.MEMBER) {
      mongoQuery['visibility'] = FileVisibility.TEAM;
    }
    // OWNER can see all files (no visibility filter needed)

    // Apply search filter
    if (query.q) {
      mongoQuery['name'] = { $regex: query.q, $options: 'i' };
    }

    // Apply type filter
    if (query.type) {
      mongoQuery['type'] = query.type;
    }

    // Apply tags filter
    if (query.tags && query.tags.length > 0) {
      mongoQuery['tags'] = { $all: query.tags };
    }

    // Build sort
    const sortField = query.sort || 'updatedAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    // Apply limit
    const limit = query.limit || 25;

    // Execute query
    const [files, total] = await Promise.all([
      this.fileModel.find(mongoQuery).sort(sort).limit(limit),
      this.fileModel.countDocuments(mongoQuery),
    ]);

    // Map to DTOs
    const fileDtos: FileDto[] = files.map((file) => ({
      id: file._id.toString(),
      teamId: file.teamId.toString(),
      folderId: file.folderId.toString(),
      name: file.name,
      type: file.type,
      sizeBytes: file.sizeBytes,
      tags: file.tags,
      visibility: file.visibility,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    }));

    return {
      files: fileDtos,
      total,
      limit,
    };
  }
}

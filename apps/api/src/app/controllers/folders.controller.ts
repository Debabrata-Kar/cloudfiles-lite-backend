import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FolderRepository, FileRepository } from '@cloudfiles/data-access';
import { ListFilesQuerySchema } from '@cloudfiles/contracts';
import { RequestWithUser } from '../middleware/user.middleware';

@Controller('folders')
export class FoldersController {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly fileRepository: FileRepository
  ) {}

  /**
   * GET /api/folders
   * Lists all folders accessible to the current user
   */
  @Get()
  async listFolders(@Req() req: RequestWithUser) {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    return this.folderRepository.listFoldersForUser(req.userId);
  }

  /**
   * GET /api/folders/:folderId/files
   * Lists files in a folder with optional filters
   */
  @Get(':folderId/files')
  async listFilesInFolder(
    @Req() req: RequestWithUser,
    @Param('folderId') folderId: string,
    @Query() rawQuery: Record<string, unknown>
  ) {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    // Parse query parameters
    // Handle tags as array if needed
    if (typeof rawQuery['tags'] === 'string') {
      rawQuery['tags'] = [rawQuery['tags']];
    }
    // Parse limit as number
    if (typeof rawQuery['limit'] === 'string') {
      rawQuery['limit'] = parseInt(rawQuery['limit'], 10);
    }

    // Validate query parameters using Zod schema
    const parseResult = ListFilesQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Invalid query parameters',
        errors: parseResult.error.issues,
      });
    }

    return this.fileRepository.listFilesForFolder({
      userId: req.userId,
      folderId,
      query: parseResult.data,
    });
  }
}

import {
  Controller,
  Get,
  Param,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { ShareLinkRepository, FileRepository } from '@cloudfiles/data-access';
import { SharedViewResponse, SavedViewFiltersDto } from '@cloudfiles/contracts';

@Controller('shared')
export class SharedController {
  constructor(
    private readonly shareLinkRepository: ShareLinkRepository,
    private readonly fileRepository: FileRepository
  ) {}

  @Get(':token')
  async getSharedView(@Param('token') token: string): Promise<SharedViewResponse> {
    const result = await this.shareLinkRepository.getShareLinkByToken(token);

    if (!result) {
      throw new NotFoundException('Share link not found');
    }

    const { shareLink, savedView, folder, ownerName, ownerRole } = result;

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new GoneException('Share link has expired');
    }

    const filters: SavedViewFiltersDto = {
      q: savedView.filters?.q,
      type: savedView.filters?.type as SavedViewFiltersDto['type'],
      tags: savedView.filters?.tags,
      sort: savedView.filters?.sort as SavedViewFiltersDto['sort'],
      order: savedView.filters?.order as SavedViewFiltersDto['order'],
    };

    const files = await this.fileRepository.listFilesForSharedView({
      folderId: savedView.folderId.toString(),
      query: filters,
      ownerRole,
    });

    return {
      view: {
        id: savedView._id.toString(),
        name: savedView.name,
        folderName: folder.name,
        filters,
        createdAt: savedView.createdAt.toISOString(),
      },
      files,
      sharedBy: ownerName,
      expiresAt: shareLink.expiresAt?.toISOString() ?? null,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SavedViewRepository, ShareLinkRepository } from '@cloudfiles/data-access';
import {
  CreateSavedViewRequestSchema,
  CreateShareLinkRequestSchema,
  SavedViewDto,
  ShareLinkDto,
} from '@cloudfiles/contracts';
import { RequestWithUser } from '../middleware/user.middleware';

@Controller('saved-views')
export class SavedViewsController {
  constructor(
    private readonly savedViewRepository: SavedViewRepository,
    private readonly shareLinkRepository: ShareLinkRepository
  ) {}

  @Post()
  async createSavedView(
    @Req() req: RequestWithUser,
    @Body() body: unknown
  ): Promise<SavedViewDto> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const parseResult = CreateSavedViewRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parseResult.error.issues,
      });
    }

    const { folderId, name, filters } = parseResult.data;

    return this.savedViewRepository.createSavedView({
      userId: req.userId,
      folderId,
      name,
      filters,
    });
  }

  @Get()
  async listSavedViews(@Req() req: RequestWithUser): Promise<SavedViewDto[]> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    return this.savedViewRepository.listSavedViewsForUser(req.userId);
  }

  @Get(':id')
  async getSavedView(
    @Req() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<SavedViewDto> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const view = await this.savedViewRepository.getSavedView({
      viewId: id,
      userId: req.userId,
    });

    if (!view) {
      throw new NotFoundException('Saved view not found');
    }

    return view;
  }

  @Delete(':id')
  async deleteSavedView(
    @Req() req: RequestWithUser,
    @Param('id') id: string
  ): Promise<{ success: boolean }> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const deleted = await this.savedViewRepository.deleteSavedView({
      viewId: id,
      userId: req.userId,
    });

    if (!deleted) {
      throw new NotFoundException('Saved view not found');
    }

    return { success: true };
  }

  @Post(':viewId/share')
  @HttpCode(HttpStatus.CREATED)
  async createShareLink(
    @Req() req: RequestWithUser,
    @Param('viewId') viewId: string,
    @Body() body: unknown
  ): Promise<ShareLinkDto> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const parseResult = CreateShareLinkRequestSchema.safeParse(body || {});
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parseResult.error.issues,
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return this.shareLinkRepository.createShareLink({
      userId: req.userId,
      savedViewId: viewId,
      expiresInHours: parseResult.data.expiresInHours,
      baseUrl,
    });
  }

  @Get(':viewId/shares')
  async listShareLinks(
    @Req() req: RequestWithUser,
    @Param('viewId') viewId: string
  ): Promise<ShareLinkDto[]> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return this.shareLinkRepository.listShareLinksForView({
      userId: req.userId,
      savedViewId: viewId,
      baseUrl,
    });
  }

  @Delete(':viewId/shares/:linkId')
  async deleteShareLink(
    @Req() req: RequestWithUser,
    @Param('viewId') viewId: string,
    @Param('linkId') linkId: string
  ): Promise<{ success: boolean }> {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const deleted = await this.shareLinkRepository.deleteShareLink({
      userId: req.userId,
      savedViewId: viewId,
      linkId,
    });

    if (!deleted) {
      throw new NotFoundException('Share link not found');
    }

    return { success: true };
  }
}

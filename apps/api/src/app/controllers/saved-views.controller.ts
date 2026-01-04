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
} from '@nestjs/common';
import { SavedViewRepository } from '@cloudfiles/data-access';
import {
  CreateSavedViewRequestSchema,
  SavedViewDto,
} from '@cloudfiles/contracts';
import { RequestWithUser } from '../middleware/user.middleware';

@Controller('saved-views')
export class SavedViewsController {
  constructor(private readonly savedViewRepository: SavedViewRepository) {}

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
}

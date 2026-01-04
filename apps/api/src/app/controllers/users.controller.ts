import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '@cloudfiles/data-access';
import { RequestWithUser } from '../middleware/user.middleware';

@Controller()
export class UsersController {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * GET /api/users
   * Lists all users (for user switcher in UI)
   */
  @Get('users')
  async listUsers() {
    return this.userRepository.listUsers();
  }

  /**
   * GET /api/me
   * Gets current user with their team memberships
   */
  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    if (!req.userId) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const user = await this.userRepository.getUserWithMemberships(req.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}

import {
  Controller,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import {
  User,
  UserDocument,
  Team,
  TeamDocument,
  TeamMembership,
  TeamMembershipDocument,
  Folder,
  FolderDocument,
  File,
  FileDocument,
  getRedis,
} from '@cloudfiles/data-access';
import { seedDatabase } from '@cloudfiles/test-support';

@Controller('dev')
export class DevController {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(TeamMembership.name) private membershipModel: Model<TeamMembershipDocument>,
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>
  ) {}

  /**
   * POST /api/dev/seed
   * Seeds the database with test data
   * Only available in non-production environments
   */
  @Post('seed')
  async seed() {
    // Guard against running in production
    if (process.env['NODE_ENV'] === 'production') {
      throw new ForbiddenException('Seed endpoint is not available in production');
    }

    // Flush Redis cache
    const redis = getRedis();
    await redis.flushall();
    console.log('Flushed Redis cache');

    // Run seed
    const seedData = await seedDatabase({
      userModel: this.userModel,
      teamModel: this.teamModel,
      membershipModel: this.membershipModel,
      folderModel: this.folderModel,
      fileModel: this.fileModel,
    });

    return {
      message: 'Database seeded successfully',
      data: seedData,
    };
  }

  /**
   * POST /api/dev/flush-cache
   * Flushes the Redis cache
   * Only available in non-production environments
   */
  @Post('flush-cache')
  async flushCache() {
    if (process.env['NODE_ENV'] === 'production') {
      throw new ForbiddenException('Flush cache endpoint is not available in production');
    }

    const redis = getRedis();
    await redis.flushall();

    return {
      message: 'Cache flushed successfully',
    };
  }
}

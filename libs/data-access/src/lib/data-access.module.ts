import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User, UserSchema } from './mongoose/user.schema';
import { Team, TeamSchema } from './mongoose/team.schema';
import { TeamMembership, TeamMembershipSchema } from './mongoose/membership.schema';
import { Folder, FolderSchema } from './mongoose/folder.schema';
import { File, FileSchema } from './mongoose/file.schema';

import { UserRepository } from './repositories/user.repository';
import { FolderRepository } from './repositories/folder.repository';
import { FileRepository } from './repositories/file.repository';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Team.name, schema: TeamSchema },
      { name: TeamMembership.name, schema: TeamMembershipSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  providers: [UserRepository, FolderRepository, FileRepository],
  exports: [
    UserRepository,
    FolderRepository,
    FileRepository,
    MongooseModule,
  ],
})
export class DataAccessModule {}

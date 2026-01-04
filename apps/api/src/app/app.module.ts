import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataAccessModule } from '@cloudfiles/data-access';

import { UsersController } from './controllers/users.controller';
import { FoldersController } from './controllers/folders.controller';
import { DevController } from './controllers/dev.controller';
import { UserMiddleware } from './middleware/user.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DataAccessModule,
  ],
  controllers: [
    UsersController,
    FoldersController,
    DevController,
  ],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('*');
  }
}

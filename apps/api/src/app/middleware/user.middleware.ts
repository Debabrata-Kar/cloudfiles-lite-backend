import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithUser extends Request {
  userId?: string;
}

@Injectable()
export class UserMiddleware implements NestMiddleware {
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'];
    if (userId && typeof userId === 'string') {
      req.userId = userId;
    }
    next();
  }
}

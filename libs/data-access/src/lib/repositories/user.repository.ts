import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDto, UserWithMembershipsDto, TeamRole } from '@cloudfiles/contracts';
import { User, UserDocument } from '../mongoose/user.schema';
import { TeamMembership, TeamMembershipDocument } from '../mongoose/membership.schema';
import { Team, TeamDocument } from '../mongoose/team.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TeamMembership.name) private membershipModel: Model<TeamMembershipDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>
  ) {}

  /**
   * Lists all users
   */
  async listUsers(): Promise<UserDto[]> {
    const users = await this.userModel.find().sort({ name: 1 });
    return users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    }));
  }

  /**
   * Gets a user by ID with their team memberships
   */
  async getUserWithMemberships(userId: string): Promise<UserWithMembershipsDto | null> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) {
      return null;
    }

    // Get memberships
    const memberships = await this.membershipModel.find({
      userId: new Types.ObjectId(userId),
    });

    // Get team names
    const teamIds = memberships.map((m) => m.teamId);
    const teams = await this.teamModel.find({ _id: { $in: teamIds } });
    const teamMap = new Map(teams.map((t) => [t._id.toString(), t.name]));

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      memberships: memberships.map((m) => ({
        teamId: m.teamId.toString(),
        teamName: teamMap.get(m.teamId.toString()) || 'Unknown',
        role: m.role as TeamRole,
      })),
    };
  }

  /**
   * Gets a user by ID
   */
  async getUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(new Types.ObjectId(userId));
  }
}

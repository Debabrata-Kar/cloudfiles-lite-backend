import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TeamRole } from '@cloudfiles/contracts';

@Schema({ timestamps: true })
export class TeamMembership {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId!: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['OWNER', 'MEMBER'] })
  role!: TeamRole;
}

export type TeamMembershipDocument = TeamMembership & Document;
export const TeamMembershipSchema = SchemaFactory.createForClass(TeamMembership);

// Compound index for userId + teamId uniqueness
TeamMembershipSchema.index({ userId: 1, teamId: 1 }, { unique: true });

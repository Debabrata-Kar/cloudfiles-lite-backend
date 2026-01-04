import { z } from 'zod';
import { FileType, FileVisibility, TeamRole } from './enums';

// ============ User DTOs ============
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

// ============ Team DTOs ============
export const TeamDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type TeamDto = z.infer<typeof TeamDtoSchema>;

// ============ Team Membership DTOs ============
export const TeamMembershipDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string(),
  role: z.enum([TeamRole.OWNER, TeamRole.MEMBER]),
});

export type TeamMembershipDto = z.infer<typeof TeamMembershipDtoSchema>;

// ============ Folder DTOs ============
export const FolderDtoSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  parentId: z.string().optional().nullable(),
  createdAt: z.string(),
});

export type FolderDto = z.infer<typeof FolderDtoSchema>;

// ============ File DTOs ============
export const FileDtoSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  folderId: z.string(),
  name: z.string(),
  type: z.enum([FileType.PDF, FileType.DOC, FileType.IMG, FileType.OTHER]),
  sizeBytes: z.number(),
  tags: z.array(z.string()),
  visibility: z.enum([FileVisibility.TEAM, FileVisibility.OWNER_ONLY]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FileDto = z.infer<typeof FileDtoSchema>;

// ============ Paginated Files DTO ============
export const PaginatedFilesDtoSchema = z.object({
  files: z.array(FileDtoSchema),
  total: z.number(),
  limit: z.number(),
});

export type PaginatedFilesDto = z.infer<typeof PaginatedFilesDtoSchema>;

// ============ List Files Query ============
export const ListFilesQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum([FileType.PDF, FileType.DOC, FileType.IMG, FileType.OTHER]).optional(),
  tags: z.array(z.string()).optional(),
  sort: z.enum(['name', 'updatedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).default(25).optional(),
});

export type ListFilesQuery = z.infer<typeof ListFilesQuerySchema>;

// ============ User with Memberships DTO ============
export const UserWithMembershipsDtoSchema = z.object({
  user: UserDtoSchema,
  memberships: z.array(
    z.object({
      teamId: z.string(),
      teamName: z.string(),
      role: z.enum([TeamRole.OWNER, TeamRole.MEMBER]),
    })
  ),
});

export type UserWithMembershipsDto = z.infer<typeof UserWithMembershipsDtoSchema>;


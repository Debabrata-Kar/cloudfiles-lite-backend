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

// ============ Saved View DTOs ============
export const SavedViewFiltersDtoSchema = z.object({
  q: z.string().optional(),
  type: z
    .enum([FileType.PDF, FileType.DOC, FileType.IMG, FileType.OTHER])
    .optional(),
  tags: z.array(z.string()).optional(),
  sort: z.enum(['name', 'updatedAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type SavedViewFiltersDto = z.infer<typeof SavedViewFiltersDtoSchema>;

export const SavedViewDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  folderId: z.string(),
  name: z.string(),
  filters: SavedViewFiltersDtoSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedViewDto = z.infer<typeof SavedViewDtoSchema>;

export const CreateSavedViewRequestSchema = z.object({
  folderId: z.string().min(1, 'folderId is required'),
  name: z
    .string()
    .min(1, 'name is required')
    .max(100, 'name must be 100 characters or less'),
  filters: SavedViewFiltersDtoSchema.optional().default({}),
});

export type CreateSavedViewRequest = z.infer<typeof CreateSavedViewRequestSchema>;

// ============ Share Link DTOs ============
export const ShareLinkDtoSchema = z.object({
  id: z.string(),
  token: z.string(),
  savedViewId: z.string(),
  createdBy: z.string(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  shareUrl: z.string(),
});

export type ShareLinkDto = z.infer<typeof ShareLinkDtoSchema>;

export const CreateShareLinkRequestSchema = z.object({
  expiresInHours: z.number().min(1).max(8760).optional(),
});

export type CreateShareLinkRequest = z.infer<typeof CreateShareLinkRequestSchema>;

export const SharedViewResponseSchema = z.object({
  view: z.object({
    id: z.string(),
    name: z.string(),
    folderName: z.string(),
    filters: SavedViewFiltersDtoSchema,
    createdAt: z.string(),
  }),
  files: PaginatedFilesDtoSchema,
  sharedBy: z.string(),
  expiresAt: z.string().nullable(),
});

export type SharedViewResponse = z.infer<typeof SharedViewResponseSchema>;

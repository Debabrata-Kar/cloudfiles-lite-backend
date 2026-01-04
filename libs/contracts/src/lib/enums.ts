export const TeamRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const FileType = {
  PDF: 'PDF',
  DOC: 'DOC',
  IMG: 'IMG',
  OTHER: 'OTHER',
} as const;

export type FileType = (typeof FileType)[keyof typeof FileType];

export const FileVisibility = {
  TEAM: 'TEAM',
  OWNER_ONLY: 'OWNER_ONLY',
} as const;

export type FileVisibility = (typeof FileVisibility)[keyof typeof FileVisibility];

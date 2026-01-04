import { FileVisibility, TeamRole } from '@cloudfiles/contracts';

export interface TeamMembershipInfo {
  teamId: string;
  role: TeamRole;
}

export interface UserScopeInput {
  userId: string;
  memberships: TeamMembershipInfo[];
}

/**
 * Generates a stable scope key for a user that includes their team memberships and roles.
 * This key is intended to be used for cache invalidation/scoping.
 *
 * @param input - User ID and their team memberships with roles
 * @returns A stable string key like "user:<id>|teams:<teamId>:OWNER,<teamId2>:MEMBER"
 */
export function getUserScopeKey(input: UserScopeInput): string {
  const { userId, memberships } = input;

  // Sort memberships by teamId for stability
  const sortedMemberships = [...memberships].sort((a, b) =>
    a.teamId.localeCompare(b.teamId)
  );

  const teamsStr = sortedMemberships
    .map((m) => `${m.teamId}:${m.role}`)
    .join(',');

  return `user:${userId}|teams:${teamsStr}`;
}

export interface CanReadFileInput {
  role: TeamRole;
  fileVisibility: FileVisibility;
}

/**
 * Determines if a user with a given role can read a file with a given visibility.
 *
 * - TEAM visibility: Both OWNER and MEMBER can read
 * - OWNER_ONLY visibility: Only OWNER can read
 *
 * @param input - The user's role and the file's visibility
 * @returns true if the user can read the file, false otherwise
 */
export function canReadFile(input: CanReadFileInput): boolean {
  const { role, fileVisibility } = input;

  if (fileVisibility === FileVisibility.TEAM) {
    // TEAM files are visible to both OWNER and MEMBER
    return true;
  }

  if (fileVisibility === FileVisibility.OWNER_ONLY) {
    // OWNER_ONLY files are visible only to OWNER
    return role === TeamRole.OWNER;
  }

  return false;
}

export interface CanReadFolderInput {
  membershipExists: boolean;
}

/**
 * Determines if a user can read a folder based on whether they have a membership
 * in the team that owns the folder.
 *
 * @param input - Whether the user has a membership for the folder's team
 * @returns true if the user can read the folder, false otherwise
 */
export function canReadFolder(input: CanReadFolderInput): boolean {
  return input.membershipExists;
}

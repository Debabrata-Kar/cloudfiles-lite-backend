import {
  UserDto,
  UserWithMembershipsDto,
  FolderDto,
  PaginatedFilesDto,
  ListFilesQuery,
  SavedViewDto,
  CreateSavedViewRequest,
  ShareLinkDto,
  CreateShareLinkRequest,
  SharedViewResponse,
} from '@cloudfiles/contracts';

export interface ApiClientConfig {
  baseUrl: string;
  getUserId: () => string | null;
}

export interface ApiClient {
  users: {
    list(): Promise<UserDto[]>;
  };
  me: {
    get(): Promise<UserWithMembershipsDto>;
  };
  folders: {
    list(): Promise<FolderDto[]>;
  };
  files: {
    list(folderId: string, query?: ListFilesQuery): Promise<PaginatedFilesDto>;
  };
  savedViews: {
    create(data: CreateSavedViewRequest): Promise<SavedViewDto>;
    list(): Promise<SavedViewDto[]>;
    get(id: string): Promise<SavedViewDto>;
    delete(id: string): Promise<{ success: boolean }>;
    createShareLink(viewId: string, data?: CreateShareLinkRequest): Promise<ShareLinkDto>;
    listShareLinks(viewId: string): Promise<ShareLinkDto[]>;
    deleteShareLink(viewId: string, linkId: string): Promise<{ success: boolean }>;
  };
  shared: {
    getByToken(token: string): Promise<SharedViewResponse>;
  };
}

async function fetchWithAuth<T>(
  config: ApiClientConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = config.getUserId();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (userId) {
    (headers as Record<string, string>)['x-user-id'] = userId;
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

async function fetchPublic<T>(
  config: ApiClientConfig,
  path: string
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return {
    users: {
      async list(): Promise<UserDto[]> {
        return fetchWithAuth<UserDto[]>(config, '/api/users');
      },
    },
    me: {
      async get(): Promise<UserWithMembershipsDto> {
        return fetchWithAuth<UserWithMembershipsDto>(config, '/api/me');
      },
    },
    folders: {
      async list(): Promise<FolderDto[]> {
        return fetchWithAuth<FolderDto[]>(config, '/api/folders');
      },
    },
    files: {
      async list(folderId: string, query?: ListFilesQuery): Promise<PaginatedFilesDto> {
        const qs = query ? buildQueryString(query as unknown as Record<string, unknown>) : '';
        return fetchWithAuth<PaginatedFilesDto>(config, `/api/folders/${folderId}/files${qs}`);
      },
    },
    savedViews: {
      async create(data: CreateSavedViewRequest): Promise<SavedViewDto> {
        return fetchWithAuth<SavedViewDto>(config, '/api/saved-views', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      async list(): Promise<SavedViewDto[]> {
        return fetchWithAuth<SavedViewDto[]>(config, '/api/saved-views');
      },
      async get(id: string): Promise<SavedViewDto> {
        return fetchWithAuth<SavedViewDto>(config, `/api/saved-views/${id}`);
      },
      async delete(id: string): Promise<{ success: boolean }> {
        return fetchWithAuth<{ success: boolean }>(config, `/api/saved-views/${id}`, {
          method: 'DELETE',
        });
      },
      async createShareLink(viewId: string, data?: CreateShareLinkRequest): Promise<ShareLinkDto> {
        return fetchWithAuth<ShareLinkDto>(config, `/api/saved-views/${viewId}/share`, {
          method: 'POST',
          body: JSON.stringify(data || {}),
        });
      },
      async listShareLinks(viewId: string): Promise<ShareLinkDto[]> {
        return fetchWithAuth<ShareLinkDto[]>(config, `/api/saved-views/${viewId}/shares`);
      },
      async deleteShareLink(viewId: string, linkId: string): Promise<{ success: boolean }> {
        return fetchWithAuth<{ success: boolean }>(config, `/api/saved-views/${viewId}/shares/${linkId}`, {
          method: 'DELETE',
        });
      },
    },
    shared: {
      async getByToken(token: string): Promise<SharedViewResponse> {
        return fetchPublic<SharedViewResponse>(config, `/api/shared/${token}`);
      },
    },
  };
}

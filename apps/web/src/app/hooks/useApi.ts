import { useMemo } from 'react';
import { createApiClient, ApiClient } from '@cloudfiles/api-client';

const API_BASE_URL = 'http://localhost:3000';

function getUserIdFromStorage(): string | null {
  return localStorage.getItem('userId');
}

export function useApi(): ApiClient {
  return useMemo(() => {
    return createApiClient({
      baseUrl: API_BASE_URL,
      getUserId: getUserIdFromStorage,
    });
  }, []);
}

export function setCurrentUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem('userId', userId);
  } else {
    localStorage.removeItem('userId');
  }
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem('userId');
}

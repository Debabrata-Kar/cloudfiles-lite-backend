import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useUser } from '../context/UserContext';
import { FileType, ListFilesQuery } from '@cloudfiles/contracts';
import { SaveViewModal } from './SaveViewModal';

export function FilesTable() {
  const api = useApi();
  const { folderId } = useParams<{ folderId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useUser();
  const prevFolderIdRef = useRef<string | undefined>(undefined);

  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState<FileType | ''>(
    (searchParams.get('type') as FileType) || ''
  );
  const [sortField, setSortField] = useState<'name' | 'updatedAt'>(
    (searchParams.get('sort') as 'name' | 'updatedAt') || 'updatedAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  useEffect(() => {
    if (prevFolderIdRef.current && prevFolderIdRef.current !== folderId) {
      setSearchInput('');
      setDebouncedSearch('');
      setTypeFilter('');
      setSortField('updatedAt');
      setSortOrder('desc');
      setSearchParamsRef.current({}, { replace: true });
    }
    prevFolderIdRef.current = folderId;
  }, [folderId]);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current);
      setDebouncedSearch(searchInput);
    }
  };

  useEffect(() => {
    const handler = (e: CustomEvent<ListFilesQuery>) => {
      const filters = e.detail;
      setSearchInput(filters.q || '');
      setDebouncedSearch(filters.q || '');
      setTypeFilter((filters.type as FileType) || '');
      setSortField(filters.sort || 'updatedAt');
      setSortOrder(filters.order || 'desc');

      const params: Record<string, string> = {};
      if (filters.q) params.q = filters.q;
      if (filters.type) params.type = filters.type;
      if (filters.sort && filters.sort !== 'updatedAt') params.sort = filters.sort;
      if (filters.order && filters.order !== 'desc') params.order = filters.order;
      setSearchParamsRef.current(params, { replace: true });
    };
    window.addEventListener('applyFilters' as never, handler as never);
    return () => {
      window.removeEventListener('applyFilters' as never, handler as never);
    };
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (typeFilter) params.type = typeFilter;
    if (sortField !== 'updatedAt') params.sort = sortField;
    if (sortOrder !== 'desc') params.order = sortOrder;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, typeFilter, sortField, sortOrder, setSearchParams]);

  const query: ListFilesQuery = {
    q: debouncedSearch || undefined,
    type: typeFilter || undefined,
    sort: sortField,
    order: sortOrder,
  };

  const {
    data: filesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['files', folderId, userId, query],
    queryFn: () => api.files.list(folderId!, query),
    enabled: !!folderId && !!userId,
  });

  if (!folderId) {
    return (
      <div className="files-container">
        <h3>Files</h3>
        <p>Select a folder to view files.</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="files-container">
        <h3>Files</h3>
        <p>Please select a user first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="files-container">
        <h3>Files</h3>
        <p>Loading files...</p>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isForbidden = errorMessage.includes('403') || errorMessage.includes('Forbidden');
    const isNotFound = errorMessage.includes('404') || errorMessage.includes('Not Found');

    return (
      <div className="files-container">
        <div className="error-state">
          <div className="error-icon">
            {isForbidden ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : isNotFound ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v4"/>
                <path d="M11 16h.01"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>
          <h3 className="error-title">
            {isForbidden
              ? 'Access Denied'
              : isNotFound
              ? 'Folder Not Found'
              : 'Something Went Wrong'}
          </h3>
          <p className="error-message">
            {isForbidden
              ? "You don't have permission to view this folder. Please select a folder you have access to from the sidebar."
              : isNotFound
              ? "This folder doesn't exist or may have been deleted."
              : 'Unable to load files. Please try again.'}
          </p>
          <button onClick={() => refetch()} className="btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const files = filesResponse?.files || [];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="files-container">
      <h3>Files ({filesResponse?.total || 0})</h3>

      <div className="filters">
        <input
          type="text"
          placeholder="Search files... (Enter to search)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="search-input"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FileType | '')}
          className="type-filter"
        >
          <option value="">All Types</option>
          <option value="PDF">PDF</option>
          <option value="DOC">DOC</option>
          <option value="IMG">IMG</option>
          <option value="OTHER">OTHER</option>
        </select>

        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-') as [
              'name' | 'updatedAt',
              'asc' | 'desc'
            ];
            setSortField(field);
            setSortOrder(order);
          }}
          className="sort-select"
        >
          <option value="updatedAt-desc">Newest First</option>
          <option value="updatedAt-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>

        <button onClick={() => refetch()} className="refresh-btn">
          Refresh
        </button>

        <button onClick={() => setShowSaveModal(true)} className="save-view-btn">
          Save View
        </button>
      </div>

      {showSaveModal && (
        <SaveViewModal
          folderId={folderId}
          filters={query}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {files.length === 0 ? (
        <p>No files found in this folder.</p>
      ) : (
        <table className="files-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.name}</td>
                <td>
                  <span className={`file-type ${file.type.toLowerCase()}`}>
                    {file.type}
                  </span>
                </td>
                <td>{formatBytes(file.sizeBytes)}</td>
                <td>{formatDate(file.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useUser } from '../context/UserContext';
import { FileType, ListFilesQuery } from '@cloudfiles/contracts';

export function FilesTable() {
  const api = useApi();
  const { folderId } = useParams<{ folderId: string }>();
  const { userId } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FileType | ''>('');
  const [sortField, setSortField] = useState<'name' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const query: ListFilesQuery = {
    q: searchQuery || undefined,
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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="files-container">
        <h3>Files</h3>
        <p className="error">Error loading files: {errorMessage}</p>
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
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

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

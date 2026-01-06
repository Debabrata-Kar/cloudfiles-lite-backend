import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function SharedViewPage() {
  const { token } = useParams<{ token: string }>();
  const api = useApi();

  const {
    data: sharedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sharedView', token],
    queryFn: () => api.shared.getByToken(token!),
    enabled: !!token,
    retry: false,
  });

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

  if (isLoading) {
    return (
      <div className="shared-view-page">
        <div className="shared-view-loading">
          <div className="loading-spinner"></div>
          <p>Loading shared view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isExpired = errorMessage.includes('410') || errorMessage.includes('expired');
    const isNotFound = errorMessage.includes('404') || errorMessage.includes('not found');

    return (
      <div className="shared-view-page">
        <div className="shared-view-error">
          {isExpired ? (
            <>
              <div className="error-icon">⏰</div>
              <h2>Link Expired</h2>
              <p>This share link has expired and is no longer available.</p>
            </>
          ) : isNotFound ? (
            <>
              <div className="error-icon">🔗</div>
              <h2>Link Not Found</h2>
              <p>This share link doesn't exist or has been deleted.</p>
            </>
          ) : (
            <>
              <div className="error-icon">⚠️</div>
              <h2>Something went wrong</h2>
              <p>{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!sharedData) {
    return null;
  }

  const { view, files, sharedBy, expiresAt } = sharedData;

  return (
    <div className="shared-view-page">
      <header className="shared-view-header">
        <div className="shared-view-branding">
          <h1>CloudFiles Lite</h1>
          <span className="shared-badge">Shared View</span>
        </div>
      </header>

      <main className="shared-view-content">
        <div className="shared-view-info">
          <h2>{view.name}</h2>
          <div className="shared-meta">
            <span className="meta-item">
              <strong>Folder:</strong> {view.folderName}
            </span>
            <span className="meta-item">
              <strong>Shared by:</strong> {sharedBy}
            </span>
            {expiresAt && (
              <span className="meta-item expiry">
                <strong>Expires:</strong> {formatDate(expiresAt)}
              </span>
            )}
          </div>
          {view.filters && (
            <div className="shared-filters">
              {view.filters.q && <span className="filter-tag">Search: "{view.filters.q}"</span>}
              {view.filters.type && <span className="filter-tag">Type: {view.filters.type}</span>}
              {view.filters.sort && (
                <span className="filter-tag">
                  Sort: {view.filters.sort} ({view.filters.order || 'desc'})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="shared-files-container">
          <h3>Files ({files.total})</h3>
          {files.files.length === 0 ? (
            <p className="no-files">No files match the saved view filters.</p>
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
                {files.files.map((file) => (
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
      </main>

      <footer className="shared-view-footer">
        <p>Powered by CloudFiles Lite</p>
      </footer>
    </div>
  );
}

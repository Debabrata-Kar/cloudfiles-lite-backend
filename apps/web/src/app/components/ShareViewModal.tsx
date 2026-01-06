import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { SavedViewDto, ShareLinkDto } from '@cloudfiles/contracts';

interface ShareViewModalProps {
  view: SavedViewDto;
  onClose: () => void;
}

export function ShareViewModal({ view, onClose }: ShareViewModalProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [expiresInHours, setExpiresInHours] = useState<number | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: shareLinks,
    isLoading,
  } = useQuery({
    queryKey: ['shareLinks', view.id],
    queryFn: () => api.savedViews.listShareLinks(view.id),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.savedViews.createShareLink(
        view.id,
        expiresInHours ? { expiresInHours } : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks', view.id] });
      setExpiresInHours(null);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create share link');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: string) =>
      api.savedViews.deleteShareLink(view.id, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareLinks', view.id] });
    },
  });

  useEffect(() => {
    if (copiedLinkId) {
      const timer = setTimeout(() => setCopiedLinkId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedLinkId]);

  const getFrontendUrl = (link: ShareLinkDto): string => {
    const token = link.token;
    return `${window.location.origin}/shared/${token}`;
  };

  const handleCopyLink = async (link: ShareLinkDto) => {
    try {
      await navigator.clipboard.writeText(getFrontendUrl(link));
      setCopiedLinkId(link.id);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  };

  const formatExpiry = (expiresAt: string | null): string => {
    if (!expiresAt) return 'Never expires';
    const date = new Date(expiresAt);
    const now = new Date();
    if (date < now) return 'Expired';
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expires soon';
  };

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share "{view.name}"</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleCreateLink} className="share-form">
            <div className="form-row">
              <select
                value={expiresInHours ?? ''}
                onChange={(e) =>
                  setExpiresInHours(e.target.value ? Number(e.target.value) : null)
                }
                className="expiry-select"
              >
                <option value="">Never expires</option>
                <option value="1">1 hour</option>
                <option value="24">24 hours</option>
                <option value="168">7 days</option>
                <option value="720">30 days</option>
              </select>
              <button
                type="submit"
                className="btn-primary create-link-btn"
                disabled={createMutation.isPending}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {createMutation.isPending ? 'Creating...' : 'Create Link'}
              </button>
            </div>
            {error && <p className="modal-error">{error}</p>}
          </form>

          <div className="share-links-section">
            <h4>Active Links ({shareLinks?.length || 0})</h4>
            {isLoading ? (
              <p className="share-loading">Loading...</p>
            ) : !shareLinks || shareLinks.length === 0 ? (
              <div className="share-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <p>No share links yet</p>
                <span>Create one above to share this view</span>
              </div>
            ) : (
              <ul className="share-links-list">
                {shareLinks.map((link: ShareLinkDto) => (
                  <li
                    key={link.id}
                    className={`share-link-item ${isExpired(link.expiresAt) ? 'expired' : ''}`}
                  >
                    <div className="share-link-url">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      <a
                        href={getFrontendUrl(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-text"
                      >
                        {getFrontendUrl(link)}
                      </a>
                    </div>
                    <div className="share-link-meta">
                      <span className={`expiry-badge ${isExpired(link.expiresAt) ? 'expired' : ''}`}>
                        {formatExpiry(link.expiresAt)}
                      </span>
                      <div className="share-link-actions">
                        <button
                          type="button"
                          className={`icon-btn copy ${copiedLinkId === link.id ? 'copied' : ''}`}
                          onClick={() => handleCopyLink(link)}
                          disabled={isExpired(link.expiresAt)}
                          title="Copy link"
                        >
                          {copiedLinkId === link.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => deleteMutation.mutate(link.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete link"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

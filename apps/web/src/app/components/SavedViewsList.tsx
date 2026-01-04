import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useUser } from '../context/UserContext';
import { SavedViewDto, ListFilesQuery } from '@cloudfiles/contracts';

interface SavedViewsListProps {
  onApplyView: (folderId: string, filters: ListFilesQuery) => void;
}

export function SavedViewsList({ onApplyView }: SavedViewsListProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId } = useUser();

  const {
    data: savedViews,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['savedViews', userId],
    queryFn: () => api.savedViews.list(),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (viewId: string) => api.savedViews.delete(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedViews'] });
    },
  });

  const handleApplyView = (view: SavedViewDto) => {
    navigate(`/folders/${view.folderId}`);
    onApplyView(view.folderId, {
      q: view.filters.q,
      type: view.filters.type,
      tags: view.filters.tags,
      sort: view.filters.sort,
      order: view.filters.order,
    });
  };

  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved view?')) {
      deleteMutation.mutate(viewId);
    }
  };

  if (!userId) {
    return (
      <div className="saved-views-list">
        <h3>Saved Views</h3>
        <p className="empty-state">Select a user to see saved views.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="saved-views-list">
        <h3>Saved Views</h3>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saved-views-list">
        <h3>Saved Views</h3>
        <p className="error">Failed to load saved views</p>
      </div>
    );
  }

  if (!savedViews || savedViews.length === 0) {
    return (
      <div className="saved-views-list">
        <h3>Saved Views</h3>
        <div className="empty-state">
          <p>No saved views yet.</p>
          <p className="hint">Use "Save View" in a folder to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-views-list">
      <h3>Saved Views ({savedViews.length})</h3>
      <ul>
        {savedViews.map((view) => (
          <li key={view.id} className="saved-view-item">
            <button
              className="saved-view-btn"
              onClick={() => handleApplyView(view)}
              title={getFilterDescription(view)}
            >
              <span className="view-name">{view.name}</span>
              <span className="view-filters">{getFilterBadge(view)}</span>
            </button>
            <button
              className="delete-view-btn"
              onClick={(e) => handleDeleteView(e, view.id)}
              disabled={deleteMutation.isPending}
              title="Delete view"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getFilterBadge(view: SavedViewDto): string {
  const parts: string[] = [];
  if (view.filters.q) parts.push('search');
  if (view.filters.type) parts.push(view.filters.type.toLowerCase());
  if (view.filters.sort && view.filters.sort !== 'updatedAt') parts.push('sorted');
  return parts.length > 0 ? parts.join(', ') : 'all files';
}

function getFilterDescription(view: SavedViewDto): string {
  const parts: string[] = [];
  if (view.filters.q) parts.push(`Search: "${view.filters.q}"`);
  if (view.filters.type) parts.push(`Type: ${view.filters.type}`);
  if (view.filters.sort) parts.push(`Sort by ${view.filters.sort} (${view.filters.order || 'desc'})`);
  return parts.length > 0 ? parts.join('\n') : 'No filters';
}

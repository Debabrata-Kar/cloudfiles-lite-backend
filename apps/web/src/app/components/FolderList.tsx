import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useUser } from '../context/UserContext';
import { SavedViewDto, ListFilesQuery } from '@cloudfiles/contracts';

interface FolderListProps {
  onApplyView: (folderId: string, filters: ListFilesQuery) => void;
}

export function FolderList({ onApplyView }: FolderListProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useUser();

  // Extract folderId from URL path since FolderList is outside the Route
  const folderId = location.pathname.match(/\/folders\/([^/]+)/)?.[1];

  const {
    data: folders,
    isLoading: foldersLoading,
    error: foldersError,
  } = useQuery({
    queryKey: ['folders', userId],
    queryFn: () => api.folders.list(),
    enabled: !!userId,
  });

  const {
    data: savedViews,
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

  const isViewActive = (view: SavedViewDto): boolean => {
    if (view.folderId !== folderId) return false;
    const currentQ = searchParams.get('q') || '';
    const currentType = searchParams.get('type') || '';
    const currentSort = searchParams.get('sort') || 'updatedAt';
    const currentOrder = searchParams.get('order') || 'desc';
    return (
      (view.filters.q || '') === currentQ &&
      (view.filters.type || '') === currentType &&
      (view.filters.sort || 'updatedAt') === currentSort &&
      (view.filters.order || 'desc') === currentOrder
    );
  };

  const handleApplyView = (view: SavedViewDto) => {
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

  const getViewsForFolder = (id: string) => {
    return savedViews?.filter(v => v.folderId === id) || [];
  };

  const getFilterBadge = (view: SavedViewDto): string => {
    const parts: string[] = [];
    if (view.filters.q) parts.push('search');
    if (view.filters.type) parts.push(view.filters.type.toLowerCase());
    if (view.filters.sort && view.filters.sort !== 'updatedAt') parts.push('sorted');
    return parts.length > 0 ? parts.join(', ') : 'all files';
  };

  if (!userId) {
    return (
      <div className="folder-list">
        <h3>Folders</h3>
        <p>Please select a user first.</p>
      </div>
    );
  }

  if (foldersLoading) {
    return (
      <div className="folder-list">
        <h3>Folders</h3>
        <p>Loading folders...</p>
      </div>
    );
  }

  if (foldersError) {
    return (
      <div className="folder-list">
        <h3>Folders</h3>
        <p className="error">Error loading folders</p>
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="folder-list">
        <h3>Folders</h3>
        <p>No folders found for this user.</p>
      </div>
    );
  }

  return (
    <div className="folder-list">
      <h3>Folders</h3>
      <ul className="folder-tree">
        {folders.map((folder) => {
          const folderViews = getViewsForFolder(folder.id);
          const isActive = String(folder.id) === String(folderId);
          return (
            <li key={folder.id} className="folder-tree-item">
              <Link
                to={`/folders/${folder.id}`}
                className={`folder-link ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  const isSameFolder = String(folder.id) === String(folderId);
                  const hasFilters = searchParams.toString().length > 0;

                  if (isSameFolder && hasFilters) {
                    e.preventDefault();
                    setSearchParams({}, { replace: true });
                    window.dispatchEvent(
                      new CustomEvent('applyFilters', { detail: {} })
                    );
                  }
                }}
              >
                {folder.name}
              </Link>
              {folderViews.length > 0 && (
                <ul className="saved-views-tree">
                  {folderViews.map((view) => (
                    <li key={view.id} className="saved-view-tree-item">
                      <button
                        className={`saved-view-link ${isViewActive(view) ? 'active' : ''}`}
                        onClick={() => handleApplyView(view)}
                      >
                        <span className="view-name">{view.name}</span>
                        <span className="view-badge">{getFilterBadge(view)}</span>
                      </button>
                      <button
                        className="delete-view-btn-small"
                        onClick={(e) => handleDeleteView(e, view.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete view"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { ListFilesQuery } from '@cloudfiles/contracts';

interface SaveViewModalProps {
  folderId: string;
  filters: ListFilesQuery;
  onClose: () => void;
}

export function SaveViewModal({
  folderId,
  filters,
  onClose,
}: SaveViewModalProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      api.savedViews.create({
        folderId,
        name: name.trim(),
        filters: {
          q: filters.q,
          type: filters.type,
          tags: filters.tags,
          sort: filters.sort,
          order: filters.order,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedViews'] });
      onClose();
    },
    onError: (err: Error) => {
      if (err.message.includes('already exists')) {
        setError('A view with this name already exists');
      } else if (err.message.includes('403') || err.message.includes('access')) {
        setError('You do not have access to this folder');
      } else {
        setError('Failed to save view. Please try again.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a name for the view');
      return;
    }

    if (name.trim().length > 100) {
      setError('Name must be 100 characters or less');
      return;
    }

    createMutation.mutate();
  };

  const getFilterSummary = (): string => {
    const parts: string[] = [];
    if (filters.q) parts.push(`Search: "${filters.q}"`);
    if (filters.type) parts.push(`Type: ${filters.type}`);
    if (filters.sort) parts.push(`Sort: ${filters.sort} ${filters.order || 'desc'}`);
    return parts.length > 0 ? parts.join(', ') : 'No filters applied';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Save Current View</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="view-name">View Name</label>
              <input
                id="view-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., PDF files sorted by name"
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="filter-preview">
              <label>Filters to save:</label>
              <p className="filter-summary">{getFilterSummary()}</p>
            </div>

            {error && <p className="modal-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save View'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

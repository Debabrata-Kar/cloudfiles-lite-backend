import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useUser } from '../context/UserContext';

export function FolderList() {
  const api = useApi();
  const { folderId } = useParams<{ folderId: string }>();
  const { userId } = useUser();

  const {
    data: folders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['folders', userId],
    queryFn: () => api.folders.list(),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="folder-list">
        <h3>Folders</h3>
        <p>Please select a user first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="folder-list">
        <h3>Folders</h3>
        <p>Loading folders...</p>
      </div>
    );
  }

  if (error) {
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
      <ul>
        {folders.map((folder) => (
          <li
            key={folder.id}
            className={folder.id === folderId ? 'active' : ''}
          >
            <Link to={`/folders/${folder.id}`}>{folder.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

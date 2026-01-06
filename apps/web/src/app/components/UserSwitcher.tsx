import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useEffect } from 'react';
import { useUser } from '../context/UserContext';

export function UserSwitcher() {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId, setUserId } = useUser();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
  });

  useEffect(() => {
    // Set first user as default if none selected
    if (users && users.length > 0 && !userId) {
      const firstUser = users[0];
      setUserId(firstUser.id);
    }
  }, [users, userId, setUserId]);

  const handleUserChange = async (newUserId: string) => {
    setUserId(newUserId);
    // Invalidate all queries to refetch with new user
    queryClient.invalidateQueries();

    // Fetch the new user's folders and navigate to the first one
    try {
      const folders = await api.folders.list(newUserId);
      if (folders && folders.length > 0) {
        navigate(`/folders/${folders[0].id}`);
      } else {
        navigate('/folders');
      }
    } catch {
      // If folders fetch fails, just navigate to the folders page
      navigate('/folders');
    }
  };

  if (isLoading) {
    return <div className="user-switcher">Loading users...</div>;
  }

  if (error) {
    return <div className="user-switcher error">Error loading users</div>;
  }

  const currentUser = users?.find((u) => u.id === userId);

  return (
    <div className="user-switcher">
      <label htmlFor="user-select">Current User: </label>
      <select
        id="user-select"
        value={userId || ''}
        onChange={(e) => handleUserChange(e.target.value)}
      >
        {users?.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
      {currentUser && (
        <span className="user-info"> - Logged in as {currentUser.name}</span>
      )}
    </div>
  );
}

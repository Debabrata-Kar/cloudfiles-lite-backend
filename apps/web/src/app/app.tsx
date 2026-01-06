import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { UserSwitcher } from './components/UserSwitcher';
import { FolderList } from './components/FolderList';
import { FilesTable } from './components/FilesTable';
import { SharedViewPage } from './components/SharedViewPage';
import { ListFilesQuery } from '@cloudfiles/contracts';
import './app.css';

export function App() {
  const navigate = useNavigate();

  const handleApplyView = useCallback(
    (folderId: string, filters: ListFilesQuery) => {
      navigate(`/folders/${folderId}`);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('applyFilters', { detail: filters })
        );
      }, 50);
    },
    [navigate]
  );

  return (
    <Routes>
      <Route path="/shared/:token" element={<SharedViewPage />} />
      <Route
        path="*"
        element={
          <div className="app">
            <header className="app-header">
              <h1>CloudFiles Lite</h1>
              <UserSwitcher />
            </header>

            <div className="app-content">
              <aside className="sidebar">
                <FolderList onApplyView={handleApplyView} />
              </aside>

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/folders" replace />} />
                  <Route
                    path="/folders"
                    element={
                      <div className="welcome">
                        <h2>Welcome to CloudFiles Lite</h2>
                        <p>Select a folder from the sidebar to view files.</p>
                      </div>
                    }
                  />
                  <Route path="/folders/:folderId" element={<FilesTable />} />
                </Routes>
              </main>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;

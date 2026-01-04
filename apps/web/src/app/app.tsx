import { Routes, Route, Navigate } from 'react-router-dom';
import { UserSwitcher } from './components/UserSwitcher';
import { FolderList } from './components/FolderList';
import { FilesTable } from './components/FilesTable';
import './app.css';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CloudFiles Lite</h1>
        <UserSwitcher />
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <FolderList />
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
  );
}

export default App;

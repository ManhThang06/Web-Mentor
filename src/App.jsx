import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import './admin.css';

const SESSION_KEY = 'icon_session';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  });

  const handleLogin = (userData) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  // Route by auth state
  if (user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user?.role === 'user') {
    return <UserDashboard user={user} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

export default App;

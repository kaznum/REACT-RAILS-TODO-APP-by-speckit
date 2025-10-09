import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import TodoList from '../todos/TodoList';
import { MESSAGES } from '../../constants/messages';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{MESSAGES.dashboard.title}</h1>
        <div className="user-info">
          <span>{MESSAGES.auth.welcome}、{user?.name || 'ユーザー'}さん！</span>
          <Button variant="secondary" size="small" onClick={logout}>
            {MESSAGES.auth.signOut}
          </Button>
        </div>
      </header>

      <main className="dashboard-content">
        <TodoList />
      </main>
    </div>
  );
};

export default Dashboard;

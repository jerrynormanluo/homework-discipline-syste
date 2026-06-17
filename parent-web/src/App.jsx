import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HomeworkManagement from './pages/HomeworkManagement';
import StudentOverview from './pages/StudentOverview';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  return authService.isLoggedIn() ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/homework"
        element={
          <PrivateRoute>
            <HomeworkManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/:id"
        element={
          <PrivateRoute>
            <StudentOverview />
          </PrivateRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <PrivateRoute>
            <Statistics />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;

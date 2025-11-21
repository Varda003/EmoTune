import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './components/Auth/RegisterPage';
import LoginPage from './components/Auth/LoginPage';
import MainApp from './components/EmotionDetection/MainApp';
import ProfilePage from './components/Profile/ProfilePage';
import MusicGames from "./pages/MusicGames";
import LandingPage from './components/LandingPage/LandingPage';
import { isAuthenticated } from './services/api';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/app" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page - Always accessible */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Routes - Redirect to /app if logged in */}
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* Protected Routes - Require authentication */}
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/games" 
          element={
            <ProtectedRoute>
              <MusicGames />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
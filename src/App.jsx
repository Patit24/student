import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Homepage from './pages/Homepage';
import AboutPage from './pages/AboutPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Pricing from './pages/Pricing';
import TutorDashboard from './pages/TutorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TutorDiscovery from './pages/TutorDiscovery';
import TutorProfile from './pages/TutorProfile';
import './index.css';

function AppRoutes() {
  const { currentUser, loading } = useAppContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / Universal Routes */}
      <Route path="/"       element={<Homepage />} />
      <Route path="/about"  element={<AboutPage />} />
      <Route path="/search" element={<TutorDiscovery />} />
      <Route path="/tutor/:id" element={<TutorProfile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Removed Resume Builder */}

      {!currentUser ? (
        <>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </>
      ) : currentUser.role === 'super_admin' ? (
        <>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-panel" element={<AdminDashboard />} />
        </>
      ) : currentUser.role === 'tutor' ? (
        <>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/tutor"   element={<TutorDashboard />} />
        </>
      ) : (
        <Route path="/student" element={<StudentDashboard />} />
      )}

      {/* Redirect Logic */}
      <Route path="*" element={<Navigate to={
        !currentUser ? "/" : 
        currentUser.role === 'super_admin' ? "/admin-panel" : 
        currentUser.role === 'tutor' ? (currentUser.subscription_status === 'active' ? "/tutor" : "/pricing") :
        "/student"
      } />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <Navbar />
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;

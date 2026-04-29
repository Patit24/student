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
import ResumeBuilder from './pages/ResumeBuilder';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import CourseDetail from './pages/CourseDetail';
import Courses from './pages/Courses';
import NeetAspirant from './pages/NeetAspirant';
import JeeAspirant from './pages/JeeAspirant';
import Footer from './components/Footer';
import { AlertTriangle, Lock } from 'lucide-react';
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
      <Route path="/resume-builder" element={<ResumeBuilder />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/blog/:blogId" element={<BlogDetail />} />
      <Route path="/course/:courseId" element={<CourseDetail />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/neet" element={<NeetAspirant />} />
      <Route path="/jee" element={<JeeAspirant />} />

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
        <>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/join/:roomId" element={<StudentDashboard />} />
        </>
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

function GlobalFeeBanner() {
  const { currentUser } = useAppContext();
  
  // Only show for students
  if (!currentUser || currentUser.role !== 'student') return null;

  // Simple enrollment check (in a real app, this would be more robust)
  const isOverdue = currentUser.payment_status?.toLowerCase() === 'overdue';
  const isRestricted = currentUser.payment_status?.toLowerCase() === 'restricted';

  if (!isOverdue && !isRestricted) return null;

  const bg = isRestricted ? '#EF4444' : '#F5C518';
  const text = isRestricted ? '#fff' : '#000';
  const label = isRestricted ? 'ACCESS RESTRICTED' : 'PAYMENT OVERDUE';
  const msg = isRestricted 
    ? 'Your access is locked. Please clear your dues immediately.' 
    : 'Your monthly fees are overdue. Pay now to avoid restriction on the 5th.';

  return (
    <div style={{ 
      background: bg, color: text, padding: '0.75rem 1rem', 
      textAlign: 'center', fontSize: '0.9rem', fontWeight: 800,
      position: 'sticky', top: 0, zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    }}>
      {isRestricted ? <Lock size={16} /> : <AlertTriangle size={16} />}
      <span>{label}: {msg}</span>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <GlobalFeeBanner />
          <Navbar />
          <AppRoutes />
          <Footer />
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;

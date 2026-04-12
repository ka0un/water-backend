import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicReportSubmit from './pages/PublicReportSubmit';
import PublicMap from './pages/PublicMap';
import PublicReportTracker from './pages/PublicReportTracker';
import Dashboard from './pages/Dashboard';
import LabStaffDashboard from './pages/LabStaffDashboard';
import LabTestManagement from './pages/LabTestManagement';
import ModeratorWaterTests from './pages/ModeratorWaterTests';
import ModerationLogs from './pages/ModerationLogs';
import LaboratoryManagement from './pages/LaboratoryManagement';
import WaterInventory from './pages/WaterInventory';
import WaterResourceApproval from './pages/WaterResourceApproval';
import UserWaterInventory from './pages/UserWaterInventory';
import UserReportsHub from './pages/UserReportsHub';

// Component that renders different dashboard based on user role
function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === 'USER') {
    return <Navigate to="/app/user/reports" replace />;
  }
  
  if (user?.role === 'LAB_STAFF') {
    return <LabStaffDashboard />;
  }
  
  return <Dashboard />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public — Authentication & Registration */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Public — Report Submission */}
            <Route path="/report" element={<PublicReportSubmit />} />
            
            {/* Public — Map & Tracker */}
            <Route path="/map" element={<PublicMap />} />
            <Route path="/track" element={<PublicReportTracker />} />

            {/* Protected — Dashboard */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleDashboard />} />
              <Route path="moderator/water-tests" element={<ModeratorWaterTests />} />
              <Route path="moderation/logs" element={<ModerationLogs />} />
              <Route path="laboratory" element={<LaboratoryManagement />} />
              <Route path="water-inventory" element={<WaterInventory />} />
              <Route path="water-resource-approval" element={<WaterResourceApproval />} />
              <Route path="lab-tests" element={<LabTestManagement />} />

              {/* User dashboard routes */}
              <Route path="user/reports" element={<UserReportsHub />} />
              <Route path="user/reports/submit" element={<PublicReportSubmit />} />
              <Route path="user/reports/track" element={<PublicReportTracker />} />
              <Route path="user/water-sources" element={<UserWaterInventory />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

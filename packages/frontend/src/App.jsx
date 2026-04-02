import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import LabStaffDashboard from './pages/LabStaffDashboard';
import LabTestManagement from './pages/LabTestManagement';
import ModeratorWaterTests from './pages/ModeratorWaterTests';
import ModerationLogs from './pages/ModerationLogs';
import LaboratoryManagement from './pages/LaboratoryManagement';
import WaterInventory from './pages/WaterInventory';
import WaterResourceApproval from './pages/WaterResourceApproval';
import UserWaterInventory from './pages/UserWaterInventory';
import LandingPage from './pages/LandingPage';
import UsersManagement from './pages/UsersManagement';
import PublicMap from './pages/PublicMap';
import PublicReportSubmit from './pages/PublicReportSubmit';
import PublicReportTracker from './pages/PublicReportTracker';

// Component that renders different dashboard based on user role
function RoleDashboard() {
  const { user } = useAuth();
  
  if (user?.role === 'LAB_STAFF') {
    return <LabStaffDashboard />;
  }

  if (user?.role === 'USER') {
    return <UserWaterInventory />;
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
            {/* Public — Login */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/map" element={<PublicMap />} />
            <Route path="/report" element={<PublicReportSubmit />} />
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
              <Route path="water-inventory-user" element={<UserWaterInventory />} />
              <Route path="water-resource-approval" element={<WaterResourceApproval />} />
              <Route path="lab-tests" element={<LabTestManagement />} />
              <Route path="users" element={<UsersManagement />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

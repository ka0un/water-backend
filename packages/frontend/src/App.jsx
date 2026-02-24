import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ModeratorWaterTests from './pages/ModeratorWaterTests';
import ModerationLogs from './pages/ModerationLogs';
import LaboratoryManagement from './pages/LaboratoryManagement';
import WaterInventory from './pages/WaterInventory';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="moderator/water-tests" element={<ModeratorWaterTests />} />
              <Route path="moderation/logs" element={<ModerationLogs />} />
              <Route path="laboratory" element={<LaboratoryManagement />} />
              <Route path="water-inventory" element={<WaterInventory />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ModeratorWaterTests from './pages/ModeratorWaterTests';
import ModerationLogs from './pages/ModerationLogs';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="moderator/water-tests" element={<ModeratorWaterTests />} />
            <Route path="moderation/logs" element={<ModerationLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

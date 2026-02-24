import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WizardPage from './pages/WizardPage';
import ThankYouPage from './pages/ThankYouPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/report" element={<WizardPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

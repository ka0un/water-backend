import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * Wraps routes that require authentication.
 * Redirects to /login if no valid token is present.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress size={48} />
            </Box>
        );
    }

    if (!isAuthenticated) {
        // Save the attempted URL so we can redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

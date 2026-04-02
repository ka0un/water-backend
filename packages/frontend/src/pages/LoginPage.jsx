import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, TextField, Button, Typography, Alert, InputAdornment, IconButton,
} from '@mui/material';
import {
    Visibility, VisibilityOff, WaterDrop as WaterDropIcon, LockOutlined,
} from '@mui/icons-material';

export default function LoginPage() {
    const { login, loading, error, setError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const registrationMessage = location.state?.message;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const from = location.state?.from?.pathname || '/app';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }
        const success = await login(email.trim(), password);
        if (success) {
            navigate(from, { replace: true });
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#F5F7FA',
            px: 2,
        }}>
            <Card sx={{ width: '100%', maxWidth: 420, p: 4 }}>
                {/* Logo area */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 56, height: 56, borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        mb: 2,
                    }}>
                        <WaterDropIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A2027' }}>
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Water Quality Monitoring System
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {registrationMessage && !error && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        {registrationMessage}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoFocus
                        sx={{ mb: 2.5 }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 3 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={loading}
                        startIcon={<LockOutlined />}
                        sx={{ py: 1.5, fontSize: '1rem' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'text.disabled' }}>
                    Only moderators, admins, and lab staff can access this dashboard.
                </Typography>

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 1.5, color: 'text.secondary' }}>
                    Need an account?{' '}
                    <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate('/register', { state: { from: location.state?.from } })}
                        sx={{ minWidth: 0, p: 0, textTransform: 'none', verticalAlign: 'baseline' }}
                    >
                        Register here
                    </Button>
                </Typography>
            </Card>
        </Box>
    );
}

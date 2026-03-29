import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    Link,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import {
    AppRegistration,
    Visibility,
    VisibilityOff,
    WaterDrop as WaterDropIcon,
} from '@mui/icons-material';
import { api } from '../context/AuthContext';

const ROLE_OPTIONS = [
    { value: 'USER', label: 'User' },
    { value: 'LAB_STAFF', label: 'Lab Staff' },
    { value: 'MODERATOR', label: 'Moderator' },
    { value: 'ADMIN', label: 'Admin' },
];

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = location.state?.from?.pathname || '/login';

    const passwordRuleText = useMemo(
        () => 'At least 8 characters with uppercase, lowercase, and number',
        []
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Password and confirm password do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
                role,
            });

            navigate('/login', {
                replace: true,
                state: {
                    from: { pathname: from },
                    registered: true,
                    message: 'Registration successful. Please sign in.',
                },
            });
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
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
            <Card sx={{ width: '100%', maxWidth: 520, p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                    }}>
                        <WaterDropIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A2027' }}>
                        Create Account
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Register for Water Quality Monitoring System
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        autoFocus
                        sx={{ mb: 2.5 }}
                    />

                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2.5 }}
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        helperText={passwordRuleText}
                        sx={{ mb: 2.5 }}
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

                    <TextField
                        fullWidth
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        sx={{ mb: 2.5 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="role-label">Role</InputLabel>
                        <Select
                            labelId="role-label"
                            value={role}
                            label="Role"
                            onChange={(e) => setRole(e.target.value)}
                            disabled={loading}
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={loading}
                        startIcon={<AppRegistration />}
                        sx={{ py: 1.5, fontSize: '1rem' }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                </form>

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
                    Already have an account?{' '}
                    <Link
                        component="button"
                        type="button"
                        onClick={() => navigate('/login')}
                        underline="hover"
                    >
                        Sign in
                    </Link>
                </Typography>
            </Card>
        </Box>
    );
}
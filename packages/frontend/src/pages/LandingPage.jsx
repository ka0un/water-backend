import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Button, Container, Typography, Grid, Paper, AppBar, Toolbar, Stack, Chip
} from '@mui/material';
import {
    WaterDrop, Shield, Science, BarChart, ArrowForward, Login
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* Fix Leaflet default marker icon */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PREVIEW_MARKERS = [
    { id: 1, position: [6.9271, 79.8612], name: 'Colombo Well', type: 'Well' },
    { id: 2, position: [7.2906, 80.6337], name: 'Kandy River Tap', type: 'River Tap' },
    { id: 3, position: [8.3114, 80.4037], name: 'Anuradhapura Spring', type: 'Spring' },
    { id: 4, position: [6.0535, 80.2210], name: 'Galle Reservoir', type: 'Reservoir' },
];

const features = [
    {
        icon: <WaterDrop sx={{ fontSize: 40, color: '#1565C0' }} />,
        title: 'Community Reporting',
        description: 'Easily submit water quality reports from your local wells, rivers, and taps.'
    },
    {
        icon: <Science sx={{ fontSize: 40, color: '#0097A7' }} />,
        title: 'Laboratory Testing',
        description: 'Professional lab testing capabilities for verification and comprehensive water analysis.'
    },
    {
        icon: <Shield sx={{ fontSize: 40, color: '#2E7D32' }} />,
        title: 'Trusted Moderation',
        description: 'All public reports are vetted by our moderators to ensure accuracy and reliability.'
    },
    {
        icon: <BarChart sx={{ fontSize: 40, color: '#7B1FA2' }} />,
        title: 'Interactive Dashboards',
        description: 'Explore live data maps, turbidity levels, and water appearance trends in real-time.'
    }
];

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/app');
        } else {
            navigate('/report');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5F7FA' }}>
            {/* Navigation Bar */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', pt: 2, px: { xs: 2, md: 6 } }}>
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <WaterDrop sx={{ color: '#fff' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A2027' }}>
                            AquaMonitor
                        </Typography>
                    </Box>
                    <Box>
                        {isAuthenticated ? (
                            <Button variant="contained" color="primary" onClick={() => navigate('/app')} sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}>
                                Go to Dashboard
                            </Button>
                        ) : (
                            <Stack direction="row" spacing={2}>
                                <Button variant="text" color="inherit" onClick={() => navigate('/login')} sx={{ color: '#1A2027', fontWeight: 600, textTransform: 'none' }}>
                                    Sign In
                                </Button>
                                <Button variant="contained" color="primary" startIcon={<Login />} onClick={() => navigate('/register')} sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}>
                                    Register
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 10 }, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Grid container spacing={6} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Box sx={{ pr: { md: 4 } }}>
                            <Chip label="Public Beta Platform" sx={{ mb: 3, bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 700 }} />
                            <Typography variant="h2" sx={{ fontWeight: 800, color: '#1A2027', mb: 3, lineHeight: 1.1, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                                Safeguard Your <br />
                                <span style={{ color: '#1565C0' }}>Water Quality</span>
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 5, fontWeight: 400, lineHeight: 1.6 }}>
                                Join our community-driven platform to report, monitor, and analyze water quality across the country. Reliable data for a healthier tomorrow.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button variant="contained" size="large" onClick={handleGetStarted} endIcon={<ArrowForward />} sx={{ py: 1.5, px: 4, borderRadius: 2, fontSize: '1.1rem', fontWeight: 600, textTransform: 'none', boxShadow: '0 8px 16px rgba(21, 101, 192, 0.24)' }}>
                                    {isAuthenticated ? 'Enter Dashboard' : 'Submit a Report'}
                                </Button>
                                {!isAuthenticated && (
                                    <>
                                        <Button variant="outlined" size="large" onClick={() => navigate('/map')} sx={{ py: 1.5, px: 4, borderRadius: 2, fontSize: '1.1rem', fontWeight: 600, textTransform: 'none', borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
                                            Explore Map
                                        </Button>
                                        <Button variant="text" size="large" onClick={() => navigate('/track')} sx={{ py: 1.5, px: 2, fontSize: '1rem', fontWeight: 600, textTransform: 'none' }}>
                                            Track Status
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {/* Hero Map Preview */}
                        <Box sx={{
                            position: 'relative',
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: '0 32px 64px rgba(21,101,192,0.18)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            bgcolor: '#fff',
                            p: '12px',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
                        }}>
                            {/* Window chrome bar */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1, mb: '10px',
                                px: 0.5,
                            }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5F56' }} />
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFBD2E' }} />
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27C93F' }} />
                                <Typography variant="caption" sx={{ ml: 1, color: '#90A4AE', fontWeight: 600, fontSize: '0.7rem' }}>
                                    AquaMonitor — Live Water Map
                                </Typography>
                            </Box>

                            {/* Leaflet Map — explicit px height so Leaflet can resolve it */}
                            <Box sx={{ flexGrow: 1, width: '100%', borderRadius: 2, overflow: 'hidden', height: 360 }}>
                                <MapContainer
                                    center={[7.8731, 80.7718]}
                                    zoom={7}
                                    zoomControl={false}
                                    attributionControl={false}
                                    scrollWheelZoom={false}
                                    dragging={false}
                                    doubleClickZoom={false}
                                    style={{ width: '100%', height: '360px' }}
                                >
                                    <TileLayer
                                        attribution='&copy; OpenStreetMap'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {PREVIEW_MARKERS.map((m) => (
                                        <Marker key={m.id} position={m.position}>
                                            <Popup>
                                                <strong>{m.name}</strong><br />{m.type}
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </Box>



                            {/* Live indicator badge */}
                            <Box sx={{
                                position: 'absolute', top: 52, right: 20,
                                display: 'flex', alignItems: 'center', gap: 0.8,
                                bgcolor: 'rgba(255,255,255,0.92)',
                                backdropFilter: 'blur(6px)',
                                border: '1px solid #E0E0E0',
                                borderRadius: 99, px: 1.5, py: 0.5,
                                zIndex: 1000,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}>
                                <Box sx={{
                                    width: 8, height: 8, borderRadius: '50%', bgcolor: '#2E7D32',
                                    animation: 'pulse 2s infinite',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 1 },
                                        '50%': { opacity: 0.3 },
                                        '100%': { opacity: 1 },
                                    }
                                }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#2E7D32' }}>
                                    LIVE
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Features Section */}
            <Box sx={{ bgcolor: '#fff', py: { xs: 8, md: 10 }, borderTop: '1px solid #E0E0E0' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 600, mx: 'auto' }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#1A2027', mb: 2 }}>
                            Platform Features
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                            Everything you need to stay informed and take action on local water quality issues.
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {features.map((f, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 4, border: '1px solid #F0F0F0', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.05)', borderColor: 'primary.light' } }}>
                                    <Box sx={{ mb: 2 }}>{f.icon}</Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1A2027' }}>{f.title}</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{f.description}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA & Footer */}
            <Box sx={{ bgcolor: '#1A2027', color: '#fff', py: 8 }}>
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 3 }}>
                        Ready to make an impact?
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, maxWidth: 500, mx: 'auto' }}>
                        Join thousands of community members and institutions building a comprehensive water quality dataset.
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => navigate('/register')} sx={{ bgcolor: '#fff', color: '#1A2027', '&:hover': { bgcolor: '#F0F0F0' }, py: 1.5, px: 5, borderRadius: 2, fontSize: '1.1rem', fontWeight: 700, textTransform: 'none' }}>
                        Create an Account
                    </Button>
                </Container>
            </Box>
        </Box>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Box, Paper, Typography, AppBar, Toolbar, Button, Stack, Card, CardContent,
    Chip, Divider, IconButton, Alert, Tooltip, CircularProgress
} from '@mui/material';
import {
    WaterDrop, ArrowBack, VerifiedUser as VerifiedIcon,
    HourglassEmpty as PendingIcon, Public as PublicIcon
} from '@mui/icons-material';
import { api } from '../context/AuthContext';
import { getWaterSources, getWaterSourceStats } from '../services/waterSourceService';

/* ── Fix Leaflet default icon issue ──────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (color) =>
    new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

const ICONS = { verified: createIcon('green') };
const SRI_LANKA_CENTER = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;
const STATUS_COLORS = { Functional: '#2E7D32', Broken: '#D32F2F', Maintenance: '#ED6C02', Abandoned: '#757575' };

export default function PublicMap() {
    const navigate = useNavigate();
    const [sources, setSources] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Only fetch verified sources for public map
            const [sourcesData, statsData] = await Promise.all([
                getWaterSources(api, { verified: 'true', limit: 100 }),
                getWaterSourceStats(api)
            ]);
            setSources(sourcesData.sources || []);
            setStats(statsData);
        } catch (err) {
            setError('Failed to load map data. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getCoords = (source) => {
        const lat = source.location?.coordinates?.[1];
        const lng = source.location?.coordinates?.[0];
        return lat && lng ? [lat, lng] : null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F5F7FA' }}>
            {/* Navigation Bar */}
            <AppBar position="static" elevation={1} sx={{ bgcolor: '#fff', color: '#1A2027' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton edge="start" onClick={() => navigate('/')} aria-label="back">
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PublicIcon sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Public Water Resources Map
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/report')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                            Submit Report
                        </Button>
                        <Button variant="contained" onClick={() => navigate('/login')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                            Sign In
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Dashboard Stats */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, overflowX: 'auto' }}>
                {stats ? (
                    <>
                        <Card elevation={0} sx={{ minWidth: 200, borderRadius: 2, border: '1px solid #E0E0E0' }}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Verified Sources</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2E7D32' }}>{stats.verified || 0}</Typography>
                            </CardContent>
                        </Card>
                        <Card elevation={0} sx={{ minWidth: 200, borderRadius: 2, border: '1px solid #E0E0E0' }}>
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Submissions</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1565C0' }}>{stats.total || 0}</Typography>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <CircularProgress size={24} sx={{ m: 2 }} />
                )}
            </Box>

            {error && (
                <Box sx={{ px: 2 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                </Box>
            )}

            {/* Map Container */}
            <Box sx={{ flexGrow: 1, p: 2, pt: 0 }}>
                <Paper elevation={0} sx={{ width: '100%', height: '100%', borderRadius: 3, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
                    <MapContainer center={SRI_LANKA_CENTER} zoom={DEFAULT_ZOOM} style={{ width: '100%', height: '100%' }}>
                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {sources.map((source) => {
                            const coords = getCoords(source);
                            if (!coords) return null;
                            return (
                                <Marker key={source._id} position={coords} icon={ICONS.verified}>
                                    <Popup maxWidth={300}>
                                        <Box sx={{ minWidth: 180 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{source.name}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                                <Chip label={source.type} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                                                <Chip label={source.operational_status || 'Functional'} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: STATUS_COLORS[source.operational_status] + '20', color: STATUS_COLORS[source.operational_status], fontWeight: 600 }} />
                                            </Box>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Access: {source.access_type || 'Public'}</Typography>
                                            {source.description && (
                                                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>{source.description}</Typography>
                                            )}
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </Paper>
            </Box>
        </Box>
    );
}

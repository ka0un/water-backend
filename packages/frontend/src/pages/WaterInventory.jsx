import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Box, Paper, Typography, Button, IconButton, Fab, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, Slider,
    Snackbar, Tooltip, FormControl, InputLabel, Select, Tabs, Tab,
    CircularProgress, Divider, Card, CardContent, Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    MyLocation as MyLocationIcon,
    Close as CloseIcon,
    WaterDrop as WaterDropIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as PendingIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    VerifiedUser as VerifiedIcon,
    LocationOn as LocationIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import {
    getWaterSources,
    createWaterSource,
    verifyWaterSource,
    deleteWaterSource,
    getWaterSourceStats,
    getNearbySources as fetchNearbySources,
} from '../services/waterSourceService';

/* ── Fix Leaflet default icon issue ──────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ── Custom marker icons ─────────────────────────────────────── */
const createIcon = (color) =>
    new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

const ICONS = {
    verified: createIcon('green'),
    pending: createIcon('orange'),
    selected: createIcon('red'),
    user: createIcon('blue'),
};

/* ── Constants ───────────────────────────────────────────────── */
const SRI_LANKA_CENTER = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;

const WATER_SOURCE_TYPES = ['Well', 'Public Tap', 'River', 'Lake', 'Bowser Point'];
const ACCESS_TYPES = ['Public', 'Private', 'Restricted'];
const OPERATIONAL_STATUSES = ['Functional', 'Broken', 'Maintenance', 'Abandoned'];

const STATUS_COLORS = {
    Functional: '#2E7D32',
    Broken: '#D32F2F',
    Maintenance: '#ED6C02',
    Abandoned: '#757575',
};

const paper = {
    p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider',
};

/* ── Map click handler component ─────────────────────────────── */
function MapClickHandler({ onMapClick, active }) {
    useMapEvents({
        click: (e) => {
            if (active) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

/* ── Fly to location component ───────────────────────────────── */
function FlyToLocation({ position, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, zoom || 14, { duration: 1 });
        }
    }, [position, zoom, map]);
    return null;
}

/* ══════════════════════════════════════════════════════════════ */
export default function WaterInventory() {
    const { api, user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

    /* ── State ────────────────────────────────────────────────── */
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flyTo, setFlyTo] = useState(null);
    const [flyZoom, setFlyZoom] = useState(null);

    // Tab: 0 = Verified (All), 1 = Pending (admin only), 2 = My Submissions
    const [tab, setTab] = useState(0);

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '', type: 'Well', access_type: 'Public',
        operational_status: 'Functional',
        description: '', latitude: null, longitude: null,
    });
    const [addLoading, setAddLoading] = useState(false);
    const [pickingLocation, setPickingLocation] = useState(false);

    // Filters
    const [filters, setFilters] = useState({ type: '', operational_status: '' });

    // Nearby
    const [nearbyRadius, setNearbyRadius] = useState(5000);
    const [nearbyMode, setNearbyMode] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Stats
    const [stats, setStats] = useState(null);

    // Detail dialog
    const [detailSource, setDetailSource] = useState(null);

    /* ── Fetch sources ───────────────────────────────────────── */
    const loadSources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { ...filters, limit: 100 };

            if (tab === 0) {
                // Show only verified sources
                params.verified = 'true';
            } else if (tab === 1 && isAdmin) {
                // Pending - unverified (admin only)
                params.verified = 'false';
            }
            // tab === 2 (or tab === 1 for non-admin): My Submissions

            const result = await getWaterSources(api, params);
            let srcList = result.sources || [];

            // Filter "My Submissions" client-side
            const myTab = isAdmin ? 2 : 1;
            if (tab === myTab) {
                srcList = srcList.filter(s => s.created_by?._id === user?._id || s.created_by === user?._id);
            }

            setSources(srcList);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load water sources');
        } finally {
            setLoading(false);
        }
    }, [api, filters, tab, user, isAdmin]);

    const loadStats = useCallback(async () => {
        try {
            const data = await getWaterSourceStats(api);
            setStats(data);
        } catch { /* silent */ }
    }, [api]);

    useEffect(() => {
        loadSources();
        loadStats();
    }, [loadSources, loadStats]);

    /* ── Nearby ──────────────────────────────────────────────── */
    const handleNearbySearch = useCallback(async (lat, lng) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchNearbySources(api, lat, lng, nearbyRadius, filters);
            setSources(data.sources || []);
            setSnackbar({
                open: true, severity: 'info',
                message: `Found ${data.count} source(s) within ${nearbyRadius / 1000}km`,
            });
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to search nearby');
        } finally {
            setLoading(false);
        }
    }, [api, nearbyRadius, filters]);

    /* ── Get user location ───────────────────────────────────── */
    const getUserLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setSnackbar({ open: true, severity: 'error', message: 'Geolocation not supported' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(loc);
                setFlyTo(loc);
                setFlyZoom(14);
                if (nearbyMode) {
                    handleNearbySearch(loc[0], loc[1]);
                }
            },
            () => setSnackbar({ open: true, severity: 'error', message: 'Location access denied' }),
            { enableHighAccuracy: true }
        );
    }, [nearbyMode, handleNearbySearch]);

    /* ── Map click for location picking ──────────────────────── */
    const handleMapClick = useCallback((lat, lng) => {
        if (pickingLocation) {
            setAddForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            setPickingLocation(false);
        }
    }, [pickingLocation]);

    /* ── Create source ───────────────────────────────────────── */
    const handleCreateSource = async () => {
        if (!addForm.name || !addForm.latitude || !addForm.longitude) {
            setSnackbar({ open: true, severity: 'warning', message: 'Please fill name and pick location on map' });
            return;
        }
        setAddLoading(true);
        try {
            await createWaterSource(api, {
                name: addForm.name,
                type: addForm.type,
                location: { latitude: addForm.latitude, longitude: addForm.longitude },
                access_type: addForm.access_type,
                operational_status: addForm.operational_status,
                description: addForm.description,
            });
            setSnackbar({ open: true, severity: 'success', message: 'Water source submitted! It will be visible after admin approval.' });
            setAddOpen(false);
            setAddForm({ name: '', type: 'Well', access_type: 'Public', operational_status: 'Functional', description: '', latitude: null, longitude: null });
            loadSources();
            loadStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to create' });
        } finally {
            setAddLoading(false);
        }
    };

    /* ── Verify source (Admin) ───────────────────────────────── */
    const handleVerify = async (sourceId) => {
        try {
            await verifyWaterSource(api, sourceId);
            setSnackbar({ open: true, severity: 'success', message: 'Water source approved and now visible to all!' });
            setDetailSource(null);
            loadSources();
            loadStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to verify' });
        }
    };

    /* ── Delete source ───────────────────────────────────────── */
    const handleDelete = async (sourceId) => {
        try {
            await deleteWaterSource(api, sourceId);
            setSnackbar({ open: true, severity: 'success', message: 'Water source deleted' });
            setDetailSource(null);
            loadSources();
            loadStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to delete' });
        }
    };

    /* ── Nearby controls ─────────────────────────────────────── */
    const handleFindNearby = () => {
        if (userLocation) {
            setNearbyMode(true);
            handleNearbySearch(userLocation[0], userLocation[1]);
        } else {
            getUserLocation();
            setNearbyMode(true);
        }
    };

    const handleShowAll = () => {
        setNearbyMode(false);
        loadSources();
    };

    /* ── Helper: extract coordinates ─────────────────────────── */
    const getCoords = (source) => {
        const lat = source.location?.coordinates?.[1];
        const lng = source.location?.coordinates?.[0];
        return lat && lng ? [lat, lng] : null;
    };

    /* ── Pending count for badge ─────────────────────────────── */
    const pendingCount = stats ? (stats.total - stats.verified) : 0;

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', height: 'calc(100vh - 100px)' }}>

            {/* ─── Header & Stats ─────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <WaterDropIcon sx={{ fontSize: 32, color: '#1565C0' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>
                    Water Inventory
                </Typography>

                {stats && (
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Chip icon={<VerifiedIcon />} label={`${stats.verified || 0} Approved`}
                            size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
                        <Chip icon={<PendingIcon />} label={`${stats.unverified || 0} Pending`}
                            size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600 }} />
                        <Chip label={`${stats.total || 0} Total`}
                            size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
                    </Box>
                )}
            </Box>

            {/* ─── Tabs ───────────────────────────────────────── */}
            <Paper elevation={0} sx={{ ...paper, p: 0 }}>
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setNearbyMode(false); }}
                    sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}>
                    <Tab icon={<VisibilityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Approved Sources" />
                    {isAdmin && (
                        <Tab icon={
                            <Badge badgeContent={pendingCount} color="warning" max={99}>
                                <PendingIcon sx={{ fontSize: 18 }} />
                            </Badge>
                        } iconPosition="start" label="Pending Approval" />
                    )}
                    <Tab icon={<WaterDropIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="My Submissions" />
                </Tabs>
            </Paper>

            {/* ─── Controls Bar ───────────────────────────────── */}
            <Paper elevation={0} sx={{ ...paper, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.5, px: 2 }}>
                {/* Nearby Search */}
                <Tooltip title="Find sources near your location">
                    <Button variant={nearbyMode ? 'contained' : 'outlined'} size="small"
                        startIcon={<MyLocationIcon />} onClick={handleFindNearby}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Near Me
                    </Button>
                </Tooltip>

                {nearbyMode && (
                    <>
                        <Box sx={{ width: 160, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                {nearbyRadius / 1000}km
                            </Typography>
                            <Slider size="small" value={nearbyRadius} min={500} max={50000} step={500}
                                onChange={(_, v) => setNearbyRadius(v)}
                                onChangeCommitted={() => {
                                    if (userLocation) handleNearbySearch(userLocation[0], userLocation[1]);
                                }}
                                sx={{ flex: 1 }} />
                        </Box>
                        <Button size="small" onClick={handleShowAll} sx={{ textTransform: 'none' }}>
                            Show All
                        </Button>
                    </>
                )}

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select value={filters.type} label="Type"
                        onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {WATER_SOURCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.operational_status} label="Status"
                        onChange={(e) => setFilters((p) => ({ ...p, operational_status: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {OPERATIONAL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </FormControl>

                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={() => {
                        if (nearbyMode && userLocation) handleNearbySearch(userLocation[0], userLocation[1]);
                        else loadSources();
                    }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>

                <Box sx={{ flexGrow: 1 }} />

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {loading ? 'Loading...' : `${sources.length} source${sources.length !== 1 ? 's' : ''}`}
                </Typography>
            </Paper>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ─── Map ────────────────────────────────────────── */}
            <Paper elevation={0} sx={{
                ...paper, flex: 1, minHeight: 400, position: 'relative', overflow: 'hidden', p: 0,
                border: pickingLocation ? '2px solid #1565C0' : '1px solid',
                borderColor: pickingLocation ? '#1565C0' : 'divider',
            }}>
                {pickingLocation && (
                    <Alert severity="info" sx={{
                        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 1000, borderRadius: 2, boxShadow: 2,
                    }}>
                        Click on the map to pick a location for the new water source
                    </Alert>
                )}

                <MapContainer
                    center={SRI_LANKA_CENTER}
                    zoom={DEFAULT_ZOOM}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler onMapClick={handleMapClick} active={pickingLocation} />
                    {flyTo && <FlyToLocation position={flyTo} zoom={flyZoom} />}

                    {/* Water source markers */}
                    {sources.map((source) => {
                        const coords = getCoords(source);
                        if (!coords) return null;

                        const icon = source.verified ? ICONS.verified : ICONS.pending;
                        return (
                            <Marker key={source._id} position={coords} icon={icon}>
                                <Popup maxWidth={300}>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.9rem' }}>
                                            {source.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                            <Chip label={source.type} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                                            <Chip
                                                label={source.operational_status || 'Functional'}
                                                size="small"
                                                sx={{
                                                    height: 22, fontSize: '0.7rem',
                                                    bgcolor: STATUS_COLORS[source.operational_status] + '20',
                                                    color: STATUS_COLORS[source.operational_status],
                                                    fontWeight: 600,
                                                }}
                                            />
                                            <Chip label={source.access_type || 'Public'} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                                        </Box>

                                        {/* Verification badge */}
                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, p: 0.75,
                                            borderRadius: 1, bgcolor: source.verified ? '#E8F5E9' : '#FFF3E0',
                                        }}>
                                            {source.verified
                                                ? <VerifiedIcon sx={{ fontSize: 16, color: '#2E7D32' }} />
                                                : <PendingIcon sx={{ fontSize: 16, color: '#E65100' }} />
                                            }
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: source.verified ? '#2E7D32' : '#E65100' }}>
                                                {source.verified ? 'Approved' : 'Pending Approval'}
                                            </Typography>
                                        </Box>

                                        {source.description && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                                {source.description.substring(0, 120)}{source.description.length > 120 ? '…' : ''}
                                            </Typography>
                                        )}

                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                            Added by: {source.created_by?.name || 'Unknown'}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                            <Button size="small" variant="outlined" sx={{ textTransform: 'none', fontSize: '0.7rem', flex: 1 }}
                                                onClick={() => setDetailSource(source)}>
                                                Details
                                            </Button>
                                            {isAdmin && !source.verified && (
                                                <Button size="small" variant="contained" color="success"
                                                    sx={{ textTransform: 'none', fontSize: '0.7rem', flex: 1 }}
                                                    onClick={() => handleVerify(source._id)}>
                                                    Approve
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* User location marker */}
                    {userLocation && (
                        <Marker position={userLocation} icon={ICONS.user}>
                            <Popup>Your Location</Popup>
                        </Marker>
                    )}

                    {/* Picked location for add form */}
                    {addForm.latitude && addForm.longitude && (
                        <Marker position={[addForm.latitude, addForm.longitude]} icon={ICONS.selected}>
                            <Popup>New Resource Location</Popup>
                        </Marker>
                    )}
                </MapContainer>

                {/* FAB — Add Source */}
                <Fab color="primary" size="medium"
                    sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 1000 }}
                    onClick={() => { setAddOpen(true); setPickingLocation(true); }}>
                    <AddIcon />
                </Fab>

                {/* FAB — My Location */}
                <Fab size="small" sx={{
                    position: 'absolute', bottom: 80, right: 28, zIndex: 1000,
                    bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' },
                }}
                    onClick={getUserLocation}>
                    <MyLocationIcon sx={{ color: '#4285F4' }} />
                </Fab>
            </Paper>

            {/* ─── Legend ──────────────────────────────────────── */}
            <Paper elevation={0} sx={{ ...paper, display: 'flex', alignItems: 'center', gap: 3, py: 1, px: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Legend:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2E7D32' }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>Approved</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#E65100' }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>Pending</Typography>
                </Box>
                {Object.entries(STATUS_COLORS).map(([label, color]) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: color, border: `2px solid ${color}` }} />
                        <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>{label}</Typography>
                    </Box>
                ))}
            </Paper>

            {/* ─── Add Water Source Dialog ─────────────────────── */}
            <Dialog open={addOpen} onClose={() => { setAddOpen(false); setPickingLocation(false); }}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="primary" />
                    Add Water Resource
                    <IconButton sx={{ ml: 'auto' }} onClick={() => { setAddOpen(false); setPickingLocation(false); }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        Your submission will be reviewed and approved by an admin before it becomes visible to all users.
                    </Alert>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Name" fullWidth required value={addForm.name}
                            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Community Well #4" />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField select label="Type" value={addForm.type}
                                onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value }))}>
                                {WATER_SOURCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                            <TextField select label="Access Type" value={addForm.access_type}
                                onChange={(e) => setAddForm((p) => ({ ...p, access_type: e.target.value }))}>
                                {ACCESS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                        </Box>

                        <TextField select label="Operational Status" value={addForm.operational_status}
                            onChange={(e) => setAddForm((p) => ({ ...p, operational_status: e.target.value }))}>
                            {OPERATIONAL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>

                        <TextField label="Description" fullWidth multiline rows={3} value={addForm.description}
                            onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Describe the water source (optional)..." />

                        {/* Location picker feedback */}
                        <Paper elevation={0} sx={{
                            p: 2, borderRadius: 2,
                            bgcolor: addForm.latitude ? '#E8F5E9' : '#FFF3E0',
                            border: '1px dashed',
                            borderColor: addForm.latitude ? '#4CAF50' : '#FF9800',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <LocationIcon sx={{ color: addForm.latitude ? '#4CAF50' : '#FF9800' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Location {addForm.latitude ? '(Selected)' : '(Required)'}
                                </Typography>
                            </Box>
                            {addForm.latitude ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                        Lat: {addForm.latitude.toFixed(6)}, Lng: {addForm.longitude.toFixed(6)}
                                    </Typography>
                                    <Button size="small" sx={{ textTransform: 'none', ml: 'auto' }}
                                        onClick={() => setPickingLocation(true)}>
                                        Re-pick
                                    </Button>
                                </Box>
                            ) : (
                                <>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                        Click on the map to tag the location. You can drag this dialog aside to access the map.
                                    </Typography>
                                    <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}
                                        onClick={() => setPickingLocation(true)}>
                                        Pick Location on Map
                                    </Button>
                                </>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setAddOpen(false); setPickingLocation(false); }} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCreateSource} disabled={addLoading || !addForm.name || !addForm.latitude}
                        startIcon={addLoading ? <CircularProgress size={16} /> : <AddIcon />}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {addLoading ? 'Submitting...' : 'Submit Resource'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Detail Dialog ──────────────────────────────── */}
            <Dialog open={!!detailSource} onClose={() => setDetailSource(null)}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {detailSource && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WaterDropIcon color="primary" />
                            {detailSource.name}
                            <IconButton sx={{ ml: 'auto' }} onClick={() => setDetailSource(null)}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Status Banner */}
                                <Paper elevation={0} sx={{
                                    p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                                    bgcolor: detailSource.verified ? '#E8F5E9' : '#FFF3E0',
                                }}>
                                    {detailSource.verified
                                        ? <VerifiedIcon sx={{ fontSize: 28, color: '#2E7D32' }} />
                                        : <PendingIcon sx={{ fontSize: 28, color: '#E65100' }} />
                                    }
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: detailSource.verified ? '#2E7D32' : '#E65100' }}>
                                            {detailSource.verified ? 'Approved' : 'Pending Approval'}
                                        </Typography>
                                        {detailSource.verified && detailSource.verified_by && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Verified by {detailSource.verified_by.name || 'Admin'} on{' '}
                                                {new Date(detailSource.verified_at).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>

                                {/* Details */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Type</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{detailSource.type}</Typography>
                                    </CardContent></Card>
                                    <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Access</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{detailSource.access_type || 'Public'}</Typography>
                                    </CardContent></Card>
                                    <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Status</Typography>
                                        <Chip label={detailSource.operational_status || 'Functional'} size="small"
                                            sx={{
                                                mt: 0.5,
                                                bgcolor: STATUS_COLORS[detailSource.operational_status] + '20',
                                                color: STATUS_COLORS[detailSource.operational_status],
                                                fontWeight: 600,
                                            }} />
                                    </CardContent></Card>
                                    <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Location</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {detailSource.location?.coordinates?.[1]?.toFixed(4)},{' '}
                                            {detailSource.location?.coordinates?.[0]?.toFixed(4)}
                                        </Typography>
                                    </CardContent></Card>
                                </Box>

                                {detailSource.description && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Description</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{detailSource.description}</Typography>
                                    </Box>
                                )}

                                <Divider />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Submitted by: {detailSource.created_by?.name || 'Unknown'}
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Date: {new Date(detailSource.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                            {isAdmin && (
                                <Button color="error" startIcon={<DeleteIcon />}
                                    sx={{ textTransform: 'none' }}
                                    onClick={() => handleDelete(detailSource._id)}>
                                    Delete
                                </Button>
                            )}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button onClick={() => setDetailSource(null)} sx={{ textTransform: 'none' }}>
                                    Close
                                </Button>
                                {isAdmin && !detailSource.verified && (
                                    <Button variant="contained" color="success"
                                        startIcon={<CheckCircleIcon />}
                                        sx={{ textTransform: 'none', borderRadius: 2 }}
                                        onClick={() => handleVerify(detailSource._id)}>
                                        Approve Resource
                                    </Button>
                                )}
                            </Box>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ─── Snackbar ───────────────────────────────────── */}
            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}
                    onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Box, Paper, Typography, Button, IconButton, Fab, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, Slider,
    Snackbar, Tooltip, FormControl, InputLabel, Select, Tabs, Tab,
    CircularProgress, Divider, Card, CardContent, Badge, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination,
    InputAdornment, Skeleton, Switch, FormControlLabel,
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
    Edit as EditIcon,
    Map as MapIcon,
    TableChart as TableIcon,
    Search as SearchIcon,
    Warning as WarningIcon,
    Build as BuildIcon,
    Public as PublicIcon,
} from '@mui/icons-material';
import {
    getWaterSources,
    createWaterSource,
    updateWaterSource,
    updateSourceStatus,
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
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

const ICONS = { verified: createIcon('green'), pending: createIcon('orange'), selected: createIcon('red'), user: createIcon('blue') };

/* ── Constants ───────────────────────────────────────────────── */
const SRI_LANKA_CENTER = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;
const WATER_SOURCE_TYPES = ['Well', 'Public Tap', 'River', 'Lake', 'Bowser Point'];
const ACCESS_TYPES = ['Public', 'Private', 'Restricted'];
const OPERATIONAL_STATUSES = ['Functional', 'Broken', 'Maintenance', 'Abandoned'];
const STATUS_COLORS = { Functional: '#2E7D32', Broken: '#D32F2F', Maintenance: '#ED6C02', Abandoned: '#757575' };
const STATUS_ICONS = { Functional: <CheckCircleIcon />, Broken: <WarningIcon />, Maintenance: <BuildIcon />, Abandoned: <CloseIcon /> };
const paper = { p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' };

/* ── Map sub-components ──────────────────────────────────────── */
function MapClickHandler({ onMapClick, active }) {
    useMapEvents({ click: (e) => { if (active) onMapClick(e.latlng.lat, e.latlng.lng); } });
    return null;
}
function FlyToLocation({ position, zoom }) {
    const map = useMap();
    useEffect(() => { if (position) map.flyTo(position, zoom || 14, { duration: 1 }); }, [position, zoom, map]);
    return null;
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bgcolor }) {
    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: '1 1 140px', minWidth: 140 }}>
            <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1, color }}>{value}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
                </Box>
            </CardContent>
        </Card>
    );
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
    const [viewMode, setViewMode] = useState('map'); // 'map' | 'table'
    const [tab, setTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', type: 'Well', access_type: 'Public', operational_status: 'Functional', description: '', latitude: null, longitude: null });
    const [addLoading, setAddLoading] = useState(false);
    const [pickingLocation, setPickingLocation] = useState(false);

    // Edit dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    // Status update dialog
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusForm, setStatusForm] = useState({ id: null, operational_status: '', notes: '' });
    const [statusLoading, setStatusLoading] = useState(false);

    // Detail dialog
    const [detailSource, setDetailSource] = useState(null);

    // Confirm dialog
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, color: 'primary' });

    // Filters & nearby
    const [filters, setFilters] = useState({ type: '', operational_status: '' });
    const [nearbyRadius, setNearbyRadius] = useState(5000);
    const [nearbyMode, setNearbyMode] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // Snackbar & Stats
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [stats, setStats] = useState(null);

    // Table pagination
    const [tablePage, setTablePage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    /* ── Fetch sources ───────────────────────────────────────── */
    const loadSources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { ...filters, limit: 100 };
            if (tab === 0) params.verified = 'true';
            else if (tab === 1 && isAdmin) params.verified = 'false';

            const result = await getWaterSources(api, params);
            let srcList = result.sources || [];

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
        try { const data = await getWaterSourceStats(api); setStats(data); } catch { /* silent */ }
    }, [api]);

    useEffect(() => { loadSources(); loadStats(); }, [loadSources, loadStats]);

    /* ── Nearby ──────────────────────────────────────────────── */
    const handleNearbySearch = useCallback(async (lat, lng) => {
        setLoading(true); setError(null);
        try {
            const data = await fetchNearbySources(api, lat, lng, nearbyRadius, filters);
            setSources(data.sources || []);
            setSnackbar({ open: true, severity: 'info', message: `Found ${data.count} source(s) within ${nearbyRadius / 1000}km` });
        } catch (e) { setError(e.response?.data?.message || 'Failed to search nearby'); }
        finally { setLoading(false); }
    }, [api, nearbyRadius, filters]);

    const getUserLocation = useCallback(() => {
        if (!navigator.geolocation) { setSnackbar({ open: true, severity: 'error', message: 'Geolocation not supported' }); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(loc); setFlyTo(loc); setFlyZoom(14);
                if (nearbyMode) handleNearbySearch(loc[0], loc[1]);
            },
            () => setSnackbar({ open: true, severity: 'error', message: 'Location access denied' }),
            { enableHighAccuracy: true }
        );
    }, [nearbyMode, handleNearbySearch]);

    const handleMapClick = useCallback((lat, lng) => {
        if (pickingLocation) { setAddForm((p) => ({ ...p, latitude: lat, longitude: lng })); setPickingLocation(false); }
    }, [pickingLocation]);

    /* ── Create source ───────────────────────────────────────── */
    const handleCreateSource = async () => {
        if (!addForm.name || !addForm.latitude || !addForm.longitude) {
            setSnackbar({ open: true, severity: 'warning', message: 'Please fill name and pick location on map' }); return;
        }
        setAddLoading(true);
        try {
            await createWaterSource(api, {
                name: addForm.name, type: addForm.type,
                location: { latitude: addForm.latitude, longitude: addForm.longitude },
                access_type: addForm.access_type, operational_status: addForm.operational_status, description: addForm.description,
            });
            setSnackbar({ open: true, severity: 'success', message: 'Water source submitted! It will be visible after admin approval.' });
            setAddOpen(false);
            setAddForm({ name: '', type: 'Well', access_type: 'Public', operational_status: 'Functional', description: '', latitude: null, longitude: null });
            loadSources(); loadStats();
        } catch (e) { setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to create' }); }
        finally { setAddLoading(false); }
    };

    /* ── Edit source ─────────────────────────────────────────── */
    const openEditDialog = (source) => {
        setEditForm({ _id: source._id, name: source.name, type: source.type, access_type: source.access_type || 'Public', operational_status: source.operational_status || 'Functional', description: source.description || '' });
        setEditOpen(true);
    };
    const handleEditSave = async () => {
        setEditLoading(true);
        try {
            await updateWaterSource(api, editForm._id, { name: editForm.name, type: editForm.type, access_type: editForm.access_type, operational_status: editForm.operational_status, description: editForm.description });
            setSnackbar({ open: true, severity: 'success', message: 'Water source updated successfully!' });
            setEditOpen(false); setDetailSource(null); loadSources(); loadStats();
        } catch (e) { setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to update' }); }
        finally { setEditLoading(false); }
    };

    /* ── Status update ───────────────────────────────────────── */
    const openStatusDialog = (source) => {
        setStatusForm({ id: source._id, operational_status: source.operational_status || 'Functional', notes: '' });
        setStatusOpen(true);
    };
    const handleStatusSave = async () => {
        setStatusLoading(true);
        try {
            await updateSourceStatus(api, statusForm.id, statusForm.operational_status, statusForm.notes);
            setSnackbar({ open: true, severity: 'success', message: `Status updated to "${statusForm.operational_status}"` });
            setStatusOpen(false); setDetailSource(null); loadSources(); loadStats();
        } catch (e) { setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to update status' }); }
        finally { setStatusLoading(false); }
    };

    /* ── Verify source (Admin) ───────────────────────────────── */
    const handleVerify = (sourceId) => {
        setConfirmDialog({
            open: true, title: 'Approve Water Source', color: 'success',
            message: 'Are you sure you want to approve this water source? It will become visible to all users.',
            onConfirm: async () => {
                try {
                    await verifyWaterSource(api, sourceId);
                    setSnackbar({ open: true, severity: 'success', message: 'Water source approved!' });
                    setDetailSource(null); loadSources(); loadStats();
                } catch (e) { setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to verify' }); }
                setConfirmDialog(p => ({ ...p, open: false }));
            },
        });
    };

    /* ── Delete source ───────────────────────────────────────── */
    const handleDelete = (sourceId) => {
        setConfirmDialog({
            open: true, title: 'Delete Water Source', color: 'error',
            message: 'Are you sure you want to delete this water source? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await deleteWaterSource(api, sourceId);
                    setSnackbar({ open: true, severity: 'success', message: 'Water source deleted' });
                    setDetailSource(null); loadSources(); loadStats();
                } catch (e) { setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to delete' }); }
                setConfirmDialog(p => ({ ...p, open: false }));
            },
        });
    };

    /* ── Nearby controls ─────────────────────────────────────── */
    const handleFindNearby = () => {
        if (userLocation) { setNearbyMode(true); handleNearbySearch(userLocation[0], userLocation[1]); }
        else { getUserLocation(); setNearbyMode(true); }
    };
    const handleShowAll = () => { setNearbyMode(false); loadSources(); };

    /* ── Helpers ──────────────────────────────────────────────── */
    const getCoords = (source) => {
        const lat = source.location?.coordinates?.[1];
        const lng = source.location?.coordinates?.[0];
        return lat && lng ? [lat, lng] : null;
    };
    const pendingCount = stats ? (stats.total - stats.verified) : 0;

    // Filter by search query for table
    const filteredSources = sources.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q) || s.created_by?.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    });

    /* ════════════════════════════════════════════════════════════ */
    /* ── RENDER ──────────────────────────────────────────────── */
    /* ════════════════════════════════════════════════════════════ */
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', height: 'calc(100vh - 100px)' }}>

            {/* ─── Header ─────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <WaterDropIcon sx={{ fontSize: 32, color: '#1565C0' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, flexGrow: 1 }}>Water Inventory</Typography>
                <Tooltip title={viewMode === 'map' ? 'Switch to Table View' : 'Switch to Map View'}>
                    <FormControlLabel
                        control={<Switch checked={viewMode === 'table'} onChange={() => setViewMode(v => v === 'map' ? 'table' : 'map')} color="primary" />}
                        label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {viewMode === 'map' ? <MapIcon sx={{ fontSize: 18 }} /> : <TableIcon sx={{ fontSize: 18 }} />}
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{viewMode === 'map' ? 'Map' : 'Table'}</Typography>
                        </Box>}
                    />
                </Tooltip>
            </Box>

            {/* ─── Stats Cards ────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {stats ? (<>
                    <StatCard icon={<WaterDropIcon />} label="Total Sources" value={stats.total || 0} color="#1565C0" bgcolor="#E3F2FD" />
                    <StatCard icon={<VerifiedIcon />} label="Approved" value={stats.verified || 0} color="#2E7D32" bgcolor="#E8F5E9" />
                    <StatCard icon={<PendingIcon />} label="Pending" value={stats.unverified || 0} color="#E65100" bgcolor="#FFF3E0" />
                    <StatCard icon={<PublicIcon />} label="Types" value={stats.byType ? Object.keys(stats.byType).length : 0} color="#6A1B9A" bgcolor="#F3E5F5" />
                </>) : Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: '1 1 140px', minWidth: 140 }}>
                        <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                            <Skeleton variant="rounded" width={42} height={42} sx={{ mb: 1 }} />
                            <Skeleton width={60} height={32} /><Skeleton width={80} height={14} />
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* ─── Tabs ───────────────────────────────────────── */}
            <Paper elevation={0} sx={{ ...paper, p: 0 }}>
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setNearbyMode(false); setTablePage(0); }}
                    sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}>
                    <Tab icon={<VisibilityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Approved Sources" />
                    {isAdmin && (
                        <Tab icon={<Badge badgeContent={pendingCount} color="warning" max={99}><PendingIcon sx={{ fontSize: 18 }} /></Badge>} iconPosition="start" label="Pending Approval" />
                    )}
                    <Tab icon={<WaterDropIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="My Submissions" />
                </Tabs>
            </Paper>

            {/* ─── Controls Bar ───────────────────────────────── */}
            <Paper elevation={0} sx={{ ...paper, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.5, px: 2 }}>
                {viewMode === 'table' && (
                    <TextField size="small" placeholder="Search sources…" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setTablePage(0); }}
                        sx={{ minWidth: 200 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }} />
                )}
                {viewMode === 'map' && (<>
                    <Tooltip title="Find sources near your location">
                        <Button variant={nearbyMode ? 'contained' : 'outlined'} size="small" startIcon={<MyLocationIcon />} onClick={handleFindNearby} sx={{ textTransform: 'none', borderRadius: 2 }}>Near Me</Button>
                    </Tooltip>
                    {nearbyMode && (<>
                        <Box sx={{ width: 160, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{nearbyRadius / 1000}km</Typography>
                            <Slider size="small" value={nearbyRadius} min={500} max={50000} step={500}
                                onChange={(_, v) => setNearbyRadius(v)}
                                onChangeCommitted={() => { if (userLocation) handleNearbySearch(userLocation[0], userLocation[1]); }}
                                sx={{ flex: 1 }} />
                        </Box>
                        <Button size="small" onClick={handleShowAll} sx={{ textTransform: 'none' }}>Show All</Button>
                    </>)}
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                </>)}

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select value={filters.type} label="Type" onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {WATER_SOURCE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.operational_status} label="Status" onChange={(e) => setFilters(p => ({ ...p, operational_status: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {OPERATIONAL_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </FormControl>

                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={() => { if (nearbyMode && userLocation) handleNearbySearch(userLocation[0], userLocation[1]); else loadSources(); loadStats(); }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {loading ? 'Loading...' : `${filteredSources.length} source${filteredSources.length !== 1 ? 's' : ''}`}
                </Typography>
            </Paper>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ─── MAP VIEW ─────────────────────────────────── */}
            {viewMode === 'map' && (
                <Paper elevation={0} sx={{ ...paper, flex: 1, minHeight: 400, position: 'relative', overflow: 'hidden', p: 0, border: pickingLocation ? '2px solid #1565C0' : '1px solid', borderColor: pickingLocation ? '#1565C0' : 'divider' }}>
                    {pickingLocation && (
                        <Alert severity="info" sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, borderRadius: 2, boxShadow: 2 }}>
                            Click on the map to pick a location for the new water source
                        </Alert>
                    )}
                    <MapContainer center={SRI_LANKA_CENTER} zoom={DEFAULT_ZOOM} style={{ width: '100%', height: '100%' }} zoomControl={true}>
                        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapClickHandler onMapClick={handleMapClick} active={pickingLocation} />
                        {flyTo && <FlyToLocation position={flyTo} zoom={flyZoom} />}
                        {sources.map((source) => {
                            const coords = getCoords(source);
                            if (!coords) return null;
                            return (
                                <Marker key={source._id} position={coords} icon={source.verified ? ICONS.verified : ICONS.pending}>
                                    <Popup maxWidth={300}>
                                        <Box sx={{ minWidth: 200 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.9rem' }}>{source.name}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                                <Chip label={source.type} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                                                <Chip label={source.operational_status || 'Functional'} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: STATUS_COLORS[source.operational_status] + '20', color: STATUS_COLORS[source.operational_status], fontWeight: 600 }} />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, p: 0.75, borderRadius: 1, bgcolor: source.verified ? '#E8F5E9' : '#FFF3E0' }}>
                                                {source.verified ? <VerifiedIcon sx={{ fontSize: 16, color: '#2E7D32' }} /> : <PendingIcon sx={{ fontSize: 16, color: '#E65100' }} />}
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: source.verified ? '#2E7D32' : '#E65100' }}>{source.verified ? 'Approved' : 'Pending'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                                <Button size="small" variant="outlined" sx={{ textTransform: 'none', fontSize: '0.7rem', flex: 1 }} onClick={() => setDetailSource(source)}>Details</Button>
                                                {isAdmin && !source.verified && (
                                                    <Button size="small" variant="contained" color="success" sx={{ textTransform: 'none', fontSize: '0.7rem', flex: 1 }} onClick={() => handleVerify(source._id)}>Approve</Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}
                        {userLocation && <Marker position={userLocation} icon={ICONS.user}><Popup>Your Location</Popup></Marker>}
                        {addForm.latitude && addForm.longitude && <Marker position={[addForm.latitude, addForm.longitude]} icon={ICONS.selected}><Popup>New Resource Location</Popup></Marker>}
                    </MapContainer>
                    <Fab color="primary" size="medium" sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 1000 }} onClick={() => { setAddOpen(true); setPickingLocation(true); }}><AddIcon /></Fab>
                    <Fab size="small" sx={{ position: 'absolute', bottom: 80, right: 28, zIndex: 1000, bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={getUserLocation}><MyLocationIcon sx={{ color: '#4285F4' }} /></Fab>
                </Paper>
            )}

            {/* ─── TABLE VIEW ────────────────────────────────── */}
            {viewMode === 'table' && (
                loading ? (
                    <Paper elevation={0} sx={{ ...paper }}>
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />)}
                    </Paper>
                ) : filteredSources.length === 0 ? (
                    <Paper elevation={0} sx={{ ...paper, p: 6, textAlign: 'center' }}>
                        <WaterDropIcon sx={{ fontSize: 56, color: '#B0BEC5', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>No sources found</Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', flex: 1 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Access</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Verified</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Submitted By</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: '#F5F5F5' }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSources.slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage).map(source => (
                                    <TableRow key={source._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <WaterDropIcon sx={{ fontSize: 18, color: '#1565C0' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{source.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Chip label={source.type} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} /></TableCell>
                                        <TableCell>
                                            <Chip label={source.operational_status || 'Functional'} size="small" sx={{ height: 24, fontSize: '0.75rem', bgcolor: STATUS_COLORS[source.operational_status] + '20', color: STATUS_COLORS[source.operational_status], fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{source.access_type || 'Public'}</Typography></TableCell>
                                        <TableCell>{source.verified ? <VerifiedIcon sx={{ fontSize: 20, color: '#2E7D32' }} /> : <PendingIcon sx={{ fontSize: 20, color: '#E65100' }} />}</TableCell>
                                        <TableCell><Typography variant="body2">{source.created_by?.name || 'Unknown'}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" sx={{ color: 'text.secondary' }}>{new Date(source.createdAt).toLocaleDateString()}</Typography></TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="View Details"><IconButton size="small" color="primary" onClick={() => setDetailSource(source)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(source)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                {isAdmin && !source.verified && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleVerify(source._id)}><CheckCircleIcon fontSize="small" /></IconButton></Tooltip>}
                                                {isAdmin && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(source._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination component="div" count={filteredSources.length} page={tablePage} onPageChange={(_, p) => setTablePage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setTablePage(0); }} rowsPerPageOptions={[5, 10, 25]} />
                    </TableContainer>
                )
            )}

            {/* ─── Legend (Map mode only) ───────────────────────── */}
            {viewMode === 'map' && (
                <Paper elevation={0} sx={{ ...paper, display: 'flex', alignItems: 'center', gap: 3, py: 1, px: 2, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Legend:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2E7D32' }} /><Typography variant="caption" sx={{ fontWeight: 500 }}>Approved</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#E65100' }} /><Typography variant="caption" sx={{ fontWeight: 500 }}>Pending</Typography></Box>
                    {Object.entries(STATUS_COLORS).map(([label, color]) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: color }} /><Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>{label}</Typography></Box>
                    ))}
                </Paper>
            )}

            {/* ═══════════════ DIALOGS ═══════════════════════════ */}

            {/* ─── Add Water Source Dialog ─────────────────────── */}
            <Dialog open={addOpen} onClose={() => { setAddOpen(false); setPickingLocation(false); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="primary" /> Add Water Resource
                    <IconButton sx={{ ml: 'auto' }} onClick={() => { setAddOpen(false); setPickingLocation(false); }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Your submission will be reviewed by an admin before it becomes visible.</Alert>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Name" fullWidth required value={addForm.name} onChange={(e) => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Community Well #4" />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField select label="Type" value={addForm.type} onChange={(e) => setAddForm(p => ({ ...p, type: e.target.value }))}>{WATER_SOURCE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
                            <TextField select label="Access Type" value={addForm.access_type} onChange={(e) => setAddForm(p => ({ ...p, access_type: e.target.value }))}>{ACCESS_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
                        </Box>
                        <TextField select label="Operational Status" value={addForm.operational_status} onChange={(e) => setAddForm(p => ({ ...p, operational_status: e.target.value }))}>{OPERATIONAL_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                        <TextField label="Description" fullWidth multiline rows={3} value={addForm.description} onChange={(e) => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the water source (optional)..." />
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: addForm.latitude ? '#E8F5E9' : '#FFF3E0', border: '1px dashed', borderColor: addForm.latitude ? '#4CAF50' : '#FF9800' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <LocationIcon sx={{ color: addForm.latitude ? '#4CAF50' : '#FF9800' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Location {addForm.latitude ? '(Selected)' : '(Required)'}</Typography>
                            </Box>
                            {addForm.latitude ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Lat: {addForm.latitude.toFixed(6)}, Lng: {addForm.longitude.toFixed(6)}</Typography>
                                    <Button size="small" sx={{ textTransform: 'none', ml: 'auto' }} onClick={() => setPickingLocation(true)}>Re-pick</Button>
                                </Box>
                            ) : (
                                <>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Click on the map to tag the location.</Typography>
                                    <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setPickingLocation(true)}>Pick Location on Map</Button>
                                </>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setAddOpen(false); setPickingLocation(false); }} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateSource} disabled={addLoading || !addForm.name || !addForm.latitude}
                        startIcon={addLoading ? <CircularProgress size={16} /> : <AddIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {addLoading ? 'Submitting...' : 'Submit Resource'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Edit Dialog ────────────────────────────────── */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EditIcon color="primary" /> Edit Water Source
                    <IconButton sx={{ ml: 'auto' }} onClick={() => setEditOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Name" fullWidth required value={editForm.name || ''} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField select label="Type" value={editForm.type || 'Well'} onChange={(e) => setEditForm(p => ({ ...p, type: e.target.value }))}>{WATER_SOURCE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
                            <TextField select label="Access Type" value={editForm.access_type || 'Public'} onChange={(e) => setEditForm(p => ({ ...p, access_type: e.target.value }))}>{ACCESS_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
                        </Box>
                        <TextField select label="Operational Status" value={editForm.operational_status || 'Functional'} onChange={(e) => setEditForm(p => ({ ...p, operational_status: e.target.value }))}>{OPERATIONAL_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                        <TextField label="Description" fullWidth multiline rows={3} value={editForm.description || ''} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleEditSave} disabled={editLoading || !editForm.name}
                        startIcon={editLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {editLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Status Update Dialog ───────────────────────── */}
            <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon color="primary" /> Update Status
                    <IconButton sx={{ ml: 'auto' }} onClick={() => setStatusOpen(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {OPERATIONAL_STATUSES.map(s => (
                                <Chip key={s} label={s} icon={STATUS_ICONS[s]}
                                    onClick={() => setStatusForm(p => ({ ...p, operational_status: s }))}
                                    variant={statusForm.operational_status === s ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 600, bgcolor: statusForm.operational_status === s ? STATUS_COLORS[s] + '20' : 'transparent', color: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }} />
                            ))}
                        </Box>
                        <TextField label="Notes (optional)" fullWidth multiline rows={2} value={statusForm.notes} onChange={(e) => setStatusForm(p => ({ ...p, notes: e.target.value }))} placeholder="Reason for status change..." />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setStatusOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleStatusSave} disabled={statusLoading}
                        startIcon={statusLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {statusLoading ? 'Updating...' : 'Update Status'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Detail Dialog ──────────────────────────────── */}
            <Dialog open={!!detailSource} onClose={() => setDetailSource(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {detailSource && (<>
                    <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WaterDropIcon color="primary" /> {detailSource.name}
                        <IconButton sx={{ ml: 'auto' }} onClick={() => setDetailSource(null)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: detailSource.verified ? '#E8F5E9' : '#FFF3E0' }}>
                                {detailSource.verified ? <VerifiedIcon sx={{ fontSize: 28, color: '#2E7D32' }} /> : <PendingIcon sx={{ fontSize: 28, color: '#E65100' }} />}
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: detailSource.verified ? '#2E7D32' : '#E65100' }}>{detailSource.verified ? 'Approved' : 'Pending Approval'}</Typography>
                                    {detailSource.verified && detailSource.verified_by && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Verified by {detailSource.verified_by.name || 'Admin'} on {new Date(detailSource.verified_at).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
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
                                    <Chip label={detailSource.operational_status || 'Functional'} size="small" sx={{ mt: 0.5, bgcolor: STATUS_COLORS[detailSource.operational_status] + '20', color: STATUS_COLORS[detailSource.operational_status], fontWeight: 600 }} />
                                </CardContent></Card>
                                <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Location</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {detailSource.location?.coordinates?.[1]?.toFixed(4)}, {detailSource.location?.coordinates?.[0]?.toFixed(4)}
                                    </Typography>
                                </CardContent></Card>
                            </Box>
                            {detailSource.description && (
                                <Box><Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Description</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>{detailSource.description}</Typography></Box>
                            )}
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Submitted by: {detailSource.created_by?.name || 'Unknown'}</Typography><br />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Date: {new Date(detailSource.createdAt).toLocaleDateString()}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {isAdmin && <Button color="error" startIcon={<DeleteIcon />} sx={{ textTransform: 'none' }} onClick={() => handleDelete(detailSource._id)}>Delete</Button>}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button startIcon={<BuildIcon />} sx={{ textTransform: 'none' }} onClick={() => { openStatusDialog(detailSource); setDetailSource(null); }}>Update Status</Button>
                            <Button startIcon={<EditIcon />} sx={{ textTransform: 'none' }} onClick={() => { openEditDialog(detailSource); setDetailSource(null); }}>Edit</Button>
                            {isAdmin && !detailSource.verified && (
                                <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} sx={{ textTransform: 'none', borderRadius: 2 }} onClick={() => handleVerify(detailSource._id)}>Approve</Button>
                            )}
                        </Box>
                    </DialogActions>
                </>)}
            </Dialog>

            {/* ─── Confirm Dialog ─────────────────────────────── */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(p => ({ ...p, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{confirmDialog.title}</DialogTitle>
                <DialogContent><Typography variant="body2">{confirmDialog.message}</Typography></DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setConfirmDialog(p => ({ ...p, open: false }))} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" color={confirmDialog.color} onClick={confirmDialog.onConfirm} sx={{ textTransform: 'none', borderRadius: 2 }}>Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Snackbar ───────────────────────────────────── */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import {
    Box, Paper, Typography, Button, IconButton, Fab, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, Slider,
    Skeleton, Snackbar, Tooltip, FormControl, InputLabel, Select,
    CircularProgress, Divider, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
    Add as AddIcon,
    MyLocation as MyLocationIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
    WaterDrop as WaterDropIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    HelpOutline as HelpIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

/* ── Constants ───────────────────────────────────────────────── */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 8;
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const WATER_SOURCE_TYPES = ['Well', 'Public Tap', 'River', 'Lake', 'Bowser Point'];
const ACCESS_TYPES = ['Public', 'Private', 'Restricted'];
const CONTAMINATION_STATUSES = ['Clean', 'Contaminated', 'Unknown'];

const CONTAMINATION_COLORS = {
    Clean: '#2E7D32',
    Contaminated: '#D32F2F',
    Unknown: '#9E9E9E',
};

const MARKER_ICONS = {
    Clean: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    Contaminated: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    Unknown: 'https://maps.google.com/mapfiles/ms/icons/grey.png',
};

const paper = {
    p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider',
};

/* ══════════════════════════════════════════════════════════════ */
export default function WaterInventory() {
    const { api } = useAuth();

    /* ── Google Maps ──────────────────────────────────────────── */
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    /* ── State ────────────────────────────────────────────────── */
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSource, setSelectedSource] = useState(null);
    const [mapCenter, setMapCenter] = useState(SRI_LANKA_CENTER);
    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
    const mapRef = useRef(null);

    // Add dialog
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        name: '', type: 'Well', access_type: 'Public',
        description: '', contamination_status: 'Unknown',
        latitude: null, longitude: null,
    });
    const [addLoading, setAddLoading] = useState(false);
    const [pickingLocation, setPickingLocation] = useState(false);

    // Filters
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        type: '', contamination_status: '',
    });

    // Nearby search
    const [nearbyRadius, setNearbyRadius] = useState(5000);
    const [nearbyMode, setNearbyMode] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Stats
    const [stats, setStats] = useState(null);

    /* ── Fetch all sources ───────────────────────────────────── */
    const fetchSources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('limit', '100');
            if (filters.type) params.set('type', filters.type);
            if (filters.contamination_status) params.set('contamination_status', filters.contamination_status);

            const { data } = await api.get(`/water-sources?${params.toString()}`);
            setSources(data.data.sources || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load water sources');
        } finally {
            setLoading(false);
        }
    }, [api, filters]);

    /* ── Fetch nearby sources ────────────────────────────────── */
    const fetchNearbySources = useCallback(async (lat, lng) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('latitude', lat.toString());
            params.set('longitude', lng.toString());
            params.set('radius', nearbyRadius.toString());
            if (filters.type) params.set('type', filters.type);
            if (filters.contamination_status) params.set('contamination_status', filters.contamination_status);

            const { data } = await api.get(`/water-sources/nearby?${params.toString()}`);
            setSources(data.data.sources || []);
            setSnackbar({
                open: true, severity: 'info',
                message: `Found ${data.data.count} source(s) within ${nearbyRadius / 1000}km`,
            });
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to search nearby sources');
        } finally {
            setLoading(false);
        }
    }, [api, nearbyRadius, filters]);

    /* ── Fetch stats ─────────────────────────────────────────── */
    const fetchStats = useCallback(async () => {
        try {
            const { data } = await api.get('/water-sources/stats');
            setStats(data.data);
        } catch { /* silent */ }
    }, [api]);

    useEffect(() => {
        fetchSources();
        fetchStats();
    }, [fetchSources, fetchStats]);

    /* ── Get user location ───────────────────────────────────── */
    const getUserLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setSnackbar({ open: true, severity: 'error', message: 'Geolocation not supported' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                setMapCenter(loc);
                setMapZoom(14);
                if (mapRef.current) {
                    mapRef.current.panTo(loc);
                    mapRef.current.setZoom(14);
                }
                if (nearbyMode) {
                    fetchNearbySources(loc.lat, loc.lng);
                }
            },
            () => setSnackbar({ open: true, severity: 'error', message: 'Location access denied' }),
            { enableHighAccuracy: true }
        );
    }, [nearbyMode, fetchNearbySources]);

    /* ── Handle map click (for location picking) ─────────────── */
    const handleMapClick = useCallback((e) => {
        if (pickingLocation) {
            setAddForm((prev) => ({
                ...prev,
                latitude: e.latLng.lat(),
                longitude: e.latLng.lng(),
            }));
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
            await api.post('/water-sources', {
                name: addForm.name,
                type: addForm.type,
                location: { latitude: addForm.latitude, longitude: addForm.longitude },
                access_type: addForm.access_type,
                description: addForm.description,
                contamination_status: addForm.contamination_status,
            });
            setSnackbar({ open: true, severity: 'success', message: 'Water source added!' });
            setAddOpen(false);
            setAddForm({ name: '', type: 'Well', access_type: 'Public', description: '', contamination_status: 'Unknown', latitude: null, longitude: null });
            fetchSources();
            fetchStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to create' });
        } finally {
            setAddLoading(false);
        }
    };

    /* ── Update contamination status ─────────────────────────── */
    const handleUpdateContamination = async (sourceId, newStatus) => {
        try {
            await api.patch(`/water-sources/${sourceId}/contamination`, {
                contamination_status: newStatus,
                notes: `Marked as ${newStatus} via Water Inventory map`,
            });
            setSnackbar({ open: true, severity: 'success', message: `Marked as ${newStatus}` });
            setSelectedSource(null);
            fetchSources();
            fetchStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to update' });
        }
    };

    /* ── Find Nearby ─────────────────────────────────────────── */
    const handleFindNearby = () => {
        if (userLocation) {
            setNearbyMode(true);
            fetchNearbySources(userLocation.lat, userLocation.lng);
        } else {
            getUserLocation();
            setNearbyMode(true);
        }
    };

    const handleShowAll = () => {
        setNearbyMode(false);
        fetchSources();
    };

    /* ── Map load ────────────────────────────────────────────── */
    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    /* ── Render ───────────────────────────────────────────────── */
    if (loadError) {
        return <Alert severity="error" sx={{ borderRadius: 2 }}>Failed to load Google Maps: {loadError.message}</Alert>;
    }

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
                        <Chip icon={<CheckCircleIcon />} label={`${stats.byContaminationStatus?.Clean || 0} Clean`}
                            size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
                        <Chip icon={<WarningIcon />} label={`${stats.byContaminationStatus?.Contaminated || 0} Contaminated`}
                            size="small" sx={{ bgcolor: '#FFEBEE', color: '#D32F2F', fontWeight: 600 }} />
                        <Chip icon={<HelpIcon />} label={`${stats.byContaminationStatus?.Unknown || 0} Unknown`}
                            size="small" sx={{ bgcolor: '#F5F5F5', color: '#757575', fontWeight: 600 }} />
                    </Box>
                )}
            </Box>

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
                                onChangeCommitted={() => { if (userLocation) fetchNearbySources(userLocation.lat, userLocation.lng); }}
                                sx={{ flex: 1 }} />
                        </Box>
                        <Button size="small" onClick={handleShowAll} sx={{ textTransform: 'none' }}>
                            Show All
                        </Button>
                    </>
                )}

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Filter: Type */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select value={filters.type} label="Type"
                        onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {WATER_SOURCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                </FormControl>

                {/* Filter: Contamination */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.contamination_status} label="Status"
                        onChange={(e) => setFilters((p) => ({ ...p, contamination_status: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {CONTAMINATION_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </FormControl>

                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={() => nearbyMode && userLocation ? fetchNearbySources(userLocation.lat, userLocation.lng) : fetchSources()}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>

                <Box sx={{ flexGrow: 1 }} />

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {sources.length} source{sources.length !== 1 ? 's' : ''}
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
                        zIndex: 10, borderRadius: 2, boxShadow: 2,
                    }}>
                        Click on the map to pick a location
                    </Alert>
                )}

                {!isLoaded ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={onMapLoad}
                        onClick={handleMapClick}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: true,
                            fullscreenControl: true,
                            zoomControl: true,
                            styles: [
                                { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#b3d9ff' }] },
                                { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f0f4f0' }] },
                            ],
                        }}
                    >
                        {/* Water source markers */}
                        {sources.map((source) => {
                            const lat = source.location?.coordinates?.[1] || source.coordinates_lat_lng?.latitude;
                            const lng = source.location?.coordinates?.[0] || source.coordinates_lat_lng?.longitude;
                            if (!lat || !lng) return null;

                            const status = source.contamination_status || 'Unknown';
                            return (
                                <Marker
                                    key={source._id}
                                    position={{ lat, lng }}
                                    icon={MARKER_ICONS[status]}
                                    title={source.name}
                                    onClick={() => setSelectedSource(source)}
                                />
                            );
                        })}

                        {/* User location marker */}
                        {userLocation && (
                            <Marker
                                position={userLocation}
                                icon={{
                                    path: 0, // google.maps.SymbolPath.CIRCLE
                                    scale: 10,
                                    fillColor: '#4285F4',
                                    fillOpacity: 1,
                                    strokeColor: '#fff',
                                    strokeWeight: 3,
                                }}
                                title="Your Location"
                            />
                        )}

                        {/* Picked location marker for add form */}
                        {addForm.latitude && addForm.longitude && (
                            <Marker
                                position={{ lat: addForm.latitude, lng: addForm.longitude }}
                                icon={{
                                    path: 0,
                                    scale: 12,
                                    fillColor: '#FF6D00',
                                    fillOpacity: 1,
                                    strokeColor: '#fff',
                                    strokeWeight: 2,
                                }}
                                title="New Resource Location"
                            />
                        )}

                        {/* Info Window for selected source */}
                        {selectedSource && (() => {
                            const lat = selectedSource.location?.coordinates?.[1];
                            const lng = selectedSource.location?.coordinates?.[0];
                            if (!lat || !lng) return null;
                            const status = selectedSource.contamination_status || 'Unknown';
                            return (
                                <InfoWindow
                                    position={{ lat, lng }}
                                    onCloseClick={() => setSelectedSource(null)}
                                >
                                    <Box sx={{ minWidth: 220, p: 0.5 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                                            {selectedSource.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                                            <Chip label={selectedSource.type} size="small" variant="outlined" />
                                            <Chip label={selectedSource.operational_status || 'Functional'} size="small" variant="outlined" />
                                            <Chip label={selectedSource.access_type || 'Public'} size="small" variant="outlined" />
                                        </Box>

                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', gap: 1, mb: 1.5,
                                            p: 1, borderRadius: 1.5,
                                            bgcolor: status === 'Clean' ? '#E8F5E9' : status === 'Contaminated' ? '#FFEBEE' : '#F5F5F5',
                                        }}>
                                            {status === 'Clean' ? <CheckCircleIcon sx={{ color: '#2E7D32', fontSize: 20 }} /> :
                                                status === 'Contaminated' ? <WarningIcon sx={{ color: '#D32F2F', fontSize: 20 }} /> :
                                                    <HelpIcon sx={{ color: '#757575', fontSize: 20 }} />}
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: CONTAMINATION_COLORS[status] }}>
                                                {status}
                                            </Typography>
                                        </Box>

                                        {selectedSource.description && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                                {selectedSource.description.substring(0, 100)}
                                                {selectedSource.description.length > 100 ? '…' : ''}
                                            </Typography>
                                        )}

                                        <Divider sx={{ my: 1 }} />

                                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                                            Update Status:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Button size="small" variant={status === 'Clean' ? 'contained' : 'outlined'}
                                                color="success" sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 1.5, flex: 1 }}
                                                onClick={() => handleUpdateContamination(selectedSource._id, 'Clean')}>
                                                Clean
                                            </Button>
                                            <Button size="small" variant={status === 'Contaminated' ? 'contained' : 'outlined'}
                                                color="error" sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 1.5, flex: 1 }}
                                                onClick={() => handleUpdateContamination(selectedSource._id, 'Contaminated')}>
                                                Contaminated
                                            </Button>
                                        </Box>
                                    </Box>
                                </InfoWindow>
                            );
                        })()}
                    </GoogleMap>
                )}

                {/* FAB — Add Source */}
                <Fab color="primary" size="medium"
                    sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 5 }}
                    onClick={() => { setAddOpen(true); setPickingLocation(true); }}>
                    <AddIcon />
                </Fab>

                {/* FAB — My Location */}
                <Fab size="small" sx={{
                    position: 'absolute', bottom: 80, right: 28, zIndex: 5,
                    bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' },
                }}
                    onClick={getUserLocation}>
                    <MyLocationIcon sx={{ color: '#4285F4' }} />
                </Fab>
            </Paper>

            {/* ─── Legend ──────────────────────────────────────── */}
            <Paper elevation={0} sx={{ ...paper, display: 'flex', alignItems: 'center', gap: 3, py: 1, px: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Legend:</Typography>
                {Object.entries(CONTAMINATION_COLORS).map(([label, color]) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{label}</Typography>
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Name" fullWidth required value={addForm.name}
                            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Community Well #4" />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField select label="Type" value={addForm.type}
                                onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value }))}>
                                {WATER_SOURCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                            <TextField select label="Access" value={addForm.access_type}
                                onChange={(e) => setAddForm((p) => ({ ...p, access_type: e.target.value }))}>
                                {ACCESS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                        </Box>

                        <TextField select label="Contamination Status" value={addForm.contamination_status}
                            onChange={(e) => setAddForm((p) => ({ ...p, contamination_status: e.target.value }))}>
                            {CONTAMINATION_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>

                        <TextField label="Description" fullWidth multiline rows={2} value={addForm.description}
                            onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Optional description..." />

                        {/* Location */}
                        <Paper elevation={0} sx={{
                            p: 2, borderRadius: 2, bgcolor: addForm.latitude ? '#E8F5E9' : '#FFF3E0',
                            border: '1px dashed', borderColor: addForm.latitude ? '#4CAF50' : '#FF9800',
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                📍 Location {addForm.latitude ? '(Selected)' : '(Required)'}
                            </Typography>
                            {addForm.latitude ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                        Lat: {addForm.latitude.toFixed(6)}, Lng: {addForm.longitude.toFixed(6)}
                                    </Typography>
                                    <Button size="small" sx={{ textTransform: 'none', ml: 'auto' }}
                                        onClick={() => { setPickingLocation(true); }}>
                                        Re-pick
                                    </Button>
                                </Box>
                            ) : (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Click on the map behind this dialog to pick a location.
                                    You can drag the dialog aside first.
                                </Typography>
                            )}
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => { setAddOpen(false); setPickingLocation(false); }} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCreateSource} disabled={addLoading}
                        startIcon={addLoading ? <CircularProgress size={16} /> : <AddIcon />}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        {addLoading ? 'Adding...' : 'Add Resource'}
                    </Button>
                </DialogActions>
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

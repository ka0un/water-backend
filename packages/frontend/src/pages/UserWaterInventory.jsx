import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slider,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as HourglassEmptyIcon,
    LocationOn as LocationOnIcon,
    MyLocation as MyLocationIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    WaterDrop as WaterDropIcon,
} from '@mui/icons-material';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import {
    createWaterSource,
    getMyWaterSources,
    getNearbySources,
    getWaterSources,
} from '../services/waterSourceService';

const WATER_SOURCE_TYPES = ['Well', 'Public Tap', 'River', 'Lake', 'Bowser Point'];
const ACCESS_TYPES = ['Public', 'Private', 'Restricted'];
const OPERATIONAL_STATUSES = ['Functional', 'Broken', 'Maintenance', 'Abandoned'];
const SRI_LANKA_CENTER = [7.8731, 80.7718];

const mapPickerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const defaultForm = {
    name: '',
    type: 'Well',
    access_type: 'Public',
    operational_status: 'Functional',
    description: '',
    latitude: '',
    longitude: '',
};

function LocationPickerMap({ value, onPick }) {
    useMapEvents({
        click(event) {
            onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
        },
    });

    if (!value) {
        return null;
    }

    return <Marker position={[value.latitude, value.longitude]} icon={mapPickerIcon} />;
}

export default function UserWaterInventory() {
    const { api } = useAuth();

    const [tab, setTab] = useState(0);
    const [approvedSources, setApprovedSources] = useState([]);
    const [mySources, setMySources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', operational_status: '' });

    const [nearbyMode, setNearbyMode] = useState(false);
    const [nearbyRadius, setNearbyRadius] = useState(5000);
    const [coords, setCoords] = useState({ latitude: '', longitude: '' });

    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState(defaultForm);
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

    const showToast = (severity, message) => {
        setSnackbar({ open: true, severity, message });
    };

    const loadApproved = useCallback(async () => {
        const params = {
            verified: true,
            type: filters.type || undefined,
            operational_status: filters.operational_status || undefined,
            limit: 100,
            sort: '-createdAt',
        };

        if (nearbyMode && coords.latitude && coords.longitude) {
            const nearbyData = await getNearbySources(
                api,
                Number(coords.latitude),
                Number(coords.longitude),
                nearbyRadius,
                {
                    type: filters.type || undefined,
                    operational_status: filters.operational_status || undefined,
                    verified: true,
                }
            );
            setApprovedSources(nearbyData.sources || []);
            return;
        }

        const data = await getWaterSources(api, params);
        setApprovedSources(data.sources || []);
    }, [api, coords.latitude, coords.longitude, filters.operational_status, filters.type, nearbyMode, nearbyRadius]);

    const loadMine = useCallback(async () => {
        const data = await getMyWaterSources(api, {
            type: filters.type || undefined,
            operational_status: filters.operational_status || undefined,
            limit: 100,
            sort: '-createdAt',
        });
        setMySources(data.sources || []);
    }, [api, filters.operational_status, filters.type]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            await Promise.all([loadApproved(), loadMine()]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load water inventory data');
        } finally {
            setLoading(false);
        }
    }, [loadApproved, loadMine]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const displayedList = useMemo(() => {
        const list = tab === 0 ? approvedSources : mySources;
        const q = search.trim().toLowerCase();

        if (!q) {
            return list;
        }

        return list.filter((source) => {
            const fields = [
                source.name,
                source.type,
                source.description,
                source.operational_status,
                source.access_type,
            ];
            return fields.some((value) => value?.toLowerCase().includes(q));
        });
    }, [approvedSources, mySources, search, tab]);

    const pendingCount = useMemo(
        () => mySources.filter((source) => !source.verified).length,
        [mySources]
    );

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            showToast('error', 'Geolocation is not supported in this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: String(position.coords.latitude),
                    longitude: String(position.coords.longitude),
                });
                showToast('info', 'Location captured. Run Nearby Search to filter resources around you.');
            },
            () => {
                showToast('error', 'Unable to access your location.');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleNearbySearch = async () => {
        if (!coords.latitude || !coords.longitude) {
            showToast('warning', 'Enter latitude and longitude, or use your current location.');
            return;
        }

        setNearbyMode(true);
        setLoading(true);
        setError('');

        try {
            await loadApproved();
            showToast('success', 'Nearby approved resources loaded.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to search nearby resources');
        } finally {
            setLoading(false);
        }
    };

    const clearNearby = async () => {
        setNearbyMode(false);
        setLoading(true);
        try {
            await loadApproved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load approved resources');
        } finally {
            setLoading(false);
        }
    };

    const submitResource = async () => {
        const latitude = Number(addForm.latitude);
        const longitude = Number(addForm.longitude);

        if (!addForm.name.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
            showToast('warning', 'Name, latitude, and longitude are required.');
            return;
        }

        setSubmitting(true);
        try {
            await createWaterSource(api, {
                name: addForm.name.trim(),
                type: addForm.type,
                access_type: addForm.access_type,
                operational_status: addForm.operational_status,
                description: addForm.description.trim(),
                location: { latitude, longitude },
            });

            setAddOpen(false);
            setAddForm(defaultForm);
            await loadData();
            showToast('success', 'Water resource submitted. It will appear publicly after approval.');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to submit water resource');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePickLocation = ({ latitude, longitude }) => {
        setAddForm((prev) => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
        }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WaterDropIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Water Inventory - User View
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                    Add Water Resource
                </Button>
            </Box>

            <Paper sx={{ borderRadius: 3, p: 2, border: '1px solid', borderColor: 'divider' }}>
                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
                >
                    <Tab label="Approved Resources" />
                    <Tab
                        label={`My Submissions${pendingCount ? ` (${pendingCount} pending)` : ''}`}
                    />
                </Tabs>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Search by name, type, status..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}
                    />

                    <FormControl size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                            label="Type"
                            value={filters.type}
                            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
                        >
                            <MenuItem value="">All</MenuItem>
                            {WATER_SOURCE_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            label="Status"
                            value={filters.operational_status}
                            onChange={(event) =>
                                setFilters((prev) => ({ ...prev, operational_status: event.target.value }))
                            }
                        >
                            <MenuItem value="">All</MenuItem>
                            {OPERATIONAL_STATUSES.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {tab === 0 && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 700 }}>
                            Nearby Search (Approved resources only)
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                label="Latitude"
                                value={coords.latitude}
                                onChange={(event) => setCoords((prev) => ({ ...prev, latitude: event.target.value }))}
                            />
                            <TextField
                                size="small"
                                label="Longitude"
                                value={coords.longitude}
                                onChange={(event) => setCoords((prev) => ({ ...prev, longitude: event.target.value }))}
                            />
                            <Box sx={{ px: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Radius: {Math.round(nearbyRadius / 1000)} km
                                </Typography>
                                <Slider
                                    size="small"
                                    value={nearbyRadius}
                                    onChange={(_, value) => setNearbyRadius(value)}
                                    min={500}
                                    max={50000}
                                    step={500}
                                />
                            </Box>
                            <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={useMyLocation}>
                                Use My Location
                            </Button>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="contained" onClick={handleNearbySearch}>
                                    Nearby Search
                                </Button>
                                <Button variant="text" onClick={clearNearby} disabled={!nearbyMode}>
                                    Clear
                                </Button>
                            </Box>
                        </Box>
                    </>
                )}
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {displayedList.length} resource{displayedList.length === 1 ? '' : 's'} found
                </Typography>
                <Button variant="text" startIcon={<RefreshIcon />} onClick={loadData}>
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Paper sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Paper>
            ) : displayedList.length === 0 ? (
                <Paper sx={{ borderRadius: 3, p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        No water resources found.
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {displayedList.map((source) => (
                        <Card key={source._id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'start' }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                            {source.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {source.type} • {source.access_type || 'Public'}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        icon={source.verified ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                                        label={source.verified ? 'Approved' : 'Pending'}
                                        color={source.verified ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                                    <Chip size="small" variant="outlined" label={source.operational_status || 'Functional'} />
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={`Lat: ${source.location?.coordinates?.[1]?.toFixed(4) ?? '-'}`}
                                    />
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={`Lng: ${source.location?.coordinates?.[0]?.toFixed(4) ?? '-'}`}
                                    />
                                </Box>
                                {source.description && (
                                    <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                                        {source.description}
                                    </Typography>
                                )}
                                <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>
                                    Submitted on {new Date(source.createdAt).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add Water Resource</DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        New submissions are pending review and become visible to everyone only after approval.
                    </Alert>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Resource Name"
                            value={addForm.name}
                            onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                            required
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                select
                                label="Type"
                                value={addForm.type}
                                onChange={(event) => setAddForm((prev) => ({ ...prev, type: event.target.value }))}
                            >
                                {WATER_SOURCE_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Access"
                                value={addForm.access_type}
                                onChange={(event) =>
                                    setAddForm((prev) => ({ ...prev, access_type: event.target.value }))
                                }
                            >
                                {ACCESS_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <TextField
                            select
                            label="Operational Status"
                            value={addForm.operational_status}
                            onChange={(event) =>
                                setAddForm((prev) => ({ ...prev, operational_status: event.target.value }))
                            }
                        >
                            {OPERATIONAL_STATUSES.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                label="Latitude"
                                value={addForm.latitude}
                                onChange={(event) =>
                                    setAddForm((prev) => ({ ...prev, latitude: event.target.value }))
                                }
                                required
                            />
                            <TextField
                                label="Longitude"
                                value={addForm.longitude}
                                onChange={(event) =>
                                    setAddForm((prev) => ({ ...prev, longitude: event.target.value }))
                                }
                                required
                            />
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<LocationOnIcon />}
                                onClick={() => setLocationPickerOpen(true)}
                                sx={{ textTransform: 'none' }}
                            >
                                Select on Map
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<MyLocationIcon />}
                                onClick={() => {
                                    if (!navigator.geolocation) {
                                        showToast('error', 'Geolocation is not supported in this browser.');
                                        return;
                                    }
                                    navigator.geolocation.getCurrentPosition(
                                        (position) => {
                                            setAddForm((prev) => ({
                                                ...prev,
                                                latitude: String(position.coords.latitude),
                                                longitude: String(position.coords.longitude),
                                            }));
                                            showToast('success', 'Current location applied.');
                                        },
                                        () => showToast('error', 'Unable to fetch your current location.'),
                                        { enableHighAccuracy: true }
                                    );
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Use My Current Location
                            </Button>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Tip: select a point on the map to fill the coordinates automatically.
                        </Typography>
                        <TextField
                            multiline
                            minRows={3}
                            label="Description"
                            value={addForm.description}
                            onChange={(event) =>
                                setAddForm((prev) => ({ ...prev, description: event.target.value }))
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={submitResource} disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={locationPickerOpen} onClose={() => setLocationPickerOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Select Water Resource Location</DialogTitle>
                <DialogContent dividers>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Click anywhere on the map to place the pin, then use the selected coordinates.
                    </Alert>
                    <Box sx={{ height: { xs: 360, md: 480 }, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <MapContainer center={SRI_LANKA_CENTER} zoom={8} style={{ height: '100%', width: '100%' }}>
                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationPickerMap
                                value={
                                    addForm.latitude && addForm.longitude
                                        ? {
                                              latitude: Number(addForm.latitude),
                                              longitude: Number(addForm.longitude),
                                          }
                                        : null
                                }
                                onPick={handlePickLocation}
                            />
                        </MapContainer>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 2 }}>
                        <TextField label="Latitude" value={addForm.latitude} disabled />
                        <TextField label="Longitude" value={addForm.longitude} disabled />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLocationPickerOpen(false)}>Done</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

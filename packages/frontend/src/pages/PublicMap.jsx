import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Box, Paper, Typography, AppBar, Toolbar, Button, Stack,
    Chip, Divider, IconButton, Alert, TextField
} from '@mui/material';
import {
    ArrowBack, Public as PublicIcon, LocationOn, Close
} from '@mui/icons-material';
import { api } from '../context/AuthContext';
import { getWaterSources } from '../services/waterSourceService';

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

// Blue icon for user's current location
const userLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [28, 46], iconAnchor: [14, 46], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const ICONS = { verified: createIcon('green') };
const SRI_LANKA_CENTER = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;
const STATUS_COLORS = { Functional: '#2E7D32', Broken: '#D32F2F', Maintenance: '#ED6C02', Abandoned: '#757575' };

export default function PublicMap() {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const [sources, setSources] = useState([]);
    const [filteredSources, setFilteredSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchRadius, setSearchRadius] = useState(5); // km
    const [searchLocation, setSearchLocation] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [userLocationAddress, setUserLocationAddress] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Only fetch verified sources for public map
            const sourcesData = await getWaterSources(api, { verified: 'true', limit: 100 });
            setSources(sourcesData.sources || []);
            setFilteredSources(sourcesData.sources || []);
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

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Handle nearby search - Get user's actual location
    const handleNearbySearch = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setIsSearching(true);
        setError(null);
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setSearchLocation({ lat: latitude, lng: longitude, accuracy });

                // Store coordinates as address
                setUserLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

                // Filter sources within search radius
                const nearby = sources.filter((source) => {
                    const coords = getCoords(source);
                    if (!coords) return false;
                    const distance = calculateDistance(latitude, longitude, coords[0], coords[1]);
                    return distance <= searchRadius;
                });

                setFilteredSources(nearby);

                // Center map on user location
                if (mapRef.current) {
                    setTimeout(() => {
                        mapRef.current?.setView([latitude, longitude], 12);
                    }, 100);
                }

                setIsSearching(false);
                if (nearby.length === 0) {
                    setError(`No water sources found within ${searchRadius} km of your location.`);
                } else {
                    setError(null);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to get your location.';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Location information is unavailable. Please try again.';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'Location request timed out. Please try again.';
                }
                setError(errorMessage);
                setIsSearching(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const clearSearch = () => {
        setSearchLocation(null);
        setFilteredSources(sources);
        setError(null);
        setUserLocationAddress(null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F2F6FB' }}>
            {/* Navigation Bar */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', color: '#1A2027', borderBottom: '1px solid #E4ECF4' }}>
                <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 62, md: 70 } }}>
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
                        <Button variant="contained" onClick={() => navigate('/login')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                            Sign In
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Nearby Search Section */}
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, bgcolor: '#fff', borderBottom: '1px solid #E4ECF4' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                    <Box sx={{ flex: 1, maxWidth: { sm: 220 } }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Search Radius (km)
                        </Typography>
                        <TextField
                            type="number"
                            size="small"
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(Math.max(1, parseInt(e.target.value) || 1))}
                            inputProps={{ min: 1, max: 50, step: 1 }}
                            sx={{ width: '100%' }}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<LocationOn />}
                        onClick={handleNearbySearch}
                        disabled={isSearching || loading}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2.5, minHeight: 40 }}
                    >
                        {isSearching ? 'Finding Location...' : 'Find Nearby'}
                    </Button>
                    {searchLocation && (
                        <Button
                            variant="outlined"
                            startIcon={<Close />}
                            onClick={clearSearch}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, minHeight: 40 }}
                        >
                            Clear
                        </Button>
                    )}
                </Stack>
                
                {/* Show user's location info */}
                {searchLocation && (
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#E8F2FE', borderRadius: 2, border: '1px solid #8EC5FF' }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <LocationOn sx={{ color: '#1565C0', fontSize: 20, mt: 0.3 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1565C0' }}>
                                    Your Location
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#0D5DA8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    {userLocationAddress}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#1565C0', display: 'block', mt: 0.5 }}>
                                    {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''} within {searchRadius} km
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                )}
            </Box>

            {error && (
                <Box sx={{ px: { xs: 2, md: 3 }, pt: 1.5 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                </Box>
            )}

            {/* Map Container */}
            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, pt: error ? 1.5 : 2 }}>
                <Paper elevation={0} sx={{ width: '100%', height: { xs: '58vh', md: 'calc(100vh - 230px)' }, minHeight: 420, borderRadius: 3, border: '1px solid #DCE7F3', overflow: 'hidden' }}>
                    <MapContainer 
                        ref={mapRef}
                        center={SRI_LANKA_CENTER} 
                        zoom={DEFAULT_ZOOM} 
                        style={{ width: '100%', height: '100%' }}
                    >
                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        
                        {/* User's current location marker */}
                        {searchLocation && (
                            <>
                                <Circle 
                                    center={[searchLocation.lat, searchLocation.lng]} 
                                    radius={searchRadius * 1000}
                                    fillColor="#1565C0" 
                                    fillOpacity={0.09}
                                    weight={1.5}
                                    color="#1565C0"
                                />
                                
                                {/* User location marker */}
                                <Marker 
                                    position={[searchLocation.lat, searchLocation.lng]} 
                                    icon={userLocationIcon}
                                >
                                    <Popup maxWidth={300}>
                                        <Box sx={{ minWidth: 200 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1565C0' }}>
                                                📍 Your Current Location
                                            </Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                                                <strong>Latitude:</strong> {searchLocation.lat.toFixed(6)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                                                <strong>Longitude:</strong> {searchLocation.lng.toFixed(6)}
                                            </Typography>
                                            {searchLocation.accuracy && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    Accuracy: ±{Math.round(searchLocation.accuracy)}m
                                                </Typography>
                                            )}
                                        </Box>
                                    </Popup>
                                </Marker>
                            </>
                        )}
                        
                        {/* Water sources markers */}
                        {filteredSources.map((source) => {
                            const coords = getCoords(source);
                            if (!coords) return null;
                            
                            let distance = null;
                            if (searchLocation) {
                                distance = calculateDistance(searchLocation.lat, searchLocation.lng, coords[0], coords[1]);
                            }
                            
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
                                            {distance !== null && (
                                                <Typography variant="body2" sx={{ mt: 1, p: 0.5, bgcolor: '#E3F2FD', borderRadius: 1, color: '#1565C0', fontWeight: 600 }}>
                                                    {distance.toFixed(2)} km from you
                                                </Typography>
                                            )}
                                            {source.description && (
                                                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '0.75rem' }}>{source.description}</Typography>
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

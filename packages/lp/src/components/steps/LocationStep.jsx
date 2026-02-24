import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Alert, Chip, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Sri Lanka districts list ─────────────────────────────────── */
const DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
    'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
    'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
    'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

/* ── Sri Lanka center & bounds ────────────────────────────────── */
const SL_CENTER = [7.8731, 80.7718];
const SL_BOUNDS = [[5.8, 79.4], [9.9, 82.1]];

/* ── Custom marker icon (Leaflet default icon fix) ────────────── */
const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/* ── Map click handler component ──────────────────────────────── */
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

/* ── Fly to position component ────────────────────────────────── */
function FlyTo({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 14, { duration: 1.2 });
        }
    }, [position, map]);
    return null;
}

/* ── Reverse geocode using Nominatim (free, no API key) ───────── */
async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&addressdetails=1`,
            { headers: { 'User-Agent': 'WaterQualityApp/1.0' } }
        );
        const data = await res.json();
        const addr = data.address || {};

        // Try to match district from Nominatim data
        const rawDistrict = addr.state_district || addr.county || addr.state || '';
        const matchedDistrict = DISTRICTS.find(d =>
            rawDistrict.toLowerCase().includes(d.toLowerCase()) ||
            d.toLowerCase().includes(rawDistrict.toLowerCase().replace(' district', ''))
        ) || '';

        const city = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || '';
        const road = addr.road || '';
        const displayName = data.display_name || '';

        return { district: matchedDistrict, city, address: road || '', displayName };
    } catch {
        return { district: '', city: '', address: '', displayName: '' };
    }
}

/* ══════════════════════════════════════════════════════════════ */
export default function LocationStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [location, setLocation] = useState({
        district: reportData.location?.district || '',
        city: reportData.location?.city || '',
        address: reportData.location?.address || '',
    });
    const [coords, setCoords] = useState(
        reportData.location?.coordinates?.lat
            ? { lat: reportData.location.coordinates.lat, lng: reportData.location.coordinates.lng }
            : null
    );
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [geocoding, setGeocoding] = useState(false);

    useEffect(() => {
        if (reportData.location) {
            setLocation({
                district: reportData.location.district || '',
                city: reportData.location.city || '',
                address: reportData.location.address || '',
            });
            if (reportData.location.coordinates?.lat) {
                setCoords({ lat: reportData.location.coordinates.lat, lng: reportData.location.coordinates.lng });
            }
        }
    }, [reportData.location]);

    const handleChange = (field) => (e) => {
        setLocation((prev) => ({ ...prev, [field]: e.target.value }));
    };

    /* ── GPS: Use My Location ─────────────────────────────────── */
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser.');
            return;
        }
        setGpsLoading(true);
        setGpsError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });
                setGeocoding(true);
                const geo = await reverseGeocode(latitude, longitude);
                setLocation(prev => ({
                    district: geo.district || prev.district,
                    city: geo.city || prev.city,
                    address: geo.address || prev.address,
                }));
                setGeocoding(false);
                setGpsLoading(false);
            },
            (err) => {
                setGpsError(
                    err.code === 1 ? 'Location permission denied. Please allow location access and try again.'
                        : err.code === 2 ? 'Location unavailable. Please try again or pick on the map.'
                            : 'Location request timed out. Please try again.'
                );
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    /* ── Map click handler ────────────────────────────────────── */
    const handleMapClick = useCallback(async (lat, lng) => {
        setCoords({ lat, lng });
        setGeocoding(true);
        const geo = await reverseGeocode(lat, lng);
        setLocation(prev => ({
            district: geo.district || prev.district,
            city: geo.city || prev.city,
            address: geo.address || prev.address,
        }));
        setGeocoding(false);
    }, []);

    /* ── Submit ────────────────────────────────────────────────── */
    const handleNext = async () => {
        if (!location.district || !location.city) return;
        const locationData = {
            ...location,
            coordinates: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
        };
        await saveStepData({ location: locationData }, stepNumber + 1);
        onNext();
    };

    const canContinue = location.district.trim() && location.city.trim();

    return (
        <StepLayout
            title="Where is this water source?"
            subtitle="Help us locate the issue. Use your GPS, pick on the map, or fill in manually."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            {/* ── Quick location buttons ─────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                <Button
                    variant={coords ? 'outlined' : 'contained'}
                    startIcon={gpsLoading ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
                    onClick={handleUseMyLocation}
                    disabled={gpsLoading}
                    sx={{
                        flex: 1, minWidth: 160, py: 1.5, borderRadius: 3,
                        fontWeight: 700, textTransform: 'none', fontSize: '0.9rem',
                    }}
                >
                    {gpsLoading ? 'Getting location...' : coords ? 'Update My Location' : '📍 Use My Location'}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<MapIcon />}
                    onClick={() => setShowMap(!showMap)}
                    sx={{
                        flex: 1, minWidth: 160, py: 1.5, borderRadius: 3,
                        fontWeight: 700, textTransform: 'none', fontSize: '0.9rem',
                    }}
                >
                    {showMap ? 'Hide Map' : '🗺️ Pick on Map'}
                </Button>
            </Box>

            {/* ── GPS error ──────────────────────────────────────── */}
            {gpsError && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setGpsError(null)}>
                    {gpsError}
                </Alert>
            )}

            {/* ── Geocoding indicator ────────────────────────────── */}
            {geocoding && (
                <Alert severity="info" icon={<CircularProgress size={16} />} sx={{ mb: 2, borderRadius: 2 }}>
                    Looking up address details...
                </Alert>
            )}

            {/* ── GPS coordinates badge ──────────────────────────── */}
            {coords && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper variant="outlined" sx={{
                        p: 1.5, mb: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                        bgcolor: '#E8F5E9', borderColor: '#66BB6A',
                    }}>
                        <LocationOnIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#2E7D32', display: 'block' }}>
                                GPS Location Set
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#558B2F', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setCoords(null)} sx={{ color: '#2E7D32' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Paper>
                </motion.div>
            )}

            {/* ── Interactive Map ────────────────────────────────── */}
            {showMap && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
                        <Box sx={{ p: 1, bgcolor: '#F5F5F5', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MapIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Tap on the map to select your water source location
                            </Typography>
                        </Box>
                        <Box sx={{ height: 320 }}>
                            <MapContainer
                                center={coords ? [coords.lat, coords.lng] : SL_CENTER}
                                zoom={coords ? 14 : 8}
                                maxBounds={SL_BOUNDS}
                                minZoom={7}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapClickHandler onMapClick={handleMapClick} />
                                {coords && <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />}
                                {coords && <FlyTo position={[coords.lat, coords.lng]} />}
                            </MapContainer>
                        </Box>
                    </Paper>
                </motion.div>
            )}

            {/* ── Location form fields ───────────────────────────── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                    select
                    fullWidth
                    label="District"
                    value={location.district}
                    onChange={handleChange('district')}
                    SelectProps={{ native: true }}
                    helperText={coords && !location.district ? 'Could not auto-detect district. Please select manually.' : ''}
                >
                    <option value="">Select district...</option>
                    {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    label="City / Town"
                    placeholder="e.g., Kaduwela"
                    value={location.city}
                    onChange={handleChange('city')}
                />

                <TextField
                    fullWidth
                    label="Address or Landmark (optional)"
                    placeholder="e.g., Near Temple Junction, Kaduwela"
                    value={location.address}
                    onChange={handleChange('address')}
                    multiline
                    rows={2}
                />
            </Box>

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={!canContinue}
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 4, py: 1.6, borderRadius: 3, fontWeight: 700, fontSize: '1rem' }}
            >
                Continue
            </Button>
        </StepLayout>
    );
}

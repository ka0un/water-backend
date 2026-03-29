import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Box, Paper, Typography, Button, Chip, Alert, Snackbar, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton, Card, CardContent,
    Divider, CircularProgress, Tooltip, Badge, TextField, InputAdornment,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    WaterDrop as WaterDropIcon,
    HourglassEmpty as PendingIcon,
    VerifiedUser as VerifiedIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import {
    getWaterSources,
    verifyWaterSource,
    deleteWaterSource,
    getWaterSourceStats,
} from '../services/waterSourceService';

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
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

const markerIcon = createIcon('orange');

const STATUS_COLORS = {
    Functional: '#2E7D32',
    Broken: '#D32F2F',
    Maintenance: '#ED6C02',
    Abandoned: '#757575',
};

/* ══════════════════════════════════════════════════════════════ */
export default function WaterResourceApproval() {
    const { api } = useAuth();

    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Detail dialog
    const [selectedSource, setSelectedSource] = useState(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Action loading
    const [actionLoading, setActionLoading] = useState(null);

    /* ── Load pending sources ────────────────────────────────── */
    const loadPendingSources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getWaterSources(api, { verified: 'false', limit: 100, sort: '-createdAt' });
            setSources(data.sources || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load pending sources');
        } finally {
            setLoading(false);
        }
    }, [api]);

    const loadStats = useCallback(async () => {
        try {
            const data = await getWaterSourceStats(api);
            setStats(data);
        } catch { /* silent */ }
    }, [api]);

    useEffect(() => {
        loadPendingSources();
        loadStats();
    }, [loadPendingSources, loadStats]);

    /* ── Approve ─────────────────────────────────────────────── */
    const handleApprove = async (sourceId) => {
        setActionLoading(sourceId);
        try {
            await verifyWaterSource(api, sourceId);
            setSnackbar({ open: true, severity: 'success', message: 'Water source approved successfully!' });
            setSelectedSource(null);
            loadPendingSources();
            loadStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to approve' });
        } finally {
            setActionLoading(null);
        }
    };

    /* ── Delete ──────────────────────────────────────────────── */
    const handleDelete = async (sourceId) => {
        setActionLoading(sourceId);
        try {
            await deleteWaterSource(api, sourceId);
            setSnackbar({ open: true, severity: 'success', message: 'Water source rejected and deleted' });
            setSelectedSource(null);
            loadPendingSources();
            loadStats();
        } catch (e) {
            setSnackbar({ open: true, severity: 'error', message: e.response?.data?.message || 'Failed to delete' });
        } finally {
            setActionLoading(null);
        }
    };

    /* ── Filtered sources ────────────────────────────────────── */
    const filteredSources = sources.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.name?.toLowerCase().includes(q) ||
            s.type?.toLowerCase().includes(q) ||
            s.created_by?.name?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q)
        );
    });

    const getCoords = (source) => {
        const lat = source.location?.coordinates?.[1];
        const lng = source.location?.coordinates?.[0];
        return lat && lng ? [lat, lng] : null;
    };

    const pendingCount = stats ? (stats.total - stats.verified) : sources.length;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* ─── Header ─────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Badge badgeContent={pendingCount} color="warning" max={99}>
                    <PendingIcon sx={{ fontSize: 32, color: '#E65100' }} />
                </Badge>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        Water Resource Approval
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Review and approve water sources submitted by users
                    </Typography>
                </Box>

                {stats && (
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Chip icon={<VerifiedIcon />} label={`${stats.verified || 0} Approved`}
                            size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
                        <Chip icon={<PendingIcon />} label={`${stats.unverified || 0} Pending`}
                            size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600 }} />
                    </Box>
                )}
            </Box>

            {/* ─── Search & Refresh ───────────────────────────── */}
            <Paper elevation={0} sx={{
                p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 2,
            }}>
                <TextField
                    size="small" placeholder="Search by name, type, or submitter..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    sx={{ flexGrow: 1, maxWidth: 400 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>
                        ),
                    }}
                />
                <Tooltip title="Refresh">
                    <IconButton onClick={() => { loadPendingSources(); loadStats(); }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {filteredSources.length} pending
                </Typography>
            </Paper>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ─── Table ──────────────────────────────────────── */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : filteredSources.length === 0 ? (
                <Paper elevation={0} sx={{
                    p: 6, borderRadius: 3, border: '1px solid', borderColor: 'divider',
                    textAlign: 'center',
                }}>
                    <VerifiedIcon sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        All caught up!
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No pending water sources to review.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={0}
                    sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Submitted By</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredSources
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((source) => (
                                    <TableRow key={source._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <WaterDropIcon sx={{ fontSize: 18, color: '#1565C0' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {source.name}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={source.type} size="small" variant="outlined"
                                                sx={{ height: 24, fontSize: '0.75rem' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={source.operational_status || 'Functional'} size="small"
                                                sx={{
                                                    height: 24, fontSize: '0.75rem',
                                                    bgcolor: STATUS_COLORS[source.operational_status] + '20',
                                                    color: STATUS_COLORS[source.operational_status],
                                                    fontWeight: 600,
                                                }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {source.created_by?.name || 'Unknown'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {new Date(source.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" color="primary"
                                                        onClick={() => setSelectedSource(source)}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Approve">
                                                    <IconButton size="small" color="success"
                                                        disabled={actionLoading === source._id}
                                                        onClick={() => handleApprove(source._id)}>
                                                        {actionLoading === source._id
                                                            ? <CircularProgress size={18} />
                                                            : <ApproveIcon fontSize="small" />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject & Delete">
                                                    <IconButton size="small" color="error"
                                                        disabled={actionLoading === source._id}
                                                        onClick={() => handleDelete(source._id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={filteredSources.length}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        rowsPerPageOptions={[5, 10, 25]}
                    />
                </TableContainer>
            )}

            {/* ─── Detail Dialog ──────────────────────────────── */}
            <Dialog open={!!selectedSource} onClose={() => setSelectedSource(null)}
                maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {selectedSource && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WaterDropIcon color="primary" />
                            {selectedSource.name}
                            <Chip label="Pending" size="small" color="warning" sx={{ ml: 1 }} />
                            <IconButton sx={{ ml: 'auto' }} onClick={() => setSelectedSource(null)}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {/* Left: Details */}
                                <Box sx={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Type</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedSource.type}</Typography>
                                        </CardContent></Card>
                                        <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Access</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedSource.access_type || 'Public'}</Typography>
                                        </CardContent></Card>
                                        <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Operational Status</Typography>
                                            <Chip label={selectedSource.operational_status || 'Functional'} size="small"
                                                sx={{
                                                    mt: 0.5,
                                                    bgcolor: STATUS_COLORS[selectedSource.operational_status] + '20',
                                                    color: STATUS_COLORS[selectedSource.operational_status],
                                                    fontWeight: 600,
                                                }} />
                                        </CardContent></Card>
                                        <Card variant="outlined"><CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Coordinates</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {selectedSource.location?.coordinates?.[1]?.toFixed(6)},{' '}
                                                {selectedSource.location?.coordinates?.[0]?.toFixed(6)}
                                            </Typography>
                                        </CardContent></Card>
                                    </Box>

                                    {selectedSource.description && (
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Description</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedSource.description}</Typography>
                                        </Box>
                                    )}

                                    <Divider />
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Submitted by: <strong>{selectedSource.created_by?.name || 'Unknown'}</strong>
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Email: {selectedSource.created_by?.email || 'N/A'}
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Date: {new Date(selectedSource.createdAt).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Right: Mini Map */}
                                {getCoords(selectedSource) && (
                                    <Box sx={{ width: 300, height: 250, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                        <MapContainer
                                            center={getCoords(selectedSource)}
                                            zoom={14}
                                            style={{ width: '100%', height: '100%' }}
                                            zoomControl={false}
                                            dragging={false}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={getCoords(selectedSource)} icon={markerIcon}>
                                                <Popup>{selectedSource.name}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                            <Button color="error" variant="outlined" startIcon={<DeleteIcon />}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                                disabled={actionLoading === selectedSource._id}
                                onClick={() => handleDelete(selectedSource._id)}>
                                Reject & Delete
                            </Button>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button onClick={() => setSelectedSource(null)} sx={{ textTransform: 'none' }}>
                                    Close
                                </Button>
                                <Button variant="contained" color="success"
                                    startIcon={actionLoading === selectedSource._id ? <CircularProgress size={16} /> : <ApproveIcon />}
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                    disabled={actionLoading === selectedSource._id}
                                    onClick={() => handleApprove(selectedSource._id)}>
                                    Approve Resource
                                </Button>
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

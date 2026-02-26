import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box, Paper, Typography, Chip, Button, IconButton, TextField,
    Alert, Skeleton, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableHead, TableRow,
    Stack, Drawer, Tooltip, InputAdornment, Badge, List, ListItemButton,
    ListItemText, ListItemIcon,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon, Cancel as RejectIcon, Visibility as ViewIcon,
    Close as CloseIcon, ArrowBack, ArrowForward, Search as SearchIcon,
    WaterDrop, AccessTime, Person, CameraAlt, Science, Security as SecurityIcon, Block as BlockIcon,
    Warning as WarningIcon, Info as InfoIcon, Refresh as RefreshIcon,
    FiberManualRecord as DotIcon, Map as MapIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Constants ───────────────────────────────────────────────── */
const STATUS_COLORS = { pending: '#ED6C02', approved: '#2E7D32', rejected: '#D32F2F' };
const STATUS_BG = { pending: '#FFF3E0', approved: '#E8F5E9', rejected: '#FFEBEE' };
const SEVERITY_BG = { severe: '#FFCDD2', moderate: '#FFE0B2', mild: '#E8F5E9', slight: '#E3F2FD' };

const ADV_TEST_LABELS = {
    ph: 'pH', hardness: 'Hardness', chlorine: 'Chlorine', tds: 'TDS (Total Dissolved Solids)',
    cyanuricAcid: 'Cyanuric Acid', bromine: 'Bromine', nitrate: 'Nitrate', nitrite: 'Nitrite',
    iron: 'Iron (Fe)', chromium: 'Chromium (Cr)', lead: 'Lead (Pb)', copper: 'Copper (Cu)',
    mercury: 'Mercury (Hg)', fluoride: 'Fluoride (F)', carbonate: 'Carbonate',
    totalAlkalinity: 'Total Alkalinity',
};
const HEAVY_METALS = ['iron', 'chromium', 'lead', 'copper', 'mercury'];

/* ── WHO / SL drinking water safety thresholds ──────────────── */
// Each: { safe: [min,max], caution: [min,max], unit, desc }
// Beyond caution range = danger
const SAFETY_THRESHOLDS = {
    ph: { safe: [6.5, 8.5], caution: [6.0, 9.0], unit: '', desc: 'WHO guideline: 6.5–8.5' },
    tds: { safe: [0, 300], caution: [0, 600], unit: 'mg/L', desc: 'WHO: <600 acceptable, >1000 unpalatable' },
    hardness: { safe: [0, 200], caution: [0, 500], unit: 'mg/L', desc: 'WHO: <200 good, >500 very hard' },
    chlorine: { safe: [0, 4], caution: [0, 5], unit: 'mg/L', desc: 'WHO: <5 mg/L maximum' },
    nitrate: { safe: [0, 50], caution: [0, 100], unit: 'mg/L', desc: 'WHO: <50 mg/L limit' },
    nitrite: { safe: [0, 3], caution: [0, 10], unit: 'mg/L', desc: 'WHO: <3 mg/L short-term' },
    fluoride: { safe: [0, 1.5], caution: [0, 2.0], unit: 'mg/L', desc: 'WHO: <1.5 mg/L limit' },
    iron: { safe: [0, 0.3], caution: [0, 1.0], unit: 'mg/L', desc: 'WHO: <0.3 mg/L aesthetic' },
    lead: { safe: [0, 0.01], caution: [0, 0.05], unit: 'mg/L', desc: 'WHO: <0.01 mg/L — toxic' },
    copper: { safe: [0, 2.0], caution: [0, 5.0], unit: 'mg/L', desc: 'WHO: <2 mg/L limit' },
    chromium: { safe: [0, 0.05], caution: [0, 0.1], unit: 'mg/L', desc: 'WHO: <0.05 mg/L limit' },
    mercury: { safe: [0, 0.006], caution: [0, 0.01], unit: 'mg/L', desc: 'WHO: <0.006 mg/L — highly toxic' },
    bromine: { safe: [0, 0.01], caution: [0, 0.1], unit: 'mg/L', desc: 'WHO: <0.01 mg/L limit' },
    cyanuricAcid: { safe: [0, 50], caution: [0, 100], unit: 'mg/L', desc: 'Recommended: <50 mg/L' },
    carbonate: { safe: [0, 200], caution: [0, 500], unit: 'mg/L', desc: 'Typical: <200 mg/L' },
    totalAlkalinity: { safe: [20, 200], caution: [10, 500], unit: 'mg/L', desc: 'Optimal: 20–200 mg/L' },
};

const ISSUE_SEVERITY = {
    safe: { label: 'Safe', color: '#2E7D32', bg: '#E8F5E9', icon: '✓' },
    caution: { label: 'Caution', color: '#ED6C02', bg: '#FFF3E0', icon: '⚠' },
    warning: { label: 'Warning', color: '#E65100', bg: '#FFE0B2', icon: '⚠' },
    danger: { label: 'Danger', color: '#C62828', bg: '#FFEBEE', icon: '✕' },
};

function evaluateTestSafety(key, value) {
    const t = SAFETY_THRESHOLDS[key];
    if (!t || value == null) return null;
    const v = Number(value);
    if (isNaN(v)) return null;
    if (v >= t.safe[0] && v <= t.safe[1]) return { severity: 'safe', ...ISSUE_SEVERITY.safe, threshold: t };
    if (v >= t.caution[0] && v <= t.caution[1]) return { severity: 'caution', ...ISSUE_SEVERITY.caution, threshold: t };
    // Beyond caution = danger for most, but check direction
    if (key === 'ph') {
        // pH can be too low or too high
        if (v < t.caution[0] || v > t.caution[1]) return { severity: 'danger', ...ISSUE_SEVERITY.danger, threshold: t };
        return { severity: 'warning', ...ISSUE_SEVERITY.warning, threshold: t };
    }
    // For alkalinity, below range is also a concern
    if (key === 'totalAlkalinity' && v < t.caution[0]) return { severity: 'caution', ...ISSUE_SEVERITY.caution, threshold: t };
    return { severity: 'danger', ...ISSUE_SEVERITY.danger, threshold: t };
}

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ── Authenticated image component ───────────────────────────── */
const AuthImage = ({ src, alt, sx, api }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [imgError, setImgError] = useState(false);
    const urlRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setBlobUrl(null);
        setImgError(false);
        if (!src || !api) return;

        api.get(src, { responseType: 'blob' })
            .then(res => {
                if (cancelled) return;
                const url = URL.createObjectURL(res.data);
                urlRef.current = url;
                setBlobUrl(url);
            })
            .catch(() => { if (!cancelled) setImgError(true); });

        return () => {
            cancelled = true;
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        };
    }, [src, api]);

    if (imgError) return (
        <Box sx={{ ...sx, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F5F5', color: '#BDBDBD' }}>
            <CameraAlt sx={{ fontSize: 40, opacity: 0.4 }} />
        </Box>
    );
    if (!blobUrl) return (
        <Skeleton variant="rectangular" sx={{ ...sx, minHeight: 200 }} />
    );
    return <Box component="img" src={blobUrl} alt={alt} sx={sx} />;
};

/* ── Observation detail card (expanded when detected) ────────── */
const ObsCard = ({ label, data }) => {
    if (!data || data.detected === undefined) return null;
    const detected = data.detected === true;
    if (!detected) return (
        <Box sx={{ py: 0.5, px: 1, display: 'flex', alignItems: 'center', gap: 1, opacity: 0.55 }}>
            <DotIcon sx={{ fontSize: 8, color: '#BDBDBD' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label} — Not detected</Typography>
        </Box>
    );
    // Detected → show full detail
    return (
        <Paper variant="outlined" sx={{
            p: 1.5, borderRadius: 2, borderColor: '#E65100',
            bgcolor: '#FFF3E0',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#E65100' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#E65100', fontSize: '0.78rem' }}>
                    {label} — Detected
                </Typography>
                {data.severity && (
                    <Chip label={capitalize(data.severity)} size="small"
                        sx={{ ml: 'auto', height: 20, fontSize: '0.63rem', fontWeight: 700, bgcolor: SEVERITY_BG[data.severity] || '#FFE0B2', color: '#333' }} />
                )}
            </Box>
            {data.type && (
                <Typography variant="caption" sx={{ display: 'block', pl: 3, fontWeight: 600 }}>Type: {capitalize(data.type)}</Typography>
            )}
            {data.color && (
                <Typography variant="caption" sx={{ display: 'block', pl: 3, fontWeight: 600 }}>Color: {capitalize(data.color)}</Typography>
            )}
            {data.coverage && (
                <Typography variant="caption" sx={{ display: 'block', pl: 3, fontWeight: 600 }}>Coverage: {capitalize(data.coverage)}</Typography>
            )}
            {data.notes && (
                <Typography variant="caption" sx={{ display: 'block', pl: 3, color: '#5D4037', fontStyle: 'italic', mt: 0.3 }}>
                    "{data.notes}"
                </Typography>
            )}
        </Paper>
    );
};

/* ── Section component ──────────────────────────────────────── */
const Section = ({ title, icon, children }) => (
    <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            {icon}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{title}</Typography>
        </Box>
        {children}
    </Box>
);

/* ── Data row ────────────────────────────────────────────────── */
const DataRow = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, px: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: color || 'text.primary', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</Typography>
    </Box>
);

/* ══════════════════════════════════════════════════════════════ */
export default function ModeratorWaterTests() {
    const { api } = useAuth();

    /* List state */
    const [reports, setReports] = useState([]);
    const [allPending, setAllPending] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    /* Detail state */
    const [selectedReport, setSelectedReport] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    /* Reject dialog */
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectTargetId, setRejectTargetId] = useState(null);

    /* Security dialog */
    const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
    const [securityData, setSecurityData] = useState(null);
    const [securityLoading, setSecurityLoading] = useState(false);

    /* ── Fetch list ─────────────────────────────────────────── */
    const fetchReports = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page, limit: pagination.limit, sort: '-createdAt', completed: 'true',
            });
            if (filters.status) params.set('status', filters.status);
            if (filters.search) params.set('nic', filters.search);
            const { data } = await api.get(`/public-reports-admin?${params}`);
            setReports(data.data.reports || []);
            setPagination(data.data.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, [api, filters.status, filters.search, pagination.limit]);

    /* ── Fetch all pending for sidebar ───────────────────────── */
    const fetchPending = useCallback(async () => {
        try {
            const { data } = await api.get('/public-reports-admin?status=pending&completed=true&limit=100&sort=-createdAt');
            setAllPending(data.data.reports || []);
        } catch { /* silent */ }
    }, [api]);

    useEffect(() => { fetchReports(1); fetchPending(); }, [filters.status, filters.search]);

    /* ── Fetch detail ───────────────────────────────────────── */
    const openDetail = async (id) => {
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const { data } = await api.get(`/public-reports-admin/${id}`);
            setSelectedReport(data.data.report);
        } catch (e) {
            setError('Failed to load report detail');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => { setDrawerOpen(false); setSelectedReport(null); };

    /* ── Moderate actions ───────────────────────────────────── */
    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await api.patch(`/public-reports-admin/${id}/moderate`, { action: 'approve' });
            fetchReports(pagination.page);
            fetchPending();
            if (selectedReport?._id === id) {
                setSelectedReport(prev => ({ ...prev, mod_status: 'approved', approved_at: new Date().toISOString() }));
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const openReject = (id) => { setRejectTargetId(id); setRejectReason(''); setRejectDialogOpen(true); };
    const closeReject = () => { setRejectDialogOpen(false); setRejectTargetId(null); };
    const confirmReject = async () => {
        if (!rejectTargetId || !rejectReason.trim()) return;
        setActionLoading(rejectTargetId);
        try {
            await api.patch(`/public-reports-admin/${rejectTargetId}/moderate`, { action: 'reject', reason: rejectReason.trim() });
            fetchReports(pagination.page);
            fetchPending();
            if (selectedReport?._id === rejectTargetId) {
                setSelectedReport(prev => ({ ...prev, mod_status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: rejectReason.trim() }));
            }
            closeReject();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    /* ── Security actions ───────────────────────────────────── */
    const openSecurity = async (id) => {
        setSecurityDialogOpen(true);
        setSecurityLoading(true);
        setSecurityData(null);
        try {
            const { data } = await api.get(`/public-reports-admin/${id}/security`);
            setSecurityData(data.data.security);
        } catch (e) {
            setError('Failed to load security stats');
            setSecurityDialogOpen(false);
        } finally {
            setSecurityLoading(false);
        }
    };

    const closeSecurity = () => {
        setSecurityDialogOpen(false);
        setSecurityData(null);
    };

    const handleBan = async (type, value) => {
        try {
            await api.post('/public-reports-admin/ban', { type, value, reason: 'Banned from Moderation Panel' });
            // Refresh security stats to reflect the new ban
            if (selectedReport) {
                const { data } = await api.get(`/public-reports-admin/${selectedReport._id}/security`);
                setSecurityData(data.data.security);
            }
        } catch (e) {
            setError(e.response?.data?.message || `Failed to ban ${type.toUpperCase()}`);
        }
    };

    const handleUnban = async (type, value) => {
        try {
            await api.post('/public-reports-admin/unban', { type, value });
            // Refresh security stats to reflect the removal of the ban
            if (selectedReport) {
                const { data } = await api.get(`/public-reports-admin/${selectedReport._id}/security`);
                setSecurityData(data.data.security);
            }
        } catch (e) {
            setError(e.response?.data?.message || `Failed to unban ${type.toUpperCase()}`);
        }
    };

    /* ── Helpers ─────────────────────────────────────────────── */
    const imgPath = (reportId, imageId) => `/public-reports-admin/${reportId}/images/${imageId}`;
    const { page, pages, total } = pagination;

    const r = selectedReport;
    const hasPhotos = r?.images && r.images.length > 0;
    const hasLocation = r?.location?.coordinates?.lat != null && r?.location?.coordinates?.lng != null;
    const hasMiddleCol = hasPhotos || hasLocation;

    /* ── Observations list for detail panel ──────────────────── */
    const observations = r ? [
        { label: 'Smell', data: r.smell },
        { label: 'Taste', data: r.taste },
        { label: 'Sediment', data: r.sediment },
        { label: 'Oil / Grease', data: r.oilGrease },
        { label: 'Foam / Bubbles', data: r.foamBubbles },
        { label: 'Algae', data: r.algae },
        { label: 'Trash / Debris', data: r.trashDebris },
        { label: 'Mud / Silt', data: r.mudSilt },
        { label: 'Insects / Larvae', data: r.insectsLarvae },
        { label: 'Plant Matter', data: r.plantMatter },
        { label: 'Dead Wildlife', data: r.deadWildlife },
        { label: 'Pipe Condition', data: r.pipeCondition },
    ].filter(o => o.data && o.data.detected !== undefined) : [];

    const detectedIssues = observations.filter(o => o.data?.detected === true);
    const undetectedIssues = observations.filter(o => o.data?.detected === false);

    /* ── Advanced tests ──────────────────────────────────────── */
    const advTests = r?.advancedTests ? Object.entries(r.advancedTests).filter(([, v]) => v && v.value != null) : [];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Moderator Panel</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Review public water quality reports, verify data, and approve or reject submissions.
                    </Typography>
                </Box>
                <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={() => { fetchReports(page); fetchPending(); }} sx={{ borderRadius: 2 }}>
                    Refresh
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Filters bar */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Stack direction="row" spacing={1}>
                    {[
                        { label: 'All', value: '', color: '#455A64' },
                        { label: `Pending (${allPending.length})`, value: 'pending', color: STATUS_COLORS.pending },
                        { label: 'Approved', value: 'approved', color: STATUS_COLORS.approved },
                        { label: 'Rejected', value: 'rejected', color: STATUS_COLORS.rejected },
                    ].map(f => (
                        <Chip key={f.value} label={f.label}
                            variant={filters.status === f.value ? 'filled' : 'outlined'}
                            onClick={() => setFilters(p => ({ ...p, status: f.value }))}
                            sx={{
                                fontWeight: 600, borderColor: f.color,
                                ...(filters.status === f.value ? { bgcolor: f.color, color: '#fff' } : { color: f.color }),
                            }}
                        />
                    ))}
                </Stack>
                <TextField
                    size="small" placeholder="Search by NIC..."
                    value={filters.search}
                    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                    sx={{ ml: 'auto', minWidth: 200 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                    }}
                />
            </Paper>

            {/* Reports table */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ p: 3 }}>
                        {[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1.5, borderRadius: 2 }} />)}
                    </Box>
                ) : reports.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>No reports found for current filters.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ overflow: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F8F9FA' }}>
                                    <TableCell sx={{ fontWeight: 700, border: 0, pl: 3 }}>NIC</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Source</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>District</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Method</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Photos</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Date</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, border: 0, pr: 3 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reports.map(rep => (
                                    <TableRow key={rep._id} hover sx={{
                                        cursor: 'pointer', transition: 'background .15s',
                                        '&:hover': { bgcolor: STATUS_BG[rep.mod_status] || '#F5F5F5' },
                                    }} onClick={() => openDetail(rep._id)}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, pl: 3, fontSize: '0.8rem' }}>{rep.nic}</TableCell>
                                        <TableCell>
                                            <Chip label={capitalize(rep.waterSource)} size="small" variant="outlined"
                                                sx={{ fontWeight: 500, borderRadius: 1.5, height: 24, fontSize: '0.7rem' }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{rep.location?.district || '—'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{capitalize(rep.testingMethod)}</TableCell>
                                        <TableCell>
                                            <Chip icon={<CameraAlt sx={{ fontSize: 14 }} />} label={rep.images?.length || 0} size="small"
                                                variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={capitalize(rep.mod_status)} size="small"
                                                sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: STATUS_COLORS[rep.mod_status], color: '#fff', borderRadius: 1.5, height: 24 }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>{fmtDate(rep.createdAt)}</TableCell>
                                        <TableCell align="right" sx={{ pr: 2 }} onClick={(e) => e.stopPropagation()}>
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => openDetail(rep._id)} sx={{ color: '#1565C0' }}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {rep.mod_status !== 'approved' && (
                                                    <Tooltip title="Approve">
                                                        <IconButton size="small" onClick={() => handleApprove(rep._id)}
                                                            disabled={actionLoading === rep._id} sx={{ color: '#2E7D32' }}>
                                                            <ApproveIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {rep.mod_status !== 'rejected' && (
                                                    <Tooltip title="Reject">
                                                        <IconButton size="small" onClick={() => openReject(rep._id)}
                                                            disabled={actionLoading === rep._id} sx={{ color: '#D32F2F' }}>
                                                            <RejectIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}

                {pages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button size="small" startIcon={<ArrowBack />} disabled={page <= 1} onClick={() => fetchReports(page - 1)}>Previous</Button>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            Page {page} of {pages} <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>({total} reports)</Typography>
                        </Typography>
                        <Button size="small" endIcon={<ArrowForward />} disabled={page >= pages} onClick={() => fetchReports(page + 1)}>Next</Button>
                    </Box>
                )}
            </Paper>

            {/* ══════════════════════════════════════════════════ */}
            {/* FULL-SCREEN Detail Drawer                          */}
            {/* ══════════════════════════════════════════════════ */}
            <Drawer anchor="right" open={drawerOpen} onClose={closeDetail}
                PaperProps={{ sx: { width: '100vw' } }}>
                {detailLoading ? (
                    <Box sx={{ p: 4 }}>
                        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Skeleton variant="rounded" width={240} height={500} />
                            <Box sx={{ flex: 1 }}>{[...Array(10)].map((_, i) => <Skeleton key={i} variant="text" height={28} sx={{ mb: 1 }} />)}</Box>
                        </Box>
                    </Box>
                ) : r ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

                        {/* ─── Top bar ──────────────────────────── */}
                        <Box sx={{
                            px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid', borderColor: 'divider',
                            bgcolor: STATUS_BG[r.mod_status] || '#FAFAFA', flexShrink: 0,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton onClick={closeDetail} size="small" sx={{ mr: 0.5 }}><ArrowBack /></IconButton>
                                <Chip label={capitalize(r.mod_status)} size="medium"
                                    sx={{ fontWeight: 700, bgcolor: STATUS_COLORS[r.mod_status], color: '#fff', fontSize: '0.85rem', height: 32, borderRadius: 2 }} />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Report #{r.nic}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Submitted {fmtDateTime(r.createdAt)}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {r.mod_status !== 'approved' && (
                                    <Button variant="contained" startIcon={<ApproveIcon />} color="success" size="small"
                                        onClick={() => handleApprove(r._id)} disabled={actionLoading === r._id}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}>
                                        Approve
                                    </Button>
                                )}
                                {r.mod_status !== 'rejected' && (
                                    <Button variant="outlined" startIcon={<RejectIcon />} color="error" size="small"
                                        onClick={() => openReject(r._id)} disabled={actionLoading === r._id}
                                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}>
                                        Reject
                                    </Button>
                                )}
                                <Button variant="outlined" startIcon={<SecurityIcon />} color="secondary" size="small"
                                    onClick={() => openSecurity(r._id)}
                                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}>
                                    Security
                                </Button>
                                <IconButton onClick={closeDetail}><CloseIcon /></IconButton>
                            </Box>
                        </Box>

                        {/* ─── Body: Pending sidebar | Photos | Data ── */}
                        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                            {/* LEFT — Pending queue sidebar ──────── */}
                            <Box sx={{
                                width: 260, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider',
                                display: 'flex', flexDirection: 'column', bgcolor: '#FAFAFA',
                                overflow: 'hidden',
                            }}>
                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#ED6C02' }}>
                                        <Badge badgeContent={allPending.length} color="warning" sx={{ mr: 1.5 }}>
                                            <WarningIcon sx={{ fontSize: 16 }} />
                                        </Badge>
                                        Pending Queue
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                    {allPending.length === 0 ? (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <ApproveIcon sx={{ fontSize: 36, color: '#C8E6C9', mb: 1 }} />
                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>All caught up!</Typography>
                                        </Box>
                                    ) : (
                                        <List dense disablePadding>
                                            {allPending.map(p => (
                                                <ListItemButton key={p._id}
                                                    selected={r._id === p._id}
                                                    onClick={() => openDetail(p._id)}
                                                    sx={{
                                                        py: 1, px: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                                                        '&.Mui-selected': { bgcolor: '#FFF3E0', borderLeft: '3px solid #ED6C02' },
                                                    }}>
                                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                                        <DotIcon sx={{ fontSize: 10, color: '#ED6C02' }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.nic}</Typography>
                                                        }
                                                        secondary={
                                                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                                                {p.location?.district || '—'} · {capitalize(p.waterSource)}
                                                            </Typography>
                                                        }
                                                    />
                                                    {p.images?.length > 0 && (
                                                        <CameraAlt sx={{ fontSize: 14, color: '#BDBDBD', ml: 0.5 }} />
                                                    )}
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    )}
                                </Box>
                            </Box>

                            {/* MIDDLE — Map & Photos ── */}
                            {hasMiddleCol ? (
                                <Box sx={{
                                    width: { xs: '100%', md: 380 }, flexShrink: 0,
                                    borderRight: '1px solid', borderColor: 'divider',
                                    p: 2, bgcolor: '#F5F5F5', overflow: 'auto',
                                }}>
                                    {hasLocation && (
                                        <Box sx={{ mb: hasPhotos ? 3 : 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MapIcon sx={{ fontSize: 18, color: '#1565C0' }} /> Location Map
                                            </Typography>
                                            <Box sx={{ height: 220, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#E0E0E0' }}>
                                                <MapContainer
                                                    center={[r.location.coordinates.lat, r.location.coordinates.lng]}
                                                    zoom={14}
                                                    style={{ height: '100%', width: '100%' }}
                                                    scrollWheelZoom={false}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                                        attribution='&copy; CARTO'
                                                    />
                                                    <CircleMarker
                                                        center={[r.location.coordinates.lat, r.location.coordinates.lng]}
                                                        radius={6}
                                                        pathOptions={{ fillColor: '#1565C0', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9 }}
                                                    />
                                                </MapContainer>
                                            </Box>
                                        </Box>
                                    )}

                                    {hasPhotos && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CameraAlt sx={{ fontSize: 18 }} /> Photos ({r.images.length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {r.images.map(img => (
                                                    <Box key={img._id} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                                                        <AuthImage api={api} src={imgPath(r._id, img._id)} alt={img.imageType}
                                                            sx={{ width: '100%', display: 'block', maxHeight: 340, objectFit: 'contain', bgcolor: '#EEEEEE' }} />
                                                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Chip label={capitalize(img.imageType)} size="small" variant="outlined"
                                                                sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, borderRadius: 1 }} />
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{fmtDate(img.uploadedAt)}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                /* No photos and no location — inline notice only */
                                null
                            )}

                            {/* RIGHT — Report Data ───────────────── */}
                            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>

                                {/* No photos notice */}
                                {!hasPhotos && (
                                    <Alert severity="info" variant="outlined" icon={<CameraAlt />}
                                        sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
                                        No photos attached to this report.
                                    </Alert>
                                )}

                                {/* Basic info */}
                                <Section title="Water Source & Location" icon={<WaterDrop sx={{ fontSize: 18, color: '#1565C0' }} />}>
                                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <DataRow label="Water Source" value={capitalize(r.waterSource)} color="#1565C0" />
                                        {r.waterSourceOther && <><Divider /><DataRow label="Other Source Detail" value={r.waterSourceOther} /></>}
                                        <Divider />
                                        <DataRow label="District" value={r.location?.district || '—'} />
                                        <Divider />
                                        <DataRow label="City" value={r.location?.city || '—'} />
                                        <Divider />
                                        <DataRow label="Address" value={r.location?.address || '—'} />
                                        {r.location?.coordinates?.lat && (
                                            <><Divider /><DataRow label="GPS" value={`${r.location.coordinates.lat?.toFixed(5)}, ${r.location.coordinates.lng?.toFixed(5)}`} /></>
                                        )}
                                    </Paper>
                                </Section>

                                {/* ═══ WATER SAFETY VERDICT ═══════════════ */}
                                {(() => {
                                    const chemIssues = advTests
                                        .map(([key, val]) => {
                                            const safety = evaluateTestSafety(key, val.value);
                                            if (!safety || safety.severity === 'safe') return null;
                                            return { key, label: ADV_TEST_LABELS[key] || key, severity: safety.severity };
                                        })
                                        .filter(Boolean);

                                    const obsIssuesList = detectedIssues.map(o => ({
                                        key: o.label, label: o.label,
                                        severity: o.data?.severity === 'severe' ? 'danger' : o.data?.severity === 'moderate' ? 'warning' : 'caution',
                                    }));

                                    const visualIssuesList = [];
                                    if (r.appearance?.value && !['clear', 'colorless'].includes(r.appearance.value))
                                        visualIssuesList.push({ key: 'appearance', label: 'Abnormal Appearance', severity: 'caution' });
                                    if (r.turbidity?.value && !['clear'].includes(r.turbidity.value))
                                        visualIssuesList.push({ key: 'turbidity', label: 'Turbidity', severity: ['very_cloudy', 'opaque'].includes(r.turbidity.value) ? 'danger' : 'caution' });

                                    const allIssues = [...chemIssues, ...obsIssuesList, ...visualIssuesList];
                                    const dangerCount = allIssues.filter(i => i.severity === 'danger').length;
                                    const warningCount = allIssues.filter(i => i.severity === 'warning').length;
                                    const cautionCount = allIssues.filter(i => i.severity === 'caution').length;
                                    const isSafe = allIssues.length === 0;
                                    const isUnsafe = dangerCount > 0 || warningCount > 0;

                                    // Top concern names (max 3)
                                    const topConcerns = allIssues
                                        .sort((a, b) => ({ danger: 0, warning: 1, caution: 2 }[a.severity] ?? 3) - ({ danger: 0, warning: 1, caution: 2 }[b.severity] ?? 3))
                                        .slice(0, 3)
                                        .map(i => i.label);

                                    return (
                                        <Paper elevation={0} sx={{
                                            p: 2.5, mb: 2, borderRadius: 3,
                                            bgcolor: isSafe ? '#E8F5E9' : isUnsafe ? '#FFEBEE' : '#FFF8E1',
                                            border: '2px solid',
                                            borderColor: isSafe ? '#66BB6A' : isUnsafe ? '#EF5350' : '#FFB300',
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                {isSafe ? (
                                                    <ApproveIcon sx={{ fontSize: 36, color: '#2E7D32' }} />
                                                ) : (
                                                    <WarningIcon sx={{ fontSize: 36, color: isUnsafe ? '#C62828' : '#F57F17' }} />
                                                )}
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: isSafe ? '#1B5E20' : isUnsafe ? '#B71C1C' : '#E65100', lineHeight: 1.3 }}>
                                                        {isSafe ? '✓ Safe for Consumption' : isUnsafe ? '✕ NOT Safe for Consumption' : '⚠ Use with Caution'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: isSafe ? '#388E3C' : 'text.secondary', mt: 0.3, fontSize: '0.8rem' }}>
                                                        {isSafe
                                                            ? 'All tested parameters are within WHO safe drinking water limits.'
                                                            : `${allIssues.length} issue${allIssues.length !== 1 ? 's' : ''} found${topConcerns.length > 0 ? `: ${topConcerns.join(', ')}` : ''}`
                                                        }
                                                    </Typography>
                                                    {!isSafe && (
                                                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.8 }}>
                                                            {dangerCount > 0 && <Chip label={`${dangerCount} Danger`} size="small" sx={{ height: 20, fontSize: '0.63rem', fontWeight: 700, bgcolor: '#C62828', color: '#fff' }} />}
                                                            {warningCount > 0 && <Chip label={`${warningCount} Warning`} size="small" sx={{ height: 20, fontSize: '0.63rem', fontWeight: 700, bgcolor: '#E65100', color: '#fff' }} />}
                                                            {cautionCount > 0 && <Chip label={`${cautionCount} Caution`} size="small" sx={{ height: 20, fontSize: '0.63rem', fontWeight: 700, bgcolor: '#F9A825', color: '#333' }} />}
                                                        </Stack>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                })()}

                                {/* Water characteristics */}
                                <Section title="Water Characteristics" icon={<InfoIcon sx={{ fontSize: 18, color: '#0097A7' }} />}>
                                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <DataRow label="Appearance" value={capitalize(r.appearance?.value)} />
                                        {r.appearance?.notes && <><Divider /><DataRow label="Appearance Notes" value={r.appearance.notes} /></>}
                                        <Divider />
                                        <DataRow label="Turbidity" value={capitalize(r.turbidity?.value)} />
                                        <Divider />
                                        <DataRow label="Water Flow" value={capitalize(r.waterFlow)} />
                                        <Divider />
                                        <DataRow label="Temperature" value={capitalize(r.temperature)} />
                                        <Divider />
                                        <DataRow label="Testing Method" value={capitalize(r.testingMethod)} color="#7B1FA2" />
                                    </Paper>
                                </Section>

                                {/* Observations — detected issues expanded */}
                                {observations.length > 0 && (
                                    <Section
                                        title={`Observations — ${detectedIssues.length} issue${detectedIssues.length !== 1 ? 's' : ''} detected`}
                                        icon={<WarningIcon sx={{ fontSize: 18, color: detectedIssues.length > 0 ? '#E65100' : '#BDBDBD' }} />}
                                    >
                                        {detectedIssues.length > 0 && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                                                {detectedIssues.map(o => <ObsCard key={o.label} label={o.label} data={o.data} />)}
                                            </Box>
                                        )}
                                        {undetectedIssues.length > 0 && (
                                            <Paper variant="outlined" sx={{ borderRadius: 2, p: 0.5 }}>
                                                {undetectedIssues.map(o => <ObsCard key={o.label} label={o.label} data={o.data} />)}
                                            </Paper>
                                        )}
                                    </Section>
                                )}

                                {/* Advanced tests — with safety status */}
                                {advTests.length > 0 && (
                                    <Section title="Advanced Test Results" icon={<Science sx={{ fontSize: 18, color: '#7B1FA2' }} />}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {advTests.map(([key, val]) => {
                                                const safety = evaluateTestSafety(key, val.value);
                                                const sev = safety || { severity: 'safe', ...ISSUE_SEVERITY.safe };
                                                const isMetal = HEAVY_METALS.includes(key);
                                                return (
                                                    <Paper key={key} variant="outlined" sx={{
                                                        p: 1.5, borderRadius: 2,
                                                        borderColor: sev.severity !== 'safe' ? sev.color + '55' : 'divider',
                                                        bgcolor: sev.severity !== 'safe' ? sev.bg : '#FAFAFA',
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography sx={{ fontSize: 14 }}>{sev.severity !== 'safe' ? sev.icon : '✓'}</Typography>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem', color: sev.severity !== 'safe' ? sev.color : 'text.primary' }}>
                                                                        {isMetal ? '☢ ' : ''}{ADV_TEST_LABELS[key] || key}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: sev.color, ml: 'auto', fontSize: '0.85rem' }}>
                                                                        {val.value} {val.unit || safety?.threshold?.unit || ''}
                                                                    </Typography>
                                                                    <Chip label={capitalize(sev.severity)} size="small"
                                                                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: sev.color, color: '#fff', minWidth: 55 }} />
                                                                </Box>
                                                                {safety?.threshold && (
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.63rem' }}>
                                                                        Safe range: {safety.threshold.safe[0]}–{safety.threshold.safe[1]} {safety.threshold.unit} — {safety.threshold.desc}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                );
                                            })}
                                        </Box>
                                    </Section>
                                )}

                                {/* Contact */}
                                {(r.email || r.phone) && (
                                    <Section title="Contact Info" icon={<Person sx={{ fontSize: 18, color: '#455A64' }} />}>
                                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                            {r.email && <DataRow label="Email" value={r.email} />}
                                            {r.email && r.phone && <Divider />}
                                            {r.phone && <DataRow label="Phone" value={r.phone} />}
                                        </Paper>
                                    </Section>
                                )}

                                {/* Moderation info */}
                                <Section title="Moderation Info" icon={<AccessTime sx={{ fontSize: 18, color: '#455A64' }} />}>
                                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                        <DataRow label="Status" value={capitalize(r.mod_status)} color={STATUS_COLORS[r.mod_status]} />
                                        <Divider />
                                        <DataRow label="Completed At" value={fmtDateTime(r.completedAt)} />
                                        {r.approved_at && <><Divider /><DataRow label="Approved At" value={fmtDateTime(r.approved_at)} color="#2E7D32" /></>}
                                        {r.rejected_at && <><Divider /><DataRow label="Rejected At" value={fmtDateTime(r.rejected_at)} color="#D32F2F" /></>}
                                        {r.rejection_reason && <><Divider /><DataRow label="Rejection Reason" value={r.rejection_reason} color="#D32F2F" /></>}
                                    </Paper>
                                </Section>
                            </Box>
                        </Box>
                    </Box>
                ) : null}
            </Drawer>

            {/* ── Reject Dialog ──────────────────────────────── */}
            <Dialog open={rejectDialogOpen} onClose={closeReject} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Reject Report</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Please provide a reason for rejecting this water quality report.
                    </Typography>
                    <TextField
                        autoFocus fullWidth multiline minRows={3}
                        label="Rejection reason" placeholder="e.g., Insufficient evidence, suspicious data..."
                        value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={closeReject} sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={confirmReject} color="error" variant="contained" disabled={!rejectReason.trim()}
                        sx={{ borderRadius: 2, fontWeight: 700 }}>
                        Reject Report
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Security Dialog ────────────────────────────── */}
            <Dialog open={securityDialogOpen} onClose={closeSecurity} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ color: '#9C27B0' }} /> Security & Moderation
                </DialogTitle>
                <DialogContent>
                    {securityLoading ? (
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
                        </Box>
                    ) : securityData ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <Box sx={{ p: 1.5, bgcolor: '#F3E5F5', borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6A1B9A' }}>Submitter Overview</Typography>
                                </Box>
                                <Box sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>NIC</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{securityData.nic}</Typography>
                                            {securityData.isNicBanned ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip label="Banned" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                    <Button size="small" variant="outlined" color="success" sx={{ minWidth: 0, p: '2px 8px', fontSize: '0.7rem' }}
                                                        onClick={() => handleUnban('nic', securityData.nic)}>
                                                        Unban
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button size="small" variant="contained" color="error" sx={{ minWidth: 0, p: '2px 8px', fontSize: '0.7rem' }}
                                                    onClick={() => handleBan('nic', securityData.nic)}>
                                                    Ban NIC
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>IP Address</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{securityData.ipAddress}</Typography>
                                            {securityData.ipAddress !== 'Unknown' && (
                                                securityData.isIpBanned ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Chip label="Banned" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                        <Button size="small" variant="outlined" color="success" sx={{ minWidth: 0, p: '2px 8px', fontSize: '0.7rem' }}
                                                            onClick={() => handleUnban('ip', securityData.ipAddress)}>
                                                            Unban
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <Button size="small" variant="contained" color="error" sx={{ minWidth: 0, p: '2px 8px', fontSize: '0.7rem' }}
                                                        onClick={() => handleBan('ip', securityData.ipAddress)}>
                                                        Ban IP
                                                    </Button>
                                                )
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>

                            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <Box sx={{ p: 1.5, bgcolor: '#E3F2FD', borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1565C0' }}>Submission Activity</Typography>
                                </Box>
                                <Box sx={{ p: 2 }}>
                                    <DataRow label="Total Submissions (Life)" value={securityData.totalSubmissions} />
                                    <Divider sx={{ my: 0.5 }} />
                                    <DataRow label="Submissions Today" value={securityData.submissionsToday} color={securityData.submissionsToday > 5 ? '#D32F2F' : 'text.primary'} />
                                    <Divider sx={{ my: 0.5 }} />
                                    <DataRow label="Submissions (Last 1 Hour)" value={securityData.submissionsLastHour} color={securityData.submissionsLastHour > 3 ? '#D32F2F' : 'text.primary'} />
                                </Box>
                            </Paper>

                            {(securityData.submissionsToday > 10 || securityData.submissionsLastHour > 5) && (
                                <Alert severity="warning" icon={<BlockIcon />} sx={{ borderRadius: 2 }}>
                                    High submission volume detected for this user. Monitor for spam.
                                </Alert>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">No security data available.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#FAFAFA' }}>
                    <Button onClick={closeSecurity} sx={{ borderRadius: 2, fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Paper, Typography, Card, CardActionArea, Chip,
    Alert, Table, TableBody, TableCell, TableHead,
    TableRow, Skeleton, LinearProgress, Divider,
} from '@mui/material';
import {
    Gavel as GavelIcon, ListAlt as ListAltIcon,
    Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon,
    People as PeopleIcon, PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Legend, Treemap,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Palette ──────────────────────────────────────────────────── */
const COLORS = ['#1565C0', '#2E7D32', '#ED6C02', '#D32F2F', '#7B1FA2', '#0097A7', '#F57C00', '#455A64', '#C62828', '#1B5E20', '#FF6F00', '#00695C'];
const SOURCE_COLORS = { well: '#1565C0', river: '#0097A7', lake: '#00838F', tap: '#42A5F5', tank: '#7B1FA2', canal: '#455A64', spring: '#2E7D32', rainwater: '#4FC3F7', borehole: '#5D4037', other: '#9E9E9E' };
const STATUS_COLORS = { pending: '#ED6C02', approved: '#2E7D32', rejected: '#D32F2F' };
const METHOD_LABELS = { observation: 'Observation', test_strips: 'Test Strips', lab_kit: 'Lab Kit', professional_lab: 'Professional Lab' };
const METHOD_COLORS = { observation: '#42A5F5', test_strips: '#66BB6A', lab_kit: '#FFA726', professional_lab: '#AB47BC' };

/* ── Shared ───────────────────────────────────────────────────── */
const paper = { p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', boxSizing: 'border-box' };
const Empty = ({ msg = 'No data yet' }) => (
    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>{msg}</Typography>
);

/* ── Skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
    const Sk = Skeleton;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                {[1, 2, 3].map(i => <Sk key={i} variant="rounded" height={72} sx={{ borderRadius: 3 }} />)}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                {[1, 2, 3, 4].map(i => (
                    <Paper key={i} sx={{ ...paper, textAlign: 'center' }}>
                        <Sk variant="circular" width={28} height={28} sx={{ mx: 'auto', mb: 1 }} />
                        <Sk variant="text" width={50} height={36} sx={{ mx: 'auto' }} />
                        <Sk variant="text" width={70} sx={{ mx: 'auto' }} />
                    </Paper>
                ))}
            </Box>
            <Sk variant="rounded" height={300} sx={{ borderRadius: 3 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Sk variant="rounded" height={320} sx={{ borderRadius: 3 }} />
                <Sk variant="rounded" height={320} sx={{ borderRadius: 3 }} />
            </Box>
            <Sk variant="rounded" height={350} sx={{ borderRadius: 3 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                <Sk variant="rounded" height={280} sx={{ borderRadius: 3 }} />
                <Sk variant="rounded" height={280} sx={{ borderRadius: 3 }} />
                <Sk variant="rounded" height={280} sx={{ borderRadius: 3 }} />
            </Box>
            <Sk variant="rounded" height={260} sx={{ borderRadius: 3 }} />
        </Box>
    );
}

/* ── Map Markers Layer ────────────────────────────────────────── */
function MapMarkers({ bubbles, points, maxBubble, zoomThreshold = 9 }) {
    const [zoomLevel, setZoomLevel] = useState(8);
    const map = useMapEvents({
        zoomend: () => setZoomLevel(map.getZoom()),
    });

    useEffect(() => {
        setZoomLevel(map.getZoom());
    }, [map]);

    const isZoomedIn = zoomLevel >= zoomThreshold;

    if (isZoomedIn && points && points.length > 0) {
        return points.map((p, i) => (
            <CircleMarker key={`point-${i}`} center={[p.lat, p.lng]} radius={5}
                pathOptions={{
                    fillColor: SOURCE_COLORS[p.waterSource] || '#1565C0',
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.9
                }}>
                <Popup>
                    <div style={{ textAlign: 'center', minWidth: 120 }}>
                        <strong style={{ fontSize: 14, textTransform: 'capitalize' }}>{p.waterSource || 'Unknown'} Source</strong><br />
                        <span style={{ fontSize: 12, color: '#666' }}>{p.district || 'Unknown Location'}</span><br />
                        <Box sx={{ mt: 1 }}>
                            <Chip label={p.mod_status || 'pending'} size="small" sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize', bgcolor: STATUS_COLORS[p.mod_status] || '#999', color: '#fff' }} />
                        </Box>
                    </div>
                </Popup>
            </CircleMarker>
        ));
    }

    return bubbles.map((b, i) => {
        const ratio = b.count / maxBubble;
        const radius = 14 + ratio * 28;
        const opacity = 0.4 + ratio * 0.45;
        return (
            <CircleMarker key={`bubble-${i}`} center={[b.lat, b.lng]} radius={radius}
                pathOptions={{ fillColor: '#1565C0', color: '#0D47A1', weight: 1.5, opacity: 0.5, fillOpacity: opacity }}>
                <Popup>
                    <div style={{ textAlign: 'center', minWidth: 110 }}>
                        <strong style={{ fontSize: 14 }}>{b.name}</strong><br />
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#1565C0' }}>{b.count}</span><br />
                        <span style={{ fontSize: 11, color: '#666' }}>report{b.count > 1 ? 's' : ''}</span>
                    </div>
                </Popup>
            </CircleMarker>
        );
    });
}

/* ══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentReports, setRecentReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [s, r] = await Promise.all([
                    api.get('/public-reports-admin/stats'),
                    api.get('/public-reports-admin?limit=5&sort=-createdAt&completed=true'),
                ]);
                setStats(s.data.data);
                setRecentReports(r.data.data.reports || []);
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

    const {
        overview, byStatus, bySource, byDistrict, dailySubmissions,
        totalImages, testingMethods, observationFreqs, mapPoints, weeklyTrend,
        turbidityLevels, appearanceDist, hourlyPattern, photoStats, waterFlowDist,
    } = stats;

    /* Prep chart data */
    const statusData = Object.entries(byStatus || {}).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: STATUS_COLORS[k] || '#666',
    }));
    const sourceData = (bySource || []).map((s, i) => ({
        name: (s._id || 'other').replace(/^\w/, c => c.toUpperCase()), count: s.count,
        fill: SOURCE_COLORS[s._id] || COLORS[i % COLORS.length],
    }));
    const districtData = (byDistrict || []).slice(0, 10);
    const dailyData = (dailySubmissions || []).map(d => ({ date: d._id?.slice(5) || '', count: d.count }));
    const weeklyData = (weeklyTrend || []).map(w => ({ week: w._id?.replace(/^\d{4}-/, '') || '', count: w.count }));
    const methodData = (testingMethods || []).map(m => ({
        name: METHOD_LABELS[m._id] || m._id, value: m.count, color: METHOD_COLORS[m._id] || '#666',
    }));
    const obsData = (observationFreqs || []).map((o, i) => ({
        name: o._id, count: o.count, fill: COLORS[i % COLORS.length],
    }));
    const treemapData = sourceData.map(s => ({ name: s.name, size: s.count, fill: s.fill }));

    const completionRate = overview.total > 0 ? Math.round((overview.completed / overview.total) * 100) : 0;
    const approvalRate = overview.completed > 0 ? Math.round(((byStatus?.approved || 0) / overview.completed) * 100) : 0;
    const radialData = [
        { name: 'Completion', value: completionRate, fill: '#1565C0' },
        { name: 'Approval', value: approvalRate, fill: '#2E7D32' },
    ];

    /* NEW chart data */
    const TURBIDITY_COLORS = { clear: '#4FC3F7', slightly_cloudy: '#81D4FA', cloudy: '#FFB74D', very_cloudy: '#FF8A65', opaque: '#A1887F' };
    const APPEARANCE_COLORS = { clear: '#42A5F5', murky: '#8D6E63', brown: '#A1887F', green: '#66BB6A', yellow: '#FFCA28', red: '#EF5350', black: '#616161', white: '#E0E0E0' };
    const FLOW_COLORS = { still: '#90CAF9', slow: '#42A5F5', moderate: '#1E88E5', fast: '#1565C0', flooding: '#C62828' };

    const turbidityData = (turbidityLevels || []).map((t, i) => ({
        name: (t._id || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
        count: t.count,
        fill: TURBIDITY_COLORS[t._id] || COLORS[i % COLORS.length],
    }));
    const appearanceData = (appearanceDist || []).map((a, i) => ({
        name: (a._id || '').replace(/^\w/, c => c.toUpperCase()),
        value: a.count,
        color: APPEARANCE_COLORS[a._id] || COLORS[i % COLORS.length],
    }));
    const hourlyData = Array.from({ length: 24 }, (_, h) => {
        const found = (hourlyPattern || []).find(p => p._id === h);
        return { hour: `${String(h).padStart(2, '0')}:00`, count: found?.count || 0 };
    });
    const photoData = (photoStats || []).map(p => ({
        name: p._id ? 'With Photos' : 'No Photos',
        value: p.count,
        color: p._id ? '#1565C0' : '#E0E0E0',
    }));
    const flowData = (waterFlowDist || []).map((f, i) => ({
        name: (f._id || '').replace(/^\w/, c => c.toUpperCase()),
        value: f.count,
        color: FLOW_COLORS[f._id] || COLORS[i % COLORS.length],
    }));

    /* Sri Lankan district center coordinates */
    const SL_DISTRICT_COORDS = {
        colombo: [6.9271, 79.8612], gampaha: [7.0840, 80.0098], kalutara: [6.5854, 80.1140],
        kandy: [7.2906, 80.6337], matale: [7.4675, 80.6234], 'nuwara eliya': [6.9497, 80.7891],
        galle: [6.0535, 80.2210], matara: [5.9549, 80.5550], hambantota: [6.1429, 81.1212],
        jaffna: [9.6615, 80.0255], kilinochchi: [9.3803, 80.3770], mannar: [8.9810, 79.9044],
        mullaitivu: [9.2671, 80.5814], vavuniya: [8.7514, 80.4971],
        trincomalee: [8.5874, 81.2152], batticaloa: [7.7310, 81.6747], ampara: [7.2916, 81.6724],
        kurunegala: [7.4863, 80.3647], puttalam: [8.0362, 79.8283],
        anuradhapura: [8.3114, 80.4037], polonnaruwa: [7.9403, 81.0188],
        badulla: [6.9934, 81.0550], monaragala: [6.8728, 81.3507],
        ratnapura: [6.6828, 80.4020], kegalle: [7.2513, 80.3464],
    };
    const SL_BOUNDS = [[5.7, 79.2], [10.0, 82.2]]; // SW → NE corners of Sri Lanka
    const SL_CENTER = [7.85, 80.65];

    /* Build map bubbles from byDistrict data (always available) */
    const mapBubbles = (byDistrict || []).map(d => {
        const name = d._id || 'Unknown';
        const key = name.toLowerCase().trim();
        const coords = SL_DISTRICT_COORDS[key];
        if (!coords) return null;
        return { name, count: d.count, lat: coords[0], lng: coords[1] };
    }).filter(Boolean);
    const maxBubble = Math.max(...mapBubbles.map(b => b.count), 1);

    const navCards = [
        { title: 'Moderator Panel', desc: 'Review & moderate', icon: <GavelIcon sx={{ fontSize: 26, color: '#1565C0' }} />, path: '/moderator/water-tests', bg: '#E3F2FD' },
        { title: 'Moderation Logs', desc: 'Audit trail', icon: <ListAltIcon sx={{ fontSize: 26, color: '#2E7D32' }} />, path: '/moderation/logs', bg: '#E8F5E9' },
    ];

    const kpis = [
        { icon: <AssessmentIcon />, value: overview.total, label: 'Total Reports', color: '#1565C0' },
        { icon: <TrendingUpIcon />, value: overview.completed, label: 'Completed', color: '#2E7D32' },
        { icon: <PeopleIcon />, value: overview.inProgress, label: 'In Progress', color: '#ED6C02' },
        { icon: <PhotoIcon />, value: totalImages, label: 'Photos', color: '#7B1FA2' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

            {/* ─── Nav Cards ────────────────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                {navCards.map(c => (
                    <Card key={c.title} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'border-color .2s', '&:hover': { borderColor: 'primary.main' } }}>
                        <CardActionArea onClick={() => navigate(c.path)} sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{c.title}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.desc}</Typography>
                            </Box>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>

            {/* ─── KPI Cards ───────────────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                {kpis.map(k => (
                    <Paper key={k.label} elevation={0} sx={{ ...paper, textAlign: 'center', py: 2.5 }}>
                        <Box sx={{ color: k.color, mb: 0.5 }}>{k.icon}</Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{k.label}</Typography>
                    </Paper>
                ))}
            </Box>

            {/* ─── Daily Submissions ───────────────────────── */}
            <Paper elevation={0} sx={paper}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>📈 Daily Submissions — Last 30 Days</Typography>
                {dailyData.length > 0 ? (
                    <Box sx={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                                <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1565C0" stopOpacity={0.18} /><stop offset="100%" stopColor="#1565C0" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#BDBDBD" />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#BDBDBD" />
                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                                <Area type="monotone" dataKey="count" stroke="#1565C0" strokeWidth={2.5} fill="url(#areaGrad)" name="Submissions" dot={{ r: 3, fill: '#1565C0' }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                ) : <Empty msg="No submissions in the last 30 days" />}
            </Paper>

            {/* ─── Bubble Map (Sri Lanka, by district) ────── */}
            <Paper elevation={0} sx={paper}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>🗺️ Submission Density — Sri Lanka</Typography>
                <Box sx={{ width: '100%', height: 480, borderRadius: 2, overflow: 'hidden', bgcolor: '#F0F4F8' }}>
                    <MapContainer
                        center={SL_CENTER} zoom={8}
                        minZoom={7} maxZoom={16}
                        maxBounds={SL_BOUNDS} maxBoundsViscosity={1.0}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                        />
                        <MapMarkers bubbles={mapBubbles} points={mapPoints || []} maxBubble={maxBubble} />
                    </MapContainer>
                </Box>
                {mapBubbles.length === 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                        No district data yet. Bubbles will appear as reports are submitted.
                    </Typography>
                )}
            </Paper>

            {/* ─── Status + Testing Method ──────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'stretch' }}>
                {/* Moderation status */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>🛡️ Moderation Status</Typography>
                    {statusData.length > 0 ? (
                        <>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value">
                                        {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} /></PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                {statusData.map(s => (
                                    <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{s.name}: {s.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : <Empty />}
                </Paper>

                {/* Testing method */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>🧪 Testing Method</Typography>
                    {methodData.length > 0 ? (
                        <>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart><Pie data={methodData} cx="50%" cy="50%" outerRadius={78} paddingAngle={3} dataKey="value">
                                        {methodData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} /></PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                {methodData.map(m => (
                                    <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: m.color, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{m.name}: {m.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : <Empty />}
                </Paper>
            </Box>

            {/* ─── Observation Issues (What people report most) ── */}
            <Paper elevation={0} sx={paper}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>⚠️ Most Reported Issues</Typography>
                {obsData.length > 0 ? (
                    <Box sx={{ width: '100%', height: Math.max(240, obsData.length * 34) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={obsData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 12, fontWeight: 500 }} />
                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} name="Reports">
                                    {obsData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                ) : <Empty />}
            </Paper>

            {/* ─── Water Source + Rates + Weekly ─────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'stretch' }}>
                {/* Source Treemap */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>💧 Source Distribution</Typography>
                    {treemapData.length > 0 ? (
                        <Box sx={{ flex: 1, width: '100%', minHeight: 220 }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <Treemap data={treemapData} dataKey="size" nameKey="name" aspectRatio={4 / 3} stroke="#fff" strokeWidth={2}
                                    content={({ x, y, width, height, name, fill }) => (
                                        <g>
                                            <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
                                            {width > 45 && height > 20 && (
                                                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={11} fontWeight={600}>{name}</text>
                                            )}
                                        </g>
                                    )}>
                                    {treemapData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Treemap>
                            </ResponsiveContainer>
                        </Box>
                    ) : <Empty />}
                </Paper>

                {/* Rates gauge */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, alignSelf: 'flex-start', width: '100%' }}>📊 Completion & Approval</Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={180}>
                            <RadialBarChart cx="50%" cy="55%" innerRadius="30%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0} barSize={16}>
                                <RadialBar background={{ fill: '#F0F0F0' }} dataKey="value" cornerRadius={8} label={{ position: 'insideStart', fill: '#fff', fontWeight: 700, fontSize: 12 }} />
                                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 600, bottom: -5 }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1565C0' }}>{completionRate}%</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Completion</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2E7D32' }}>{approvalRate}%</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Approval</Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Weekly trend */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>� Weekly Trend (12 wk)</Typography>
                    {weeklyData.length > 0 ? (
                        <Box sx={{ flex: 1, width: '100%', minHeight: 200 }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                                    <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#BDBDBD" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#BDBDBD" />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                                    <Bar dataKey="count" fill="#7B1FA2" radius={[4, 4, 0, 0]} barSize={22} name="Submissions" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : <Empty />}
                </Paper>
            </Box>

            {/* ─── Turbidity + Appearance + Flow ─────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'stretch' }}>
                {/* Turbidity levels */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>🌊 Turbidity Levels</Typography>
                    {turbidityData.length > 0 ? (
                        <Box sx={{ flex: 1, width: '100%', minHeight: 180 }}>
                            <ResponsiveContainer width="100%" height={Math.max(180, turbidityData.length * 36)}>
                                <BarChart data={turbidityData} layout="vertical" margin={{ top: 0, right: 15, left: 5, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fontWeight: 500 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16} name="Reports">
                                        {turbidityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : <Empty />}
                </Paper>

                {/* Water appearance */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>👁️ Water Appearance</Typography>
                    {appearanceData.length > 0 ? (
                        <>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart><Pie data={appearanceData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                                        {appearanceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} /></PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                {appearanceData.map(a => (
                                    <Box key={a.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: a.color, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{a.name}: {a.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : <Empty />}
                </Paper>

                {/* Water flow */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>🌀 Water Flow</Typography>
                    {flowData.length > 0 ? (
                        <>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart><Pie data={flowData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                                        {flowData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} /></PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                {flowData.map(f => (
                                    <Box key={f.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: f.color, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{f.name}: {f.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : <Empty />}
                </Paper>
            </Box>

            {/* ─── Hourly Pattern + Photo Coverage ────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'stretch' }}>
                {/* Hourly submission pattern */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>🕐 Submission Time Pattern</Typography>
                    <Box sx={{ flex: 1, width: '100%', minHeight: 220 }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                                <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="#BDBDBD" interval={1} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#BDBDBD" />
                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                                <Bar dataKey="count" fill="#0097A7" radius={[3, 3, 0, 0]} barSize={14} name="Submissions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                {/* Photo coverage */}
                <Paper elevation={0} sx={{ ...paper, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>📷 Photo Coverage</Typography>
                    {photoData.length > 0 ? (
                        <>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart><Pie data={photoData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value">
                                        {photoData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} /></PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                                {photoData.map(p => (
                                    <Box key={p.name} sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: p.color === '#E0E0E0' ? 'text.secondary' : p.color }}>{p.value}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{p.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </>
                    ) : <Empty />}
                </Paper>
            </Box>

            {/* ─── District Table ───────────────────────────── */}
            <Paper elevation={0} sx={paper}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>�📍 Top Reporting Districts</Typography>
                {districtData.length > 0 ? (
                    <Box sx={{ overflow: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, border: 0, width: 40 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>District</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, border: 0, width: 80 }}>Count</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0, width: '40%' }}>Share</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {districtData.map((d, i) => {
                                    const max = districtData[0]?.count || 1;
                                    const pct = overview.completed > 0 ? Math.round((d.count / overview.completed) * 100) : 0;
                                    return (
                                        <TableRow key={d._id} sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{i + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{d._id}</TableCell>
                                            <TableCell align="right">
                                                <Chip label={d.count} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress variant="determinate" value={(d.count / max) * 100}
                                                        sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#F0F0F0', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: COLORS[i % COLORS.length] } }} />
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 30, textAlign: 'right' }}>{pct}%</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Box>
                ) : <Empty />}
            </Paper>

            {/* ─── Recent Submissions ───────────────────────── */}
            <Paper elevation={0} sx={paper}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>🕒 Recent Submissions</Typography>
                {recentReports.length > 0 ? (
                    <Box sx={{ overflow: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>NIC</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Source</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>District</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, border: 0 }}>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recentReports.map(r => (
                                    <TableRow key={r._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{r.nic}</TableCell>
                                        <TableCell><Chip label={r.waterSource || '—'} size="small" variant="outlined" sx={{ fontWeight: 500, textTransform: 'capitalize' }} /></TableCell>
                                        <TableCell>{r.location?.district || '—'}</TableCell>
                                        <TableCell>
                                            <Chip label={r.mod_status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize', bgcolor: STATUS_COLORS[r.mod_status] || '#999', color: '#fff' }} />
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                ) : <Empty msg="No completed submissions yet" />}
            </Paper>
        </Box>
    );
}

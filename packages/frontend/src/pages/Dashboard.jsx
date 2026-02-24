import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Grid, Paper, Typography, Card, CardActionArea, Chip,
    CircularProgress, Alert, Table, TableBody, TableCell, TableHead,
    TableRow, Skeleton,
} from '@mui/material';
import {
    Gavel as GavelIcon,
    ListAlt as ListAltIcon,
    Science as ScienceIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    PhotoCamera as PhotoIcon,
    CheckCircle as ApprovedIcon,
    HourglassEmpty as PendingIcon,
    Cancel as RejectedIcon,
    WaterDrop as WaterDropIcon,
} from '@mui/icons-material';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#1565C0', '#2E7D32', '#ED6C02', '#D32F2F', '#7B1FA2', '#0097A7', '#F57C00', '#455A64', '#C62828', '#1B5E20'];

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#ED6C02', icon: <PendingIcon /> },
    approved: { label: 'Approved', color: '#2E7D32', icon: <ApprovedIcon /> },
    rejected: { label: 'Rejected', color: '#D32F2F', icon: <RejectedIcon /> },
};

export default function Dashboard() {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/public-reports-admin/stats');
            setStats(data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Skeleton variant="rounded" height={100} />
                        </Grid>
                    ))}
                </Grid>
                <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
                    <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
                </Grid>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
    }

    const { overview, byStatus, bySource, byDistrict, dailySubmissions, totalImages } = stats;

    // Prepare chart data
    const statusData = Object.entries(byStatus).map(([key, count]) => ({
        name: STATUS_CONFIG[key]?.label || key,
        value: count,
        color: STATUS_CONFIG[key]?.color || '#666',
    }));

    const sourceData = (bySource || []).map((s, i) => ({
        name: s._id?.charAt(0).toUpperCase() + s._id?.slice(1) || 'Unknown',
        count: s.count,
        fill: COLORS[i % COLORS.length],
    }));

    const districtData = (byDistrict || []).slice(0, 10).map((d) => ({
        name: d._id || 'Unknown',
        count: d.count,
    }));

    const dailyData = (dailySubmissions || []).map((d) => ({
        date: d._id?.slice(5) || '', // MM-DD
        count: d.count,
    }));

    // Nav cards
    const navCards = [
        { title: 'Moderator Panel', desc: 'Review and moderate reports', icon: <GavelIcon sx={{ fontSize: 32, color: '#1565C0' }} />, path: '/moderator/water-tests', color: '#E3F2FD' },
        { title: 'Moderation Logs', desc: 'View moderation history', icon: <ListAltIcon sx={{ fontSize: 32, color: '#2E7D32' }} />, path: '/moderation/logs', color: '#E8F5E9' },
        { title: 'Laboratory', desc: 'Manage lab reports', icon: <ScienceIcon sx={{ fontSize: 32, color: '#7B1FA2' }} />, path: '/laboratory', color: '#F3E5F5' },
    ];

    return (
        <Box>
            {/* Quick Nav Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {navCards.map((card) => (
                    <Grid item xs={12} sm={4} key={card.title}>
                        <Card sx={{ borderRadius: 3, '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}>
                            <CardActionArea onClick={() => navigate(card.path)} sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {card.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{card.title}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{card.desc}</Typography>
                                    </Box>
                                </Box>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
                        <AssessmentIcon sx={{ fontSize: 28, color: '#1565C0', mb: 0.5 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A2027' }}>{overview.total}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Reports</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
                        <TrendingUpIcon sx={{ fontSize: 28, color: '#2E7D32', mb: 0.5 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2E7D32' }}>{overview.completed}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Completed</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 28, color: '#ED6C02', mb: 0.5 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#ED6C02' }}>{overview.inProgress}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>In Progress</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
                        <PhotoIcon sx={{ fontSize: 28, color: '#7B1FA2', mb: 0.5 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#7B1FA2' }}>{totalImages}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Photos Uploaded</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Daily Submissions Chart */}
            {dailyData.length > 0 && (
                <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        📈 Daily Submissions (Last 30 Days)
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={dailyData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9E9E9E" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9E9E9E" />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #E8ECF0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#1565C0" strokeWidth={2.5}
                                fill="url(#colorCount)" name="Submissions" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Paper>
            )}

            {/* Status + Water Source Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Moderation Status Pie */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            🛡️ Moderation Status
                        </Typography>
                        {statusData.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                            paddingAngle={4} dataKey="value" nameKey="name"
                                            label={({ name, value }) => `${name}: ${value}`}
                                            labelLine={{ stroke: '#999', strokeWidth: 1 }}>
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                    {statusData.map((s) => (
                                        <Chip key={s.name} label={`${s.name}: ${s.value}`}
                                            size="small" sx={{ bgcolor: s.color, color: '#fff', fontWeight: 600, fontSize: '0.75rem' }} />
                                    ))}
                                </Box>
                            </Box>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 4, textAlign: 'center' }}>No data yet</Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Water Source Bar Chart */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            💧 Reports by Water Source
                        </Typography>
                        {sourceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={sourceData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8 }} />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Reports">
                                        {sourceData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 4, textAlign: 'center' }}>No data yet</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Top Districts Table */}
            {districtData.length > 0 && (
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        📍 Top Reporting Districts
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>District</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Reports</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: '40%' }}>Share</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {districtData.map((d, i) => {
                                const maxCount = districtData[0]?.count || 1;
                                const pct = Math.round((d.count / overview.completed) * 100) || 0;
                                return (
                                    <TableRow key={d.name} hover>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{d.name}</TableCell>
                                        <TableCell align="right">
                                            <Chip label={d.count} size="small" color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{
                                                    height: 8, borderRadius: 4,
                                                    width: `${(d.count / maxCount) * 100}%`,
                                                    bgcolor: COLORS[i % COLORS.length],
                                                    transition: 'width 0.3s',
                                                    minWidth: 8,
                                                }} />
                                                <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                                    {pct}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Paper>
            )}
        </Box>
    );
}

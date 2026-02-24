import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box, Paper, Typography, Card, CardContent, Chip,
    Alert, Table, TableBody, TableCell, TableHead,
    TableRow, Skeleton, LinearProgress, Divider, Avatar,
    Grid, IconButton, Tooltip,
} from '@mui/material';
import {
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

/* ── Palette ──────────────────────────────────────────────────── */
const STATUS_COLORS = {
    pending: '#ED6C02',
    in_progress: '#1565C0',
    completed: '#2E7D32',
    rejected: '#D32F2F',
};

/* ── Shared ───────────────────────────────────────────────────── */
const paper = { p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', boxSizing: 'border-box' };

/* ── Skeleton ─────────────────────────────────────────────────── */
function DashboardSkeleton() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />)}
            </Box>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
        </Box>
    );
}

/* ── Stat Card ────────────────────────────────────────────────── */
function StatCard({ icon, title, value, color, subtitle }) {
    return (
        <Paper sx={{ ...paper, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
                {icon}
            </Avatar>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.disabled">
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function LabStaffDashboard() {
    const { user, api } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        pendingTests: 0,
        inProgressTests: 0,
        completedToday: 0,
        totalCompleted: 0,
    });
    const [recentTests, setRecentTests] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch lab staff dashboard data
            // For now, using mock data - replace with actual API calls
            // const { data } = await api.get('/lab-staff/dashboard');
            
            // Mock data for demonstration
            setStats({
                pendingTests: 12,
                inProgressTests: 5,
                completedToday: 8,
                totalCompleted: 156,
            });

            setRecentTests([
                { id: 'WT-001', source: 'Well', location: 'Colombo', status: 'pending', date: '2026-02-25' },
                { id: 'WT-002', source: 'River', location: 'Kandy', status: 'in_progress', date: '2026-02-25' },
                { id: 'WT-003', source: 'Tap', location: 'Galle', status: 'completed', date: '2026-02-24' },
                { id: 'WT-004', source: 'Tank', location: 'Jaffna', status: 'pending', date: '2026-02-24' },
                { id: 'WT-005', source: 'Lake', location: 'Matara', status: 'in_progress', date: '2026-02-24' },
            ]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <DashboardSkeleton />;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Lab Staff Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {user?.name || 'Lab Staff'}
                    </Typography>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton onClick={fetchData} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                <StatCard
                    icon={<PendingIcon />}
                    title="Pending Tests"
                    value={stats.pendingTests}
                    color="#ED6C02"
                    subtitle="Awaiting processing"
                />
                <StatCard
                    icon={<ScienceIcon />}
                    title="In Progress"
                    value={stats.inProgressTests}
                    color="#1565C0"
                    subtitle="Currently testing"
                />
                <StatCard
                    icon={<CheckCircleIcon />}
                    title="Completed Today"
                    value={stats.completedToday}
                    color="#2E7D32"
                    subtitle="Tests finished"
                />
                <StatCard
                    icon={<AssignmentIcon />}
                    title="Total Completed"
                    value={stats.totalCompleted}
                    color="#7B1FA2"
                    subtitle="All time"
                />
            </Box>

            {/* Recent Tests Table */}
            <Paper sx={paper}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Water Tests
                    </Typography>
                    <Chip label="View All" size="small" clickable color="primary" variant="outlined" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Test ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Water Source</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentTests.map((test) => (
                            <TableRow key={test.id} hover>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {test.id}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{test.source}</TableCell>
                                <TableCell>{test.location}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={test.status.replace('_', ' ')}
                                        size="small"
                                        sx={{
                                            bgcolor: STATUS_COLORS[test.status] || '#999',
                                            color: '#fff',
                                            textTransform: 'capitalize',
                                            fontWeight: 500,
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {test.date}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Quick Info */}
            <Paper sx={{ ...paper, bgcolor: 'primary.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ScheduleIcon color="primary" />
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Lab Operating Hours
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Monday - Friday: 8:00 AM - 5:00 PM | Saturday: 8:00 AM - 12:00 PM
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

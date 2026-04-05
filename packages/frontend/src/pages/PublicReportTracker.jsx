import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, AppBar, Toolbar, Button, Container, TextField, Card, CardContent,
    Stack, Chip, IconButton, CircularProgress, Alert
} from '@mui/material';
import { ArrowBack, Search as SearchIcon, WaterDrop as WaterDropIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { trackReportsByNic } from '../services/publicReportService';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error' };

export default function PublicReportTracker() {
    const navigate = useNavigate();
    const [nic, setNic] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);
        setSearched(true);
        if (!nic.trim()) {
            setError('Please enter a valid NIC.');
            return;
        }

        setLoading(true);
        try {
            const data = await trackReportsByNic(nic.trim());
            setReports(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please check your NIC format.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5F7FA' }}>
            {/* Top Bar */}
            <AppBar position="static" elevation={1} sx={{ bgcolor: '#fff', color: '#1A2027' }}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => navigate('/')} aria-label="back" sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                        <AssessmentIcon sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
                        Track Water Reports
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate('/report')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                        Submit New Report
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Tracker Form */}
            <Container maxWidth="sm" sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
                <Card elevation={2} sx={{ borderRadius: 4, mb: 4, overflow: 'visible' }}>
                    <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#E3F2FD', color: '#1565C0', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                            <SearchIcon sx={{ fontSize: 32 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                            Track Your Submission
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                            Enter the NIC associated with your water quality report to view its moderation status.
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSearch}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter your NIC (e.g., 901234567V)"
                                    value={nic}
                                    onChange={(e) => setNic(e.target.value)}
                                    disabled={loading}
                                    autoFocus
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                                    sx={{ py: 1.5, px: 4, borderRadius: 2, fontWeight: 600, textTransform: 'none', minWidth: 140 }}
                                >
                                    {loading ? 'Searching...' : 'Track'}
                                </Button>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>

                {/* Results List */}
                {searched && !loading && !error && (
                    <Box>
                        {reports.length === 0 ? (
                            <Card elevation={0} sx={{ bgcolor: 'transparent', textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    No reports found for this NIC.
                                </Typography>
                            </Card>
                        ) : (
                            <Stack spacing={2}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, px: 1 }}>
                                    Found {reports.length} report{reports.length !== 1 ? 's' : ''}:
                                </Typography>
                                {reports.map((report) => (
                                    <Card key={report._id} elevation={0} sx={{ border: '1px solid #E0E0E0', borderRadius: 3, transition: '0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                                        <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, p: 3, '&:last-child': { pb: 3 } }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <WaterDropIcon sx={{ fontSize: 20, color: '#1565C0' }} />
                                                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                                        {report.waterSource || 'Unknown Source'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {report.location?.city || 'Location unavailable'} • Submitted on {new Date(report.createdAt).toLocaleDateString()}
                                                </Typography>
                                                {report.turbidity?.value && (
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#546E7A' }}>
                                                        Turbidity: {report.turbidity.value}
                                                    </Typography>
                                                )}
                                                {report.mod_status === 'rejected' && report.rejection_reason && (
                                                    <Alert severity="error" sx={{ mt: 2, py: 0, '& .MuiAlert-message': { p: 1 } }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Reason for rejection:</Typography><br/>
                                                        <Typography variant="caption">{report.rejection_reason}</Typography>
                                                    </Alert>
                                                )}
                                            </Box>
                                            <Chip
                                                label={report.mod_status.toUpperCase()}
                                                color={STATUS_COLORS[report.mod_status]}
                                                sx={{ fontWeight: 700, borderRadius: 2 }}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}
            </Container>
        </Box>
    );
}

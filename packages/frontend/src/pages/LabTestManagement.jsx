import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box, Paper, Typography, Chip, Button, IconButton,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControl, InputLabel, Select, MenuItem, Grid, Divider,
    Alert, CircularProgress, Tabs, Tab, Tooltip, Card, CardContent,
    Stepper, Step, StepLabel, LinearProgress,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as AcceptIcon,
    Cancel as RejectIcon,
    Schedule as ScheduleIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    LocationOn as LocationIcon,
    PhotoCamera as PhotoIcon,
    PlayArrow as StartIcon,
    Done as CompleteIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';

const STATUS_COLORS = {
    pending_acceptance: '#ED6C02',
    accepted: '#1565C0',
    sample_scheduled: '#7B1FA2',
    sample_collected: '#0097A7',
    testing_in_progress: '#1565C0',
    completed: '#2E7D32',
    rejected: '#D32F2F',
};

const STATUS_LABELS = {
    pending_acceptance: 'Pending Acceptance',
    accepted: 'Accepted',
    sample_scheduled: 'Sample Scheduled',
    sample_collected: 'Sample Collected',
    testing_in_progress: 'Testing In Progress',
    completed: 'Completed',
    rejected: 'Rejected',
};

const WORKFLOW_STEPS = [
    'Pending',
    'Accepted',
    'Scheduled',
    'Collected',
    'Testing',
    'Completed',
];

function getStepIndex(status) {
    const mapping = {
        pending_acceptance: 0,
        accepted: 1,
        sample_scheduled: 2,
        sample_collected: 3,
        testing_in_progress: 4,
        completed: 5,
        rejected: -1,
    };
    return mapping[status] ?? 0;
}

export default function LabTestManagement() {
    const { api } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Dialog states
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [collectDialogOpen, setCollectDialogOpen] = useState(false);
    const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
    const [verdictDialogOpen, setVerdictDialogOpen] = useState(false);
    const [verdictResult, setVerdictResult] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [rejectReason, setRejectReason] = useState('');
    const [scheduleForm, setScheduleForm] = useState({
        date: '',
        timeSlot: '',
        contactPhone: '',
        specialInstructions: '',
        laboratoryId: '',
    });
    const [scheduleError, setScheduleError] = useState('');
    const [laboratories, setLaboratories] = useState([]);
    const [collectForm, setCollectForm] = useState({
        address: '',
        sampleId: '',
        bottleType: 'sterile plastic',
        volumeCollected: 500,
        notes: '',
    });
    const [collectError, setCollectError] = useState('');
    const [testResults, setTestResults] = useState({});
    const [labNotes, setLabNotes] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: pagination.page, limit: 20 });
            if (statusFilter) params.append('status', statusFilter);
            
            const { data } = await api.get(`/lab-staff/requests?${params}`);
            setRequests(data.data.requests);
            setPagination(data.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, pagination.page]);

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const { data } = await api.get('/lab-staff/laboratories');
                setLaboratories(data.data.laboratories || []);
            } catch (err) {
                console.error('Failed to fetch laboratories:', err);
            }
        };
        fetchLabs();
    }, [api]);

    // Actions
    const handleAccept = async (id) => {
        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${id}/accept`);
            setSuccess('Request accepted successfully');
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setError('Rejection reason is required');
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${selectedRequest._id}/reject`, { reason: rejectReason });
            setSuccess('Request rejected');
            setRejectDialogOpen(false);
            setRejectReason('');
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSchedule = async () => {
        setScheduleError('');
        if (!scheduleForm.date || !scheduleForm.timeSlot || !scheduleForm.laboratoryId) {
            setScheduleError('Date, time slot, and laboratory assignment are required');
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (scheduleForm.contactPhone && !phoneRegex.test(scheduleForm.contactPhone)) {
            setScheduleError('Contact phone must be exactly 10 digits');
            return;
        }

        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${selectedRequest._id}/schedule`, scheduleForm);
            setSuccess('Sample collection scheduled');
            setScheduleDialogOpen(false);
            setScheduleForm({ date: '', timeSlot: '', contactPhone: '', specialInstructions: '', laboratoryId: '' });
            fetchRequests();
        } catch (err) {
            setScheduleError(err.response?.data?.message || 'Failed to schedule collection');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCollect = async () => {
        setCollectError('');
        if (!collectForm.address || !collectForm.sampleId || !collectForm.bottleType || !collectForm.volumeCollected) {
            setCollectError('Address, Sample ID, Bottle Type, and Volume are required fields.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${selectedRequest._id}/collect`, {
                ...collectForm,
                volumeCollected: parseInt(collectForm.volumeCollected) || 500,
            });
            setSuccess('Sample collection recorded');
            setCollectDialogOpen(false);
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record collection');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartTesting = async (id) => {
        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${id}/start-testing`);
            setSuccess('Testing started');
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start testing');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveResults = async () => {
        setActionLoading(true);
        try {
            await api.put(`/lab-staff/requests/${selectedRequest._id}/results`, {
                results: testResults,
                labNotes,
            });
            setSuccess('Test results saved');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save results');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteAndVerdict = async () => {
        setActionLoading(true);
        try {
            // Always save the latest results first before issuing the verdict
            // so calculateVerdict() on the backend uses the actual entered values
            await api.put(`/lab-staff/requests/${selectedRequest._id}/results`, {
                results: testResults,
                labNotes,
            });

            // Now complete the test — backend will run calculateVerdict() on the saved data
            const { data } = await api.post(`/lab-staff/requests/${selectedRequest._id}/complete`, {});
            setResultsDialogOpen(false);
            setVerdictResult(data.data.request);
            setVerdictDialogOpen(true);
            setStatusFilter('completed');
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete testing');
        } finally {
            setActionLoading(false);
        }
    };

    const openViewDialog = async (request) => {
        try {
            const { data } = await api.get(`/lab-staff/requests/${request._id}`);
            setSelectedRequest(data.data.request);
            setViewDialogOpen(true);
        } catch (err) {
            setError('Failed to load request details');
        }
    };

    const getActionButton = (request) => {
        switch (request.status) {
            case 'pending_acceptance':
                return (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Accept">
                            <IconButton color="success" size="small" onClick={() => handleAccept(request._id)}>
                                <AcceptIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                            <IconButton color="error" size="small" onClick={() => { setSelectedRequest(request); setRejectDialogOpen(true); }}>
                                <RejectIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                );
            case 'accepted':
                return (
                    <Tooltip title="Schedule Collection">
                        <IconButton color="primary" size="small" onClick={() => { setSelectedRequest(request); setScheduleDialogOpen(true); }}>
                            <ScheduleIcon />
                        </IconButton>
                    </Tooltip>
                );
            case 'sample_scheduled':
                return (
                    <Tooltip title="Record Collection">
                        <IconButton color="primary" size="small" onClick={() => { setSelectedRequest(request); setCollectDialogOpen(true); }}>
                            <LocationIcon />
                        </IconButton>
                    </Tooltip>
                );
            case 'sample_collected':
                return (
                    <Tooltip title="Start Testing">
                        <IconButton color="primary" size="small" onClick={() => handleStartTesting(request._id)}>
                            <StartIcon />
                        </IconButton>
                    </Tooltip>
                );
            case 'testing_in_progress':
                return (
                    <Tooltip title="Enter Results">
                        <IconButton color="primary" size="small" onClick={() => { setSelectedRequest(request); setResultsDialogOpen(true); }}>
                            <ScienceIcon />
                        </IconButton>
                    </Tooltip>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Lab Test Management
                </Typography>
                <IconButton onClick={fetchRequests} color="primary">
                    <RefreshIcon />
                </IconButton>
            </Box>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Filters */}
            <Paper sx={{ p: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Filter by Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="">All</MenuItem>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Requests Table */}
            <TableContainer component={Paper}>
                {loading && <LinearProgress />}
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Request #</TableCell>
                            <TableCell>Water Source</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req._id} hover>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {req.requestNumber}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>
                                    {req.publicReport?.waterSource || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {req.publicReport?.location?.district || req.publicReport?.location?.city || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={req.priority}
                                        size="small"
                                        color={req.priority === 'urgent' ? 'error' : req.priority === 'high' ? 'warning' : 'default'}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={STATUS_LABELS[req.status]}
                                        size="small"
                                        sx={{ bgcolor: STATUS_COLORS[req.status], color: '#fff' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                                        {req.status === 'completed' && req.verdict?.result && (
                                            <Chip
                                                label={req.verdict.result === 'safe' ? '✓ SAFE' : req.verdict.result === 'unsafe' ? '✗ UNSAFE' : '⚠ TREATMENT'}
                                                size="small"
                                                sx={{
                                                    bgcolor: req.verdict.result === 'safe' ? '#2E7D32' : req.verdict.result === 'unsafe' ? '#C62828' : '#E65100',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        )}
                                        <Tooltip title="View Details">
                                            <IconButton size="small" onClick={() => openViewDialog(req)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {getActionButton(req)}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No test requests found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Test Request Details - {selectedRequest?.requestNumber}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedRequest && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Workflow Progress */}
                            {selectedRequest.status !== 'rejected' && (
                                <Stepper activeStep={getStepIndex(selectedRequest.status)} alternativeLabel>
                                    {WORKFLOW_STEPS.map((label) => (
                                        <Step key={label}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="text.secondary">Report Info</Typography>
                                            <Typography>Source: {selectedRequest.publicReport?.waterSource}</Typography>
                                            <Typography>Location: {selectedRequest.publicReport?.location?.district}</Typography>
                                            <Typography>NIC: {selectedRequest.publicReport?.nic}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                            <Chip
                                                label={STATUS_LABELS[selectedRequest.status]}
                                                sx={{ bgcolor: STATUS_COLORS[selectedRequest.status], color: '#fff', mt: 1 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Verdict if completed - Enhanced */}
                            {selectedRequest.status === 'completed' && selectedRequest.verdict && (
                                <Box>
                                    {/* Big Safe/Unsafe Banner */}
                                    <Box sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        mb: 2,
                                        bgcolor: selectedRequest.verdict.result === 'safe' ? '#E8F5E9'
                                            : selectedRequest.verdict.result === 'unsafe' ? '#FFEBEE' : '#FFF3E0',
                                        border: `2px solid ${
                                            selectedRequest.verdict.result === 'safe' ? '#2E7D32'
                                            : selectedRequest.verdict.result === 'unsafe' ? '#C62828' : '#E65100'
                                        }`,
                                    }}>
                                        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1,
                                            color: selectedRequest.verdict.result === 'safe' ? '#2E7D32'
                                                : selectedRequest.verdict.result === 'unsafe' ? '#C62828' : '#E65100'
                                        }}>
                                            {selectedRequest.verdict.result === 'safe' ? '✅ WATER IS SAFE'
                                                : selectedRequest.verdict.result === 'unsafe' ? '🚫 WATER IS UNSAFE'
                                                : '⚠️ NEEDS TREATMENT'}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {selectedRequest.verdict.summary}
                                        </Typography>
                                        {selectedRequest.verdict.issuedAt && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Verdict issued: {new Date(selectedRequest.verdict.issuedAt).toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Parameter Results */}
                                    {(() => {
                                        const params = [
                                            { id: 'ph', label: 'pH Level', safeRange: '6.5 – 8.5' },
                                            { id: 'turbidity', label: 'Turbidity (NTU)', safeRange: '≤ 5.0' },
                                            { id: 'totalDissolvedSolids', label: 'TDS (mg/L)', safeRange: '≤ 500' },
                                            { id: 'coliformBacteria', label: 'Coliform Bacteria', safeRange: '= 0' },
                                            { id: 'nitrate', label: 'Nitrate (mg/L)', safeRange: '≤ 50' },
                                        ];
                                        const results = selectedRequest.results;
                                        const failed = selectedRequest.verdict.failedParameters || [];
                                        const tested = params.filter(p => results?.[p.id]?.value !== null && results?.[p.id]?.value !== undefined);
                                        if (tested.length === 0) return null;
                                        return (
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Test Parameter Results</Typography>
                                                <Grid container spacing={1}>
                                                    {tested.map(p => {
                                                        const val = results[p.id]?.value;
                                                        const isFailed = failed.includes(p.id);
                                                        return (
                                                            <Grid item xs={12} sm={6} key={p.id}>
                                                                <Box sx={{
                                                                    p: 1.5, borderRadius: 1,
                                                                    bgcolor: isFailed ? '#FFEBEE' : '#E8F5E9',
                                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                                }}>
                                                                    <Box>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.label}</Typography>
                                                                        <Typography variant="caption" color="text.secondary">Safe: {p.safeRange}</Typography>
                                                                    </Box>
                                                                    <Box sx={{ textAlign: 'right' }}>
                                                                        <Typography variant="body1" sx={{ fontWeight: 700, color: isFailed ? '#C62828' : '#2E7D32' }}>
                                                                            {val}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: isFailed ? '#C62828' : '#2E7D32' }}>
                                                                            {isFailed ? '✗ Failed' : '✓ Pass'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        );
                                                    })}
                                                </Grid>
                                            </Box>
                                        );
                                    })()}

                                    {/* Recommendations */}
                                    {selectedRequest.verdict.recommendations?.length > 0 && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>📋 Recommendations</Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {selectedRequest.verdict.recommendations.map((rec, i) => (
                                                    <li key={i}><Typography variant="body2">{rec}</Typography></li>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Report Number */}
                                    {selectedRequest.finalReport?.reportNumber && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            Report #: {selectedRequest.finalReport.reportNumber}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Verdict Result Dialog - shown immediately after completing */}
            <Dialog open={verdictDialogOpen} onClose={() => setVerdictDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{
                    bgcolor: verdictResult?.verdict?.result === 'safe' ? '#2E7D32'
                        : verdictResult?.verdict?.result === 'unsafe' ? '#C62828' : '#E65100',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                }}>
                    {verdictResult?.verdict?.result === 'safe' ? '✅ Water Quality Report — SAFE'
                        : verdictResult?.verdict?.result === 'unsafe' ? '🚫 Water Quality Report — UNSAFE'
                        : '⚠️ Water Quality Report — NEEDS TREATMENT'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {verdictResult && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Typography variant="body1" sx={{ p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
                                {verdictResult.verdict?.summary}
                            </Typography>

                            {/* Parameter Results */}
                            {(() => {
                                const params = [
                                    { id: 'ph', label: 'pH Level', safeRange: '6.5 – 8.5' },
                                    { id: 'turbidity', label: 'Turbidity (NTU)', safeRange: '≤ 5.0' },
                                    { id: 'totalDissolvedSolids', label: 'TDS (mg/L)', safeRange: '≤ 500' },
                                    { id: 'coliformBacteria', label: 'Coliform Bacteria', safeRange: '= 0' },
                                    { id: 'nitrate', label: 'Nitrate (mg/L)', safeRange: '≤ 50' },
                                ];
                                const results = verdictResult.results;
                                const failed = verdictResult.verdict?.failedParameters || [];
                                const tested = params.filter(p => results?.[p.id]?.value !== null && results?.[p.id]?.value !== undefined);
                                if (tested.length === 0) return <Typography color="text.secondary">No parameter data recorded.</Typography>;
                                return (
                                    <Grid container spacing={1}>
                                        {tested.map(p => {
                                            const val = results[p.id]?.value;
                                            const isFailed = failed.includes(p.id);
                                            return (
                                                <Grid item xs={12} key={p.id}>
                                                    <Box sx={{
                                                        p: 1.5, borderRadius: 1,
                                                        bgcolor: isFailed ? '#FFEBEE' : '#E8F5E9',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        border: `1px solid ${isFailed ? '#EF9A9A' : '#A5D6A7'}`,
                                                    }}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.label}</Typography>
                                                            <Typography variant="caption" color="text.secondary">Safe range: {p.safeRange}</Typography>
                                                        </Box>
                                                        <Box sx={{ textAlign: 'right' }}>
                                                            <Typography variant="h6" sx={{ fontWeight: 800, color: isFailed ? '#C62828' : '#2E7D32' }}>
                                                                {val}
                                                            </Typography>
                                                            <Chip
                                                                label={isFailed ? 'FAILED' : 'PASS'}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: isFailed ? '#C62828' : '#2E7D32',
                                                                    color: '#fff', fontWeight: 700, fontSize: '0.65rem'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                );
                            })()}

                            {/* Recommendations */}
                            {verdictResult.verdict?.recommendations?.length > 0 && (
                                <Box sx={{ p: 2, bgcolor: '#FFF9C4', borderRadius: 1, border: '1px solid #F9A825' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>📋 Recommendations</Typography>
                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                        {verdictResult.verdict.recommendations.map((rec, i) => (
                                            <li key={i}><Typography variant="body2">{rec}</Typography></li>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {verdictResult.finalReport?.reportNumber && (
                                <Typography variant="caption" color="text.secondary">
                                    Report Number: {verdictResult.finalReport.reportNumber}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVerdictDialogOpen(false)} variant="contained"
                        color={verdictResult?.verdict?.result === 'safe' ? 'success' : 'error'}>
                        Close Report
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
                <DialogTitle>Reject Test Request</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Rejection Reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleReject} color="error" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Schedule Dialog */}
            <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Schedule Sample Collection</DialogTitle>
                <DialogContent>
                    {scheduleError && <Alert severity="error" sx={{ mt: 1, mb: 2 }}>{scheduleError}</Alert>}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            select
                            fullWidth
                            label="Assign Laboratory *"
                            value={scheduleForm.laboratoryId}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, laboratoryId: e.target.value })}
                        >
                            {laboratories.map((lab) => (
                                <MenuItem key={lab._id} value={lab._id}>
                                    {lab.name} ({lab.location})
                                </MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Collection Date *"
                                value={scheduleForm.date}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                select
                                fullWidth
                                label="Time Slot *"
                                value={scheduleForm.timeSlot}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, timeSlot: e.target.value })}
                            >
                                <MenuItem value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</MenuItem>
                                <MenuItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</MenuItem>
                                <MenuItem value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</MenuItem>
                                <MenuItem value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</MenuItem>
                            </TextField>
                        </Box>

                        <TextField
                            fullWidth
                            label="Contact Phone"
                            value={scheduleForm.contactPhone}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, contactPhone: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Special Instructions"
                            value={scheduleForm.specialInstructions}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, specialInstructions: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSchedule} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Collect Sample Dialog */}
            <Dialog open={collectDialogOpen} onClose={() => setCollectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Record Sample Collection</DialogTitle>
                <DialogContent>
                    {collectError && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{collectError}</Alert>}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Address *" value={collectForm.address} onChange={(e) => setCollectForm({ ...collectForm, address: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Sample ID *" value={collectForm.sampleId} onChange={(e) => setCollectForm({ ...collectForm, sampleId: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Bottle Type *</InputLabel>
                                <Select value={collectForm.bottleType} label="Bottle Type *" onChange={(e) => setCollectForm({ ...collectForm, bottleType: e.target.value })}>
                                    <MenuItem value="sterile plastic">Sterile Plastic</MenuItem>
                                    <MenuItem value="glass">Glass</MenuItem>
                                    <MenuItem value="amber glass">Amber Glass</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Volume (mL) *" type="number" value={collectForm.volumeCollected} onChange={(e) => setCollectForm({ ...collectForm, volumeCollected: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={2} label="Notes" value={collectForm.notes} onChange={(e) => setCollectForm({ ...collectForm, notes: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCollectDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCollect} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Record Collection'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Test Results Dialog */}
            <Dialog open={resultsDialogOpen} onClose={() => setResultsDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Enter Test Results</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Guidelines for Safe Water:</Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.8rem' }}>
                                <li><strong>pH:</strong> 6.5 - 8.5</li>
                                <li><strong>Turbidity (NTU):</strong> 0 - 5.0 (Lower is better)</li>
                                <li><strong>TDS (mg/L):</strong> 0 - 500 (Lower is better)</li>
                                <li><strong>Coliform (CFU/100mL):</strong> Exactly 0</li>
                                <li><strong>Nitrate (mg/L):</strong> 0 - 50.0</li>
                            </Box>
                        </Alert>
                        <Typography variant="subtitle2" color="text.secondary">
                            Enter measured values for the 5 primary parameters:
                        </Typography>
                    </Box>
                    <Grid container spacing={3}>
                        {[
                            { id: 'ph', label: 'pH Level', help: 'Ideal: 6.5-8.5' },
                            { id: 'turbidity', label: 'Turbidity (NTU)', help: 'Max: 5.0' },
                            { id: 'totalDissolvedSolids', label: 'TDS (mg/L)', help: 'Max: 500' },
                            { id: 'coliformBacteria', label: 'Coliform Bacteria', help: 'Must be 0' },
                            { id: 'nitrate', label: 'Nitrate (mg/L)', help: 'Max: 50' }
                        ].map((param) => (
                            <Grid item xs={12} sm={6} key={param.id}>
                                <TextField
                                    fullWidth
                                    label={param.label}
                                    helperText={param.help}
                                    type="number"
                                    inputProps={{ step: 'any' }}
                                    value={testResults[param.id]?.value ?? ''}
                                    onChange={(e) => setTestResults({
                                        ...testResults,
                                        [param.id]: { value: e.target.value === '' ? '' : parseFloat(e.target.value) }
                                    })}
                                />
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Lab Notes"
                                value={labNotes}
                                onChange={(e) => setLabNotes(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResultsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveResults} disabled={actionLoading}>Save Results</Button>
                    <Button onClick={handleCompleteAndVerdict} variant="contained" color="success" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Complete & Issue Verdict'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

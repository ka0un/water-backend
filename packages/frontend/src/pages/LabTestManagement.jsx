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
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [rejectReason, setRejectReason] = useState('');
    const [scheduleForm, setScheduleForm] = useState({
        date: '',
        timeSlot: '',
        contactPhone: '',
        specialInstructions: '',
    });
    const [collectForm, setCollectForm] = useState({
        lat: '',
        lng: '',
        address: '',
        sampleId: '',
        bottleType: 'sterile plastic',
        volumeCollected: 500,
        waterTemperature: '',
        weatherConditions: '',
        notes: '',
    });
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
        if (!scheduleForm.date || !scheduleForm.timeSlot) {
            setError('Date and time slot are required');
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${selectedRequest._id}/schedule`, scheduleForm);
            setSuccess('Sample collection scheduled');
            setScheduleDialogOpen(false);
            setScheduleForm({ date: '', timeSlot: '', contactPhone: '', specialInstructions: '' });
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to schedule collection');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCollect = async () => {
        setActionLoading(true);
        try {
            await api.post(`/lab-staff/requests/${selectedRequest._id}/collect`, {
                ...collectForm,
                lat: parseFloat(collectForm.lat) || null,
                lng: parseFloat(collectForm.lng) || null,
                volumeCollected: parseInt(collectForm.volumeCollected) || 500,
                waterTemperature: parseFloat(collectForm.waterTemperature) || null,
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
            await api.post(`/lab-staff/requests/${selectedRequest._id}/complete`);
            setSuccess('Testing completed and verdict issued');
            setResultsDialogOpen(false);
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
                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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

                            {/* Verdict if completed */}
                            {selectedRequest.status === 'completed' && selectedRequest.verdict && (
                                <Card variant="outlined" sx={{ bgcolor: selectedRequest.verdict.result === 'safe' ? '#E8F5E9' : '#FFEBEE' }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: selectedRequest.verdict.result === 'safe' ? '#2E7D32' : '#D32F2F' }}>
                                            Verdict: {selectedRequest.verdict.result?.toUpperCase()}
                                        </Typography>
                                        <Typography>{selectedRequest.verdict.summary}</Typography>
                                        {selectedRequest.verdict.recommendations?.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2">Recommendations:</Typography>
                                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                                    {selectedRequest.verdict.recommendations.map((rec, i) => (
                                                        <li key={i}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
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
            <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
                <DialogTitle>Schedule Sample Collection</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Collection Date"
                                value={scheduleForm.date}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Time Slot</InputLabel>
                                <Select
                                    value={scheduleForm.timeSlot}
                                    label="Time Slot"
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, timeSlot: e.target.value })}
                                >
                                    <MenuItem value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</MenuItem>
                                    <MenuItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</MenuItem>
                                    <MenuItem value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</MenuItem>
                                    <MenuItem value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Contact Phone"
                                value={scheduleForm.contactPhone}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, contactPhone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Special Instructions"
                                value={scheduleForm.specialInstructions}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, specialInstructions: e.target.value })}
                            />
                        </Grid>
                    </Grid>
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
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Latitude" type="number" value={collectForm.lat} onChange={(e) => setCollectForm({ ...collectForm, lat: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Longitude" type="number" value={collectForm.lng} onChange={(e) => setCollectForm({ ...collectForm, lng: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Address" value={collectForm.address} onChange={(e) => setCollectForm({ ...collectForm, address: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Sample ID" value={collectForm.sampleId} onChange={(e) => setCollectForm({ ...collectForm, sampleId: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Bottle Type</InputLabel>
                                <Select value={collectForm.bottleType} label="Bottle Type" onChange={(e) => setCollectForm({ ...collectForm, bottleType: e.target.value })}>
                                    <MenuItem value="sterile plastic">Sterile Plastic</MenuItem>
                                    <MenuItem value="glass">Glass</MenuItem>
                                    <MenuItem value="amber glass">Amber Glass</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Volume (mL)" type="number" value={collectForm.volumeCollected} onChange={(e) => setCollectForm({ ...collectForm, volumeCollected: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Water Temp (°C)" type="number" value={collectForm.waterTemperature} onChange={(e) => setCollectForm({ ...collectForm, waterTemperature: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Weather Conditions" value={collectForm.weatherConditions} onChange={(e) => setCollectForm({ ...collectForm, weatherConditions: e.target.value })} />
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
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter measured values for each parameter. Leave empty if not tested.
                    </Typography>
                    <Grid container spacing={2}>
                        {['ph', 'turbidity', 'totalDissolvedSolids', 'lead', 'arsenic', 'mercury', 'coliformBacteria', 'ecoliCount', 'nitrate', 'fluoride', 'iron'].map((param) => (
                            <Grid item xs={6} md={4} key={param}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={param.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    type="number"
                                    inputProps={{ step: 'any' }}
                                    value={testResults[param]?.value || ''}
                                    onChange={(e) => setTestResults({
                                        ...testResults,
                                        [param]: { value: parseFloat(e.target.value) || null }
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

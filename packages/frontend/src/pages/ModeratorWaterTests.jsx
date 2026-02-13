import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Stack,
    Button,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    CardActions,
    Divider,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    HelpOutline as HelpOutlineIcon,
    LocationOn as LocationOnIcon,
    Image as ImageIcon,
    Person as PersonIcon,
    ContentCopy as DuplicateIcon,
} from '@mui/icons-material';

const API_BASE_URL = '/api/v1';

const statusColor = (status) => {
    switch (status) {
        case 'Pending':
            return 'warning';
        case 'Approved - Lab Testing Requested':
            return 'success';
        case 'Rejected':
            return 'error';
        default:
            return 'default';
    }
};

const ModeratorWaterTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(6);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectTargetId, setRejectTargetId] = useState(null);

    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [duplicateOriginalId, setDuplicateOriginalId] = useState('');
    const [duplicateTargetId, setDuplicateTargetId] = useState(null);

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {};
    };

    const fetchTests = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const res = await fetch(`${API_BASE_URL}/water-tests/moderator`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
            });

            if (!res.ok) {
                throw new Error('Failed to load water tests');
            }

            const json = await res.json();
            const items = json?.data?.tests || json?.data || [];
            setTests(items);
        } catch (err) {
            setError(err.message || 'Something went wrong while loading tests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

    const handleAction = async (id, action, body) => {
        try {
            setError('');

            const res = await fetch(`${API_BASE_URL}/water-tests/${id}/${action}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.message || `Failed to ${action.replace('-', ' ')}`);
            }

            await fetchTests();
        } catch (err) {
            setError(err.message || 'Action failed');
        }
    };

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setRowsPerPage(newRowsPerPage);
        setPage(0);
    };

    const openRejectDialog = (id) => {
        setRejectTargetId(id);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const closeRejectDialog = () => {
        setRejectDialogOpen(false);
        setRejectTargetId(null);
        setRejectReason('');
    };

    const confirmReject = async () => {
        if (!rejectTargetId || !rejectReason.trim()) return;
        await handleAction(rejectTargetId, 'reject', { rejectionReason: rejectReason.trim() });
        closeRejectDialog();
    };

    const openDuplicateDialog = (id) => {
        setDuplicateTargetId(id);
        setDuplicateOriginalId('');
        setDuplicateDialogOpen(true);
    };

    const closeDuplicateDialog = () => {
        setDuplicateDialogOpen(false);
        setDuplicateTargetId(null);
        setDuplicateOriginalId('');
    };

    const confirmDuplicate = async () => {
        if (!duplicateTargetId || !duplicateOriginalId.trim()) return;
        await handleAction(duplicateTargetId, 'duplicate', { originalId: duplicateOriginalId.trim() });
        closeDuplicateDialog();
    };

    const filtered =
        statusFilter === 'ALL' ? tests : tests.filter((t) => t.status === statusFilter);
    const visibleRows = filtered.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const totalPending = tests.filter((t) => t.status === 'Pending').length;
    const totalApproved = tests.filter(
        (t) => t.status === 'Approved - Lab Testing Requested'
    ).length;
    const totalRejected = tests.filter((t) => t.status === 'Rejected').length;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Moderator – Water Tests
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Review pending submissions, verify details, approve or reject reports, and manage duplicates.
                    </Typography>
                </Box>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                <Chip
                    label={`Pending: ${totalPending}`}
                    color="warning"
                    variant={statusFilter === 'Pending' ? 'filled' : 'outlined'}
                    onClick={() => {
                        setStatusFilter('Pending');
                        setPage(0);
                    }}
                />
                <Chip
                    label={`Approved: ${totalApproved}`}
                    color="success"
                    variant={
                        statusFilter === 'Approved - Lab Testing Requested'
                            ? 'filled'
                            : 'outlined'
                    }
                    onClick={() => {
                        setStatusFilter('Approved - Lab Testing Requested');
                        setPage(0);
                    }}
                />
                <Chip
                    label={`Rejected: ${totalRejected}`}
                    color="error"
                    variant={statusFilter === 'Rejected' ? 'filled' : 'outlined'}
                    onClick={() => {
                        setStatusFilter('Rejected');
                        setPage(0);
                    }}
                />
                <Chip
                    label={`All: ${tests.length}`}
                    color="default"
                    variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
                    onClick={() => {
                        setStatusFilter('ALL');
                        setPage(0);
                    }}
                />
            </Stack>

            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={statusFilter}
                    onChange={(_e, v) => {
                        setStatusFilter(v);
                        setPage(0);
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="All" value="ALL" />
                    <Tab label="Pending" value="Pending" />
                    <Tab label="Approved" value="Approved - Lab Testing Requested" />
                    <Tab label="Rejected" value="Rejected" />
                </Tabs>
            </Paper>

            {error && (
                <Box sx={{ mb: 2 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            {loading ? (
                <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress />
                </Paper>
            ) : visibleRows.length === 0 ? (
                <Paper sx={{ p: 4, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                        No water tests found for this filter.
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {visibleRows.map((row) => {
                            const id = row.id || row._id;
                            return (
                                <Grid item xs={12} md={6} lg={4} key={id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <CardContent sx={{ pb: 1 }}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                                sx={{ mb: 1 }}
                                            >
                                                <Chip
                                                    label={row.status || 'Unknown'}
                                                    color={statusColor(row.status)}
                                                    size="small"
                                                />
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        maxWidth: 160,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {id}
                                                </Typography>
                                            </Stack>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 1 }}
                                            >
                                                Created:{' '}
                                                {row.createdAt
                                                    ? new Date(row.createdAt).toLocaleString()
                                                    : '-'}
                                            </Typography>

                                            <Divider sx={{ my: 1 }} />

                                            {/* Visual checklist */}
                                            <Stack spacing={1.2}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <ImageIcon
                                                        fontSize="small"
                                                        color={row.isVerified ? 'success' : 'disabled'}
                                                    />
                                                    {row.isVerified ? (
                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                    ) : (
                                                        <HelpOutlineIcon
                                                            fontSize="small"
                                                            color="disabled"
                                                        />
                                                    )}
                                                    <Typography variant="body2">
                                                        Are photos real?{' '}
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color={
                                                                row.isVerified
                                                                    ? 'success.main'
                                                                    : 'text.secondary'
                                                            }
                                                        >
                                                            {row.isVerified
                                                                ? 'Yes, verified'
                                                                : 'Not verified yet'}
                                                        </Typography>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <LocationOnIcon
                                                        fontSize="small"
                                                        color={row.verifiedLocation ? 'success' : 'disabled'}
                                                    />
                                                    {row.verifiedLocation ? (
                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                    ) : (
                                                        <HelpOutlineIcon
                                                            fontSize="small"
                                                            color="disabled"
                                                        />
                                                    )}
                                                    <Typography variant="body2">
                                                        Is location correct?{' '}
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color={
                                                                row.verifiedLocation
                                                                    ? 'success.main'
                                                                    : 'text.secondary'
                                                            }
                                                        >
                                                            {row.verifiedLocation
                                                                ? 'Yes, verified (e.g. Google Maps)'
                                                                : 'Not verified yet'}
                                                        </Typography>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <PersonIcon
                                                        fontSize="small"
                                                        color={
                                                            row.isUserTrustworthy
                                                                ? 'success'
                                                                : row.isUserTrustworthy === false
                                                                ? 'warning'
                                                                : 'disabled'
                                                        }
                                                    />
                                                    {row.isUserTrustworthy === null ? (
                                                        <HelpOutlineIcon
                                                            fontSize="small"
                                                            color="disabled"
                                                        />
                                                    ) : row.isUserTrustworthy ? (
                                                        <CheckCircleIcon
                                                            fontSize="small"
                                                            color="success"
                                                        />
                                                    ) : (
                                                        <CancelIcon fontSize="small" color="warning" />
                                                    )}
                                                    <Typography variant="body2">
                                                        Is user trustworthy?{' '}
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color={
                                                                row.isUserTrustworthy === null
                                                                    ? 'text.secondary'
                                                                    : row.isUserTrustworthy
                                                                    ? 'success.main'
                                                                    : 'warning.main'
                                                            }
                                                        >
                                                            {row.isUserTrustworthy === null
                                                                ? 'Not assessed'
                                                                : row.isUserTrustworthy
                                                                ? 'Yes, seems genuine'
                                                                : 'No, needs caution'}
                                                        </Typography>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <DuplicateIcon
                                                        fontSize="small"
                                                        color={row.isDuplicate ? 'warning' : 'disabled'}
                                                    />
                                                    {row.isDuplicate ? (
                                                        <CancelIcon fontSize="small" color="warning" />
                                                    ) : (
                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                    )}
                                                    <Typography variant="body2">
                                                        Any duplicates?{' '}
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color={
                                                                row.isDuplicate
                                                                    ? 'warning.main'
                                                                    : 'success.main'
                                                            }
                                                        >
                                                            {row.isDuplicate
                                                                ? 'Yes, marked as duplicate'
                                                                : 'No duplicates detected'}
                                                        </Typography>
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </CardContent>

                                        <CardActions
                                            sx={{
                                                mt: 'auto',
                                                px: 2,
                                                pb: 2,
                                                pt: 1,
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Stack direction="row" spacing={1}>
                                                {row.status !==
                                                    'Approved - Lab Testing Requested' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleAction(id, 'approve')}
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                                {row.status !== 'Rejected' && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() => openRejectDialog(id)}
                                                    >
                                                        Reject
                                                    </Button>
                                                )}
                                            </Stack>

                                            <Stack direction="row" spacing={1}>
                                                {!row.isVerified && (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() =>
                                                            handleAction(id, 'verify-photo')
                                                        }
                                                    >
                                                        Verify Photo
                                                    </Button>
                                                )}
                                                {!row.verifiedLocation && (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() =>
                                                            handleAction(id, 'verify-location')
                                                        }
                                                    >
                                                        Verify Location
                                                    </Button>
                                                )}
                                                {!row.isDuplicate && (
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        color="warning"
                                                        onClick={() => openDuplicateDialog(id)}
                                                    >
                                                        Mark Duplicate
                                                    </Button>
                                                )}
                                            </Stack>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {filtered.length > rowsPerPage && (
                        <Stack
                            direction="row"
                            justifyContent="center"
                            spacing={2}
                            sx={{ mt: 3 }}
                        >
                            <Button
                                variant="outlined"
                                disabled={page === 0}
                                onClick={(_e) => handleChangePage(null, page - 1)}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2" sx={{ pt: 0.7 }}>
                                Page {page + 1} of {Math.ceil(filtered.length / rowsPerPage)}
                            </Typography>
                            <Button
                                variant="outlined"
                                disabled={(page + 1) * rowsPerPage >= filtered.length}
                                onClick={(_e) => handleChangePage(null, page + 1)}
                            >
                                Next
                            </Button>
                        </Stack>
                    )}
                </>
            )}

            {/* Reject dialog */}
            <Dialog open={rejectDialogOpen} onClose={closeRejectDialog} fullWidth maxWidth="sm">
                <DialogTitle>Reject Water Test</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please provide a reason for rejecting this water test.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Rejection reason"
                        fullWidth
                        multiline
                        minRows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeRejectDialog}>Cancel</Button>
                    <Button
                        onClick={confirmReject}
                        color="error"
                        variant="contained"
                        disabled={!rejectReason.trim()}
                    >
                        Reject
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Duplicate dialog */}
            <Dialog open={duplicateDialogOpen} onClose={closeDuplicateDialog} fullWidth maxWidth="sm">
                <DialogTitle>Mark as Duplicate</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Enter the ID of the original water test that this record duplicates.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Original Water Test ID"
                        fullWidth
                        value={duplicateOriginalId}
                        onChange={(e) => setDuplicateOriginalId(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDuplicateDialog}>Cancel</Button>
                    <Button
                        onClick={confirmDuplicate}
                        color="warning"
                        variant="contained"
                        disabled={!duplicateOriginalId.trim()}
                    >
                        Mark Duplicate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ModeratorWaterTests;


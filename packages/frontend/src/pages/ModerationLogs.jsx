import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Stack,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';

const API_BASE_URL = '/api/v1';

const ACTION_LABELS = {
    APPROVE: 'Approve',
    REJECT: 'Reject',
    BAN: 'Ban',
    UNBAN: 'Unban',
    VERIFY_PHOTO: 'Verify Photo',
    VERIFY_LOCATION: 'Verify Location',
    MARK_DUPLICATE: 'Mark Duplicate',
};

const ACTION_COLORS = {
    APPROVE: 'success',
    REJECT: 'error',
    BAN: 'error',
    UNBAN: 'info',
    VERIFY_PHOTO: 'primary',
    VERIFY_LOCATION: 'primary',
    MARK_DUPLICATE: 'warning',
};

const ModerationLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [tab, setTab] = useState('ALL');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {};
    };

    const fetchLogs = useCallback(
        async (selectedAction) => {
            try {
                setLoading(true);
                setError('');

                const params = new URLSearchParams();
                params.set('page', '1');
                params.set('limit', '100');
                if (selectedAction && selectedAction !== 'ALL') {
                    params.set('action', selectedAction);
                }

                const res = await fetch(`${API_BASE_URL}/moderation/logs?${params.toString()}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders(),
                    },
                });

                if (!res.ok) {
                    const json = await res.json().catch(() => null);
                    throw new Error(json?.message || 'Failed to load moderation logs');
                }

                const json = await res.json();
                const items = json?.data?.logs || [];
                setLogs(items);
                setPage(0);
            } catch (err) {
                setError(err.message || 'Something went wrong while loading logs');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchLogs(tab);
    }, [fetchLogs, tab]);

    const handleTabChange = (_event, newValue) => {
        setTab(newValue);
    };

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCreateSample = async () => {
        try {
            setError('');
            setLoading(true);

            const res = await fetch(`${API_BASE_URL}/moderation/logs/sample`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
                body: JSON.stringify({
                    reason: 'Sample moderation log from UI',
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.message || 'Failed to create sample log');
            }

            await fetchLogs(tab);
        } catch (err) {
            setError(err.message || 'Failed to create sample log');
        } finally {
            setLoading(false);
        }
    };

    const visibleRows = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Moderation Activity
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track all approve / reject / ban actions performed by moderators.
                    </Typography>
                </Box>
                <Button variant="contained" color="primary" onClick={handleCreateSample}>
                    Add Sample Log
                </Button>
            </Stack>

            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ px: 2 }}
                >
                    <Tab label="All" value="ALL" />
                    <Tab label="Approve" value="APPROVE" />
                    <Tab label="Reject" value="REJECT" />
                    <Tab label="Ban" value="BAN" />
                    <Tab label="Unban" value="UNBAN" />
                    <Tab label="Verify Photo" value="VERIFY_PHOTO" />
                    <Tab label="Verify Location" value="VERIFY_LOCATION" />
                    <Tab label="Duplicate" value="MARK_DUPLICATE" />
                </Tabs>
            </Paper>

            {error && (
                <Box sx={{ mb: 2 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Time</TableCell>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Moderator</TableCell>
                                        <TableCell>Target User</TableCell>
                                        <TableCell>Report</TableCell>
                                        <TableCell>From → To</TableCell>
                                        <TableCell>Reason</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {visibleRows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    No moderation activity found.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {visibleRows.map((log) => (
                                        <TableRow key={log.id || log._id} hover>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {log.timestamp
                                                    ? new Date(log.timestamp).toLocaleString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={
                                                        ACTION_LABELS[log.action] || log.action || 'Unknown'
                                                    }
                                                    color={ACTION_COLORS[log.action] || 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {log.moderatorId
                                                    ? log.moderatorId.name ||
                                                      log.moderatorId.email ||
                                                      log.moderatorId
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {log.targetUserId
                                                    ? log.targetUserId.name ||
                                                      log.targetUserId.email ||
                                                      log.targetUserId
                                                    : '-'}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.reportId || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {log.previousStatus || '-'}{' '}
                                                {log.newStatus
                                                    ? `→ ${log.newStatus}`
                                                    : ''}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 260 }}>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {log.reason || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={logs.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25]}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default ModerationLogs;


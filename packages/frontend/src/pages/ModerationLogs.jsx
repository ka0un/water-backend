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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';

const API_BASE_URL = '/api/v1';

const ACTION_LABELS = {
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    VIEW_PUBLIC_REPORT: 'View Report',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    BAN: 'Ban',
    UNBAN: 'Unban',
    VERIFY_PHOTO: 'Verify Photo',
    VERIFY_LOCATION: 'Verify Location',
    MARK_DUPLICATE: 'Mark Duplicate',
};

const ACTION_COLORS = {
    LOGIN: 'info',
    LOGOUT: 'default',
    VIEW_PUBLIC_REPORT: 'secondary',
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
    const [moderators, setModerators] = useState([]);
    const [selectedModerator, setSelectedModerator] = useState('');

    const authHeaders = () => {
        const token = localStorage.getItem('wq_admin_token');
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
                if (selectedModerator) {
                    params.set('moderatorId', selectedModerator);
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

                // The backend API sends the data payload under `message` or `data`
                const responsePayload = json?.message?.logs ? json.message : json?.data;
                const items = responsePayload?.logs || [];

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
    }, [fetchLogs, tab, selectedModerator]);

    useEffect(() => {
        // Fetch moderators for the filter dropdown
        const fetchModerators = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/users?limit=100`, {
                    headers: { ...authHeaders() }
                });
                if (res.ok) {
                    const json = await res.json();
                    const allUsers = json?.data?.users || [];
                    const mods = allUsers.filter(u => u.role === 'MODERATOR' || u.role === 'ADMIN');
                    setModerators(mods);
                }
            } catch (e) {
                console.error("Failed to fetch moderators", e);
            }
        };
        fetchModerators();
    }, []);

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

    const visibleRows = logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Moderation Activity
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track all logins, views, approvals, rejections, and ban actions performed by moderators.
                    </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="moderator-select-label">Filter by Moderator</InputLabel>
                    <Select
                        labelId="moderator-select-label"
                        value={selectedModerator}
                        label="Filter by Moderator"
                        onChange={(e) => setSelectedModerator(e.target.value)}
                    >
                        <MenuItem value=""><em>All Moderators</em></MenuItem>
                        {moderators.map(mod => (
                            <MenuItem key={mod._id} value={mod._id}>{mod.name || mod.email}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
                    <Tab label="Login/Logout" value="LOGIN" /> {/* We map LOGIN here but it's just a label */}
                    <Tab label="Views" value="VIEW_PUBLIC_REPORT" />
                    <Tab label="Approve" value="APPROVE" />
                    <Tab label="Reject" value="REJECT" />
                    <Tab label="Ban/Unban" value="BAN" />
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
                                        <TableCell>Date & Time</TableCell>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Moderator</TableCell>
                                        <TableCell>Target User</TableCell>
                                        <TableCell>Report ID</TableCell>
                                        <TableCell>Status Change</TableCell>
                                        <TableCell>Reason</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(!logs || logs.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                    No moderation activity found.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log, index) => {

                                            // Safely extract string values for potentially populated nested objects
                                            const getObjectLabel = (obj) => {
                                                if (!obj) return '-';
                                                if (typeof obj === 'string') return obj;
                                                if (obj.name) return String(obj.name);
                                                if (obj.email) return String(obj.email);
                                                if (obj._id) return String(obj._id);
                                                return 'Unknown';
                                            };

                                            const actionLabel = ACTION_LABELS[log.action] || log.action || 'Unknown';
                                            const actionColor = ACTION_COLORS[log.action] || 'default';

                                            return (
                                                <TableRow key={`log-${log._id || index}`} hover>
                                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={actionLabel} color={actionColor} size="small" />
                                                    </TableCell>
                                                    <TableCell>{getObjectLabel(log.moderatorId)}</TableCell>
                                                    <TableCell>{getObjectLabel(log.targetUserId)}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                        {getObjectLabel(log.reportId)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.previousStatus || '-'}
                                                        {log.newStatus && log.newStatus !== log.previousStatus ? ` → ${log.newStatus}` : ''}
                                                    </TableCell>
                                                    <TableCell sx={{ maxWidth: 300 }}>
                                                        <Typography variant="body2" color="text.secondary" sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                        }}>
                                                            {log.reason || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={logs?.length || 0}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default ModerationLogs;


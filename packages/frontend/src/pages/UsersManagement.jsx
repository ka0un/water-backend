import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
    TablePagination, IconButton, Chip, Select, MenuItem, FormControl, InputLabel,
    Alert, CircularProgress, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import { Block, CheckCircle, VerifiedUser } from '@mui/icons-material';

const ROLES = ['USER', 'MODERATOR', 'LAB_STAFF', 'ADMIN'];

export default function UsersManagement() {
    const { api, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [filters, setFilters] = useState({ role: '', isActive: '' });

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage,
            });
            if (filters.role) params.append('role', filters.role);
            if (filters.isActive !== '') params.append('isActive', filters.isActive);

            const res = await api.get(`/admin/users?${params.toString()}`);
            setUsers(res.data.data.users);
            setTotal(res.data.data.pagination.total);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, filters]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/admin/users/${userId}/role`, { role: newRole });
            setSuccessMessage(`User role updated to ${newRole}`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            setSuccessMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user status');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A2027' }}>
                    User Management
                </Typography>
            </Box>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {successMessage && <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Filter by Role</InputLabel>
                        <Select
                            value={filters.role}
                            label="Filter by Role"
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, role: e.target.value }));
                                setPage(0);
                            }}
                        >
                            <MenuItem value="">All Roles</MenuItem>
                            {ROLES.map(role => (
                                <MenuItem key={role} value={role}>{role}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters.isActive}
                            label="Status"
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, isActive: e.target.value }));
                                setPage(0);
                            }}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="true">Active</MenuItem>
                            <MenuItem value="false">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Data Table */}
                <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map(row => (
                                    <TableRow key={row._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {row.name}
                                            </Typography>
                                            {row._id === currentUser?._id && (
                                                <Chip label="You" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            )}
                                        </TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={row.role}
                                                onChange={(e) => handleRoleChange(row._id, e.target.value)}
                                                disabled={row._id === currentUser?._id}
                                                sx={{ minWidth: 120, height: 32, fontSize: '0.875rem' }}
                                            >
                                                {ROLES.map(role => (
                                                    <MenuItem key={role} value={role}>{role}</MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={row.isActive ? <CheckCircle /> : <Block />}
                                                label={row.isActive ? 'Active' : 'Inactive'}
                                                color={row.isActive ? 'success' : 'error'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={row.isActive ? "Deactivate User" : "Activate User"}>
                                                <Switch
                                                    checked={row.isActive}
                                                    onChange={() => handleStatusToggle(row._id, row.isActive)}
                                                    color="primary"
                                                    disabled={row._id === currentUser?._id}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Box>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>
        </Box>
    );
}

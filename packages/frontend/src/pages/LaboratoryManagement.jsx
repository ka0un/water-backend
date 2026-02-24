import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const LaboratoryManagement = () => {
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLab, setCurrentLab] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    operatingHours: '',
    capacity: '',
    certifications: '',
    equipmentList: '',
    description: '',
    status: 'active',
  });

  const [filters, setFilters] = useState({
    status: 'active',
    search: '',
  });

  // Fetch laboratories
  useEffect(() => {
    fetchLaboratories();
  }, [filters]);

  const fetchLaboratories = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/admin/laboratories`,
        {
          params: {
            status: filters.status || undefined,
            search: filters.search || undefined,
            page: 1,
            limit: 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLaboratories(response.data.data.laboratories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch laboratories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (lab = null) => {
    if (lab) {
      setIsEditing(true);
      setCurrentLab(lab);
      setFormData({
        name: lab.name,
        location: lab.location,
        email: lab.email,
        phone: lab.phone,
        address: lab.address,
        city: lab.city,
        postalCode: lab.postalCode,
        country: lab.country,
        operatingHours: lab.operatingHours,
        capacity: lab.capacity,
        certifications: lab.certifications.join(', '),
        equipmentList: lab.equipmentList.join(', '),
        description: lab.description || '',
        status: lab.status,
      });
    } else {
      setIsEditing(false);
      setCurrentLab(null);
      setFormData({
        name: '',
        location: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        operatingHours: '',
        capacity: '',
        certifications: '',
        equipmentList: '',
        description: '',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setCurrentLab(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        certifications: formData.certifications
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c),
        equipmentList: formData.equipmentList
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e),
      };

      if (isEditing && currentLab) {
        // Update
        await axios.put(
          `${API_BASE_URL}/admin/laboratories/${currentLab._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSuccess('Laboratory updated successfully');
      } else {
        // Create
        await axios.post(
          `${API_BASE_URL}/admin/laboratories`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSuccess('Laboratory created successfully');
      }

      handleCloseDialog();
      fetchLaboratories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save laboratory');
    }
  };

  const handleDelete = async (labId) => {
    if (window.confirm('Are you sure you want to deactivate this laboratory?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${API_BASE_URL}/admin/laboratories/${labId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSuccess('Laboratory deactivated successfully');
        fetchLaboratories();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete laboratory');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <h2>Laboratory Management</h2>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Laboratory
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Search by name, location, or city..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Capacity</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {laboratories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No laboratories found
                  </TableCell>
                </TableRow>
              ) : (
                laboratories.map((lab) => (
                  <TableRow key={lab._id} hover>
                    <TableCell>{lab.name}</TableCell>
                    <TableCell>{lab.location}</TableCell>
                    <TableCell>{lab.email}</TableCell>
                    <TableCell>{lab.capacity}</TableCell>
                    <TableCell>
                      <Chip
                        label={lab.status}
                        color={lab.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(lab)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(lab._id)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Laboratory' : 'Add New Laboratory'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            fullWidth
            label="Laboratory Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="City"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Postal Code"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Operating Hours"
            name="operatingHours"
            value={formData.operatingHours}
            onChange={handleInputChange}
            placeholder="e.g., 9 AM - 5 PM"
            required
          />
          <TextField
            fullWidth
            label="Capacity"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label="Certifications (comma-separated)"
            name="certifications"
            value={formData.certifications}
            onChange={handleInputChange}
            placeholder="ISO 9001, ISO 17025"
          />
          <TextField
            fullWidth
            label="Equipment List (comma-separated)"
            name="equipmentList"
            value={formData.equipmentList}
            onChange={handleInputChange}
            multiline
            rows={2}
            placeholder="Microscope, Centrifuge"
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={2}
          />
          {isEditing && (
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LaboratoryManagement;

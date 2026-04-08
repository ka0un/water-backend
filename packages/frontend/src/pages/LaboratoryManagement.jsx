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
  DialogContentText,
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
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, DeleteForever as DeleteForeverIcon } from '@mui/icons-material';
import { api } from '../context/AuthContext';

const LaboratoryManagement = () => {
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLab, setCurrentLab] = useState(null);

  // Delete Confirmation Dialog State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [labToDelete, setLabToDelete] = useState(null);

  // Permanent Delete Confirmation Dialog State
  const [openPermanentDeleteDialog, setOpenPermanentDeleteDialog] = useState(false);
  const [labToPermanentlyDelete, setLabToPermanentlyDelete] = useState(null);

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

  const [formErrors, setFormErrors] = useState({
    email: '',
    phone: '',
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
      const response = await api.get(
        `/admin/laboratories`,
        {
          params: {
            status: filters.status || undefined,
            search: filters.search || undefined,
            page: 1,
            limit: 100,
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
    setFormErrors({ email: '', phone: '' });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setCurrentLab(null);
    setFormErrors({ email: '', phone: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Pre-validation
    const emailRegex = /.+@.+\..+/;
    const phoneRegex = /^[0-9]{10}$/;
    
    let hasErrors = false;
    const newErrors = { email: '', phone: '' };

    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }

    try {
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
        await api.put(
          `/admin/laboratories/${currentLab._id}`,
          payload
        );
        setSuccess('Laboratory updated successfully');
      } else {
        // Create
        await api.post(
          `/admin/laboratories`,
          payload
        );
        setSuccess('Laboratory created successfully');
        // Clear the search bar so the newly added lab shows up
        setFilters(prev => ({ ...prev, search: '' }));
      }

      handleCloseDialog();
      fetchLaboratories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save laboratory');
    }
  };

  const handleDeleteClick = (lab) => {
    setLabToDelete(lab);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!labToDelete) return;
    
    try {
      await api.delete(`/admin/laboratories/${labToDelete._id}`);
      setSuccess('Laboratory deactivated successfully');
      fetchLaboratories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete laboratory');
    } finally {
      setOpenDeleteDialog(false);
      setLabToDelete(null);
    }
  };

  const handlePermanentDeleteClick = (lab) => {
    setLabToPermanentlyDelete(lab);
    setOpenPermanentDeleteDialog(true);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!labToPermanentlyDelete) return;

    try {
      await api.delete(`/admin/laboratories/${labToPermanentlyDelete._id}/permanent`);
      setSuccess('Laboratory permanently deleted successfully');
      fetchLaboratories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to permanently delete laboratory');
    } finally {
      setOpenPermanentDeleteDialog(false);
      setLabToPermanentlyDelete(null);
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
              type="search"
              autoComplete="off"
              name="laboratory_search"
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
                        onClick={() => handleDeleteClick(lab)}
                        title="Deactivate"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: '#d32f2f' }}
                        onClick={() => handlePermanentDeleteClick(lab)}
                        title="Permanent Delete"
                      >
                        <DeleteForeverIcon />
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
            error={!!formErrors.email}
            helperText={formErrors.email}
            required
          />
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            error={!!formErrors.phone}
            helperText={formErrors.phone}
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

      {/* Confirmation Dialog for Delete/Deactivate */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Deactivate Laboratory?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate the laboratory <strong>{labToDelete?.name}</strong>? 
            This action can be reversed later if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            color="inherit" 
            variant="text"
            sx={{ fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            disableElevation
            sx={{ borderRadius: 1.5, fontWeight: 600 }}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Permanent Delete */}
      <Dialog
        open={openPermanentDeleteDialog}
        onClose={() => setOpenPermanentDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '2px solid #d32f2f',
          }
        }}
      >
        <Box sx={{ bgcolor: 'error.main', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteForeverIcon />
          <DialogTitle sx={{ p: 0, fontWeight: 'bold' }}>
            PERMANENT DELETE
          </DialogTitle>
        </Box>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText color="error.dark" sx={{ fontWeight: 500, mb: 1 }}>
            WARNING: This action cannot be undone!
          </DialogContentText>
          <DialogContentText>
            Are you sure you want to <strong>permanently delete</strong> the laboratory <strong>{labToPermanentlyDelete?.name}</strong>? 
            All associated data will be lost forever.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenPermanentDeleteDialog(false)} 
            color="inherit" 
            variant="text"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmPermanentDelete} 
            variant="contained" 
            color="error"
            autoFocus
            sx={{ 
              borderRadius: 1.5, 
              fontWeight: 'bold',
              px: 3,
              '&:hover': { bgcolor: '#b71c1c' }
            }}
          >
            DELETE FOREVER
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LaboratoryManagement;

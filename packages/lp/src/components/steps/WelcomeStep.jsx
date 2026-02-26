import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Card, List, ListItemButton, ListItemText, Chip, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReplayIcon from '@mui/icons-material/Replay';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

export default function WelcomeStep({ onNext }) {
    const { nic, setNic, startNewReport, checkExistingReports, resumeReport, existingReports, loading, error, setError } = useWizard();
    const [inputNic, setInputNic] = useState(nic || '');
    const [checked, setChecked] = useState(false);
    const [nicError, setNicError] = useState('');
    const [viewingReport, setViewingReport] = useState(null);

    const nicPattern = /^([0-9]{9}[VvXx]|[0-9]{12})$/;

    const validateNic = (value) => {
        if (!value.trim()) return 'Please enter your NIC number';
        if (!nicPattern.test(value.trim())) return 'Enter a valid NIC (e.g., 901234567V or 200012345678)';
        return '';
    };

    const handleCheck = async () => {
        const err = validateNic(inputNic);
        if (err) {
            setNicError(err);
            return;
        }
        setNicError('');
        setError(null);
        const reports = await checkExistingReports(inputNic.trim());
        setChecked(true);

        const inProgress = reports.filter(r => !r.wizardCompleted);
        if (inProgress.length === 0 && reports.filter(r => r.wizardCompleted).length === 0) {
            try {
                await startNewReport(inputNic.trim());
                onNext();
            } catch (err) {
                // error handled in context, clear the checked state to prevent showing empty lists
                setChecked(false);
            }
        }
    };

    const handleResume = async (report) => {
        await resumeReport(report);
        onNext();
    };

    const handleStartNew = async () => {
        try {
            await startNewReport(inputNic.trim());
            onNext();
        } catch (err) {
            // error is handled and set in context, which then displays in the Alert below
            setNicError('');
        }
    };

    const inProgressReports = existingReports.filter(r => !r.wizardCompleted);
    const completedReports = existingReports.filter(r => r.wizardCompleted);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusChip = (status) => {
        const map = {
            pending: { label: 'Pending Review', color: 'warning' },
            approved: { label: 'Approved', color: 'success' },
            rejected: { label: 'Rejected', color: 'error' },
        };
        const cfg = map[status] || map.pending;
        return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
    };

    return (
        <StepLayout
            title="Report a Water Quality Issue"
            subtitle="Help us monitor and improve water safety in your community. No account needed — just your NIC number to get started."
            stepNumber={0}
            showProgress={false}
            hideBack
        >
            <Box sx={{ mt: 2 }}>
                {/* Water icon */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            width: 64, height: 64, borderRadius: '50%',
                            bgcolor: 'rgba(21, 101, 192, 0.08)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <WaterDropIcon sx={{ fontSize: 32, color: '#1565C0' }} />
                    </Box>
                </Box>

                {/* NIC Input */}
                <TextField
                    fullWidth
                    label="National ID Card Number"
                    placeholder="e.g., 901234567V or 200012345678"
                    value={inputNic}
                    onChange={(e) => {
                        setInputNic(e.target.value);
                        setNicError('');
                        setChecked(false);
                    }}
                    error={!!nicError}
                    helperText={nicError || 'Your NIC helps us track your submission'}
                    disabled={loading}
                    sx={{ mb: 3 }}
                    inputProps={{ maxLength: 12 }}
                />

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                )}

                {/* In-progress reports */}
                {checked && inProgressReports.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card sx={{ p: 2, mb: 2, bgcolor: 'rgba(21, 101, 192, 0.04)', border: '1px solid rgba(21, 101, 192, 0.15)' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                📋 In-Progress Reports
                            </Typography>
                            <List dense>
                                {inProgressReports.map((report) => (
                                    <ListItemButton
                                        key={report._id}
                                        onClick={() => handleResume(report)}
                                        sx={{
                                            borderRadius: 2, mb: 0.5, bgcolor: '#FFFFFF', border: '1px solid #E8ECF0',
                                            '&:hover': { bgcolor: 'rgba(21, 101, 192, 0.04)' },
                                        }}
                                    >
                                        <ListItemText
                                            primary={`${report.waterSource || 'Not specified'} — Step ${report.currentStep}`}
                                            secondary={`Started: ${formatDate(report.createdAt)}`}
                                        />
                                        <Chip label="Resume" size="small" icon={<ReplayIcon />} color="primary" variant="outlined" />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Card>
                    </motion.div>
                )}

                {/* Completed reports */}
                {checked && completedReports.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card sx={{ p: 2, mb: 2, border: '1px solid #E8ECF0' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                ✅ Past Submissions
                            </Typography>
                            <List dense>
                                {completedReports.map((report) => (
                                    <ListItemButton
                                        key={report._id}
                                        onClick={() => setViewingReport(viewingReport === report._id ? null : report._id)}
                                        sx={{
                                            borderRadius: 2, mb: 0.5, bgcolor: '#FFFFFF', border: '1px solid #E8ECF0',
                                            '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.04)' },
                                        }}
                                    >
                                        <ListItemText
                                            primary={`${report.waterSource || 'Report'} — ${formatDate(report.completedAt || report.updatedAt)}`}
                                            secondary={`Submitted: ${formatDate(report.completedAt || report.updatedAt)}`}
                                        />
                                        {getStatusChip(report.mod_status)}
                                    </ListItemButton>
                                ))}
                            </List>
                        </Card>
                    </motion.div>
                )}

                {/* Start new report button */}
                {checked && (inProgressReports.length > 0 || completedReports.length > 0) && (
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={handleStartNew}
                        disabled={loading}
                        sx={{ mb: 2, py: 1.6 }}
                    >
                        Start a New Report
                    </Button>
                )}

                {/* Initial get started button */}
                {!checked && (
                    <Button
                        fullWidth variant="contained" size="large"
                        onClick={handleCheck}
                        disabled={loading || !inputNic.trim()}
                        endIcon={<ArrowForwardIcon />}
                        sx={{ py: 1.8, fontSize: '1.1rem' }}
                    >
                        {loading ? 'Starting...' : 'Get Started'}
                    </Button>
                )}
            </Box>
        </StepLayout>
    );
}

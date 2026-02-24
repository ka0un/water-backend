import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Card, List, ListItemButton, ListItemText, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReplayIcon from '@mui/icons-material/Replay';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

export default function WelcomeStep({ onNext }) {
    const { nic, setNic, startNewReport, checkExistingReports, resumeReport, existingReports, loading, error, setError } = useWizard();
    const [inputNic, setInputNic] = useState(nic || '');
    const [checked, setChecked] = useState(false);
    const [nicError, setNicError] = useState('');

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
        if (inProgress.length === 0) {
            try {
                await startNewReport(inputNic.trim());
                onNext();
            } catch {
                // error handled in context
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
        } catch {
            // error handled in context
        }
    };

    const inProgressReports = existingReports.filter(r => !r.wizardCompleted);

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
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: 'rgba(21, 101, 192, 0.08)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* If in-progress reports found */}
                {checked && inProgressReports.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card sx={{ p: 2, mb: 3, bgcolor: 'rgba(21, 101, 192, 0.04)', border: '1px solid rgba(21, 101, 192, 0.15)' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                                📋 You have an in-progress report
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Would you like to continue where you left off?
                            </Typography>
                            <List dense>
                                {inProgressReports.map((report) => (
                                    <ListItemButton
                                        key={report._id}
                                        onClick={() => handleResume(report)}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 0.5,
                                            bgcolor: '#FFFFFF',
                                            border: '1px solid #E8ECF0',
                                            '&:hover': { bgcolor: 'rgba(21, 101, 192, 0.04)' },
                                        }}
                                    >
                                        <ListItemText
                                            primary={`${report.waterSource || 'Not specified'} — Step ${report.currentStep}`}
                                            secondary={`Started: ${new Date(report.createdAt).toLocaleDateString()}`}
                                        />
                                        <Chip label="Resume" size="small" icon={<ReplayIcon />} color="primary" variant="outlined" />
                                    </ListItemButton>
                                ))}
                            </List>
                            <Button
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={handleStartNew}
                                sx={{ mt: 1 }}
                                disabled={loading}
                            >
                                Start a new report instead
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {/* Continue Button */}
                {!checked && (
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
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

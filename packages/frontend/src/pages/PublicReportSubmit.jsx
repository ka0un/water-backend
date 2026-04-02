import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, AppBar, Toolbar, Button, Container, TextField, Card, CardContent,
    Stack, IconButton, CircularProgress, Alert, MenuItem, Stepper, Step, StepLabel, Select, InputLabel, FormControl
} from '@mui/material';
import { ArrowBack, Assessment as AssessmentIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { createPublicReport, updatePublicReport, submitPublicReport, uploadPublicReportImage } from '../services/publicReportService';

const WATER_SOURCES = ['well', 'river', 'lake', 'tap', 'tank', 'canal', 'spring', 'rainwater', 'borehole', 'other'];

export default function PublicReportSubmit() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [reportId, setReportId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [nic, setNic] = useState('');
    const [waterSource, setWaterSource] = useState('');
    const [location, setLocation] = useState({ district: '', city: '', address: '' });
    const [appearance, setAppearance] = useState('');
    const [turbidity, setTurbidity] = useState('');
    const [image, setImage] = useState(null);

    const steps = ['Identity', 'Details', 'Photo (Optional)', 'Review'];

    const handleNext = async () => {
        setError(null);
        setLoading(true);
        try {
            if (activeStep === 0) {
                // Step 1: Create wizard
                if (!nic.trim()) throw new Error('NIC is required');
                const report = await createPublicReport(nic.trim());
                setReportId(report._id);
            } else if (activeStep === 1) {
                // Step 2: Save details
                if (!waterSource) throw new Error('Water source type is required');
                if (!location.district || !location.city) throw new Error('District and City are required');
                
                await updatePublicReport(reportId, {
                    waterSource,
                    location: { ...location },
                    appearance: { value: appearance, notes: '' },
                    turbidity: { value: turbidity },
                    currentStep: 2
                });
            } else if (activeStep === 2) {
                // Step 3: Image upload (optional)
                if (image) {
                    const formData = new FormData();
                    formData.append('imageType', 'water_source');
                    formData.append('images', image);
                    await uploadPublicReportImage(reportId, formData);
                }
            } else if (activeStep === steps.length - 1) {
                // Final submit
                await submitPublicReport(reportId);
                navigate('/track', { state: { message: 'Report submitted successfully!' } });
                return;
            }
            setActiveStep((prev) => prev + 1);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setError(null);
        setActiveStep((prev) => prev - 1);
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F5F7FA' }}>
            <AppBar position="static" elevation={1} sx={{ bgcolor: '#fff', color: '#1A2027' }}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => navigate('/')} aria-label="back" sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>
                        <AssessmentIcon sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
                        Submit Water Report
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ flexGrow: 1, py: { xs: 4, md: 8 } }}>
                <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #E0E0E0' }}>
                    <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

                        <Box sx={{ minHeight: 250 }}>
                            {/* Step 0: Identity */}
                            {activeStep === 0 && (
                                <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Provide Your NIC</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                        To maintain data integrity, we require a valid National Identity Card number.
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        label="NIC Number"
                                        placeholder="e.g. 901234567V or 200012345678"
                                        value={nic}
                                        onChange={(e) => setNic(e.target.value)}
                                        required
                                    />
                                </Box>
                            )}

                            {/* Step 1: Details */}
                            {activeStep === 1 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Observations & Location</Typography>
                                    
                                    <FormControl fullWidth required>
                                        <InputLabel>Water Source Type</InputLabel>
                                        <Select value={waterSource} label="Water Source Type" onChange={(e) => setWaterSource(e.target.value)}>
                                            {WATER_SOURCES.map((s) => (
                                                <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth label="District" required value={location.district} onChange={(e) => setLocation({ ...location, district: e.target.value })} />
                                        <TextField fullWidth label="City/Town" required value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} />
                                    </Stack>

                                    <TextField fullWidth label="Specific Address / Area (Optional)" value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })} />

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <FormControl fullWidth>
                                            <InputLabel>Visual Appearance</InputLabel>
                                            <Select value={appearance} label="Visual Appearance" onChange={(e) => setAppearance(e.target.value)}>
                                                <MenuItem value=""><em>None Selected</em></MenuItem>
                                                <MenuItem value="Clear">Clear</MenuItem>
                                                <MenuItem value="Cloudy">Cloudy</MenuItem>
                                                <MenuItem value="Muddy">Muddy</MenuItem>
                                                <MenuItem value="Colored">Colored/Tinted</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel>Turbidity / Murkiness</InputLabel>
                                            <Select value={turbidity} label="Turbidity / Murkiness" onChange={(e) => setTurbidity(e.target.value)}>
                                                <MenuItem value=""><em>None Selected</em></MenuItem>
                                                <MenuItem value="Low">Low (Transparent)</MenuItem>
                                                <MenuItem value="Medium">Medium (Slightly hazy)</MenuItem>
                                                <MenuItem value="High">High (Completely opaque)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Box>
                            )}

                            {/* Step 2: Photo */}
                            {activeStep === 2 && (
                                <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Upload a Photo</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                        Providing a clear picture of the water source helps our moderators significantly.
                                    </Typography>
                                    
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        sx={{ py: 4, borderStyle: 'dashed', borderWidth: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }}
                                    >
                                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                                        <Typography sx={{ textTransform: 'none', color: 'text.primary', fontWeight: 600 }}>
                                            {image ? image.name : 'Click to select an image'}
                                        </Typography>
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={(e) => setImage(e.target.files[0])}
                                        />
                                    </Button>
                                    {image && (
                                        <Button size="small" color="error" sx={{ mt: 1, textTransform: 'none' }} onClick={() => setImage(null)}>
                                            Remove Image
                                        </Button>
                                    )}
                                </Box>
                            )}

                            {/* Step 3: Review */}
                            {activeStep === 3 && (
                                <Box textAlign="center">
                                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#2E7D32' }}>Ready to Submit!</Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                                        Thank you for your contribution! Once you submit, your report will be sent to our moderation queue. You can track its progress using your NIC.
                                    </Typography>
                                    <Box sx={{ textAlign: 'left', bgcolor: '#F5F5F5', p: 3, borderRadius: 2 }}>
                                        <Typography variant="subtitle2">NIC: {nic}</Typography>
                                        <Typography variant="subtitle2">Source: {waterSource} in {location.city}</Typography>
                                        <Typography variant="subtitle2">Image: {image ? 'Attached' : 'None'}</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #EEE' }}>
                            <Button disabled={activeStep === 0 || loading} onClick={handleBack} sx={{ textTransform: 'none' }}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 600 }}
                            >
                                {activeStep === steps.length - 1 ? 'Submit Report' : 'Next'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

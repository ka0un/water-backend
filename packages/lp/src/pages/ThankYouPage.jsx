import { Box, Typography, Button, Container, Card } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function ThankYouPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reportId = searchParams.get('id');

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#F5F7FA' }}>
            <Container maxWidth="sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <Card sx={{ p: 5, textAlign: 'center' }}>
                        {/* Success checkmark */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
                        </motion.div>

                        <Typography variant="h3" sx={{ mb: 2, color: 'text.primary' }}>
                            Thank You!
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 1, color: 'text.secondary', lineHeight: 1.7 }}>
                            Your water quality report has been submitted successfully.
                            Our team will review it shortly.
                        </Typography>

                        {reportId && (
                            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                                Report ID: <strong style={{ color: '#1565C0' }}>{reportId}</strong>
                            </Typography>
                        )}

                        <Card sx={{ p: 2, mb: 3, bgcolor: 'rgba(46, 125, 50, 0.06)', border: '1px solid rgba(46, 125, 50, 0.2)' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                ✅ Your report is now <strong>pending review</strong>. A moderator will verify the information you provided.
                            </Typography>
                        </Card>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                startIcon={<HomeIcon />}
                                onClick={() => navigate('/')}
                            >
                                Back to Home
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => navigate('/report')}
                            >
                                Submit Another Report
                            </Button>
                        </Box>
                    </Card>
                </motion.div>
            </Container>
        </Box>
    );
}

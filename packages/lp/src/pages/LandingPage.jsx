import { Box, Typography, Button, Container, Card } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupsIcon from '@mui/icons-material/Groups';

const features = [
    {
        icon: <WaterDropIcon sx={{ fontSize: 36, color: '#1565C0' }} />,
        title: 'Report Issues',
        desc: 'Easily report water quality problems in your area — no login needed.',
    },
    {
        icon: <VerifiedUserIcon sx={{ fontSize: 36, color: '#2E7D32' }} />,
        title: 'Expert Review',
        desc: 'Every report is reviewed by trained moderators and experts.',
    },
    {
        icon: <SpeedIcon sx={{ fontSize: 36, color: '#0277BD' }} />,
        title: 'Quick & Simple',
        desc: 'Just answer a few visual questions. Takes less than 5 minutes.',
    },
    {
        icon: <GroupsIcon sx={{ fontSize: 36, color: '#ED6C02' }} />,
        title: 'Community Driven',
        desc: 'Help protect your community by contributing water quality data.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA' }}>
            {/* Header Bar */}
            <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E8ECF0', py: 2, px: 3 }}>
                <Container maxWidth="md">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WaterDropIcon sx={{ color: '#1565C0', fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A2027' }}>
                            Water Quality Monitor
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Hero Section */}
            <Container maxWidth="md">
                <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                bgcolor: 'rgba(21, 101, 192, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}
                        >
                            <WaterDropIcon sx={{ fontSize: 36, color: '#1565C0' }} />
                        </Box>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                    >
                        <Typography
                            variant="h1"
                            sx={{
                                mb: 2,
                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                color: '#1A2027',
                            }}
                        >
                            Is Your Water Safe?
                        </Typography>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                mb: 5,
                                color: 'text.secondary',
                                maxWidth: 520,
                                mx: 'auto',
                                fontWeight: 400,
                                lineHeight: 1.7,
                            }}
                        >
                            Report water quality issues in your area. It takes just a few minutes
                            and helps protect your community.
                        </Typography>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.6 }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/report')}
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                py: 1.8,
                                px: 5,
                                fontSize: '1.1rem',
                                borderRadius: 2.5,
                            }}
                        >
                            Report a Water Issue
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                            No account needed — just your NIC number
                        </Typography>
                    </motion.div>
                </Box>

                {/* Feature Cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: 2.5,
                        pb: 10,
                    }}
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                        >
                            <Card
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    height: '100%',
                                    transition: 'box-shadow 0.2s',
                                    '&:hover': {
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                    },
                                }}
                            >
                                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '0.95rem', color: 'text.primary' }}>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                    {feature.desc}
                                </Typography>
                            </Card>
                        </motion.div>
                    ))}
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', py: 4, borderTop: '1px solid #E8ECF0', bgcolor: '#FFFFFF' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Water Quality Monitoring System &copy; {new Date().getFullYear()}
                </Typography>
            </Box>
        </Box>
    );
}

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
        icon: <WaterDropIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
        title: 'Report Issues',
        desc: 'Easily report water quality problems in your area — no login needed.',
    },
    {
        icon: <VerifiedUserIcon sx={{ fontSize: 40, color: 'success.main' }} />,
        title: 'Expert Review',
        desc: 'Every report is reviewed by trained moderators and experts.',
    },
    {
        icon: <SpeedIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
        title: 'Quick & Simple',
        desc: 'Just answer a few visual questions. Takes less than 5 minutes.',
    },
    {
        icon: <GroupsIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
        title: 'Community Driven',
        desc: 'Help protect your community by contributing water quality data.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Hero Section */}
            <Container maxWidth="md">
                <Box
                    sx={{
                        py: { xs: 8, md: 14 },
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Animated Water Drop */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <Typography sx={{ fontSize: { xs: 64, md: 80 }, mb: 2, lineHeight: 1 }}>
                            💧
                        </Typography>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <Typography
                            variant="h1"
                            sx={{
                                mb: 2,
                                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
                                background: 'linear-gradient(135deg, #CAF0F8 0%, #00B4D8 50%, #90E0EF 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            Is Your Water Safe?
                        </Typography>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
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
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/report')}
                            endIcon={<ArrowForwardIcon />}
                            sx={{
                                py: 2,
                                px: 6,
                                fontSize: '1.2rem',
                                borderRadius: 3,
                                boxShadow: '0 8px 40px rgba(0, 180, 216, 0.4)',
                            }}
                        >
                            Report a Water Issue
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
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
                        gap: 3,
                        pb: 10,
                    }}
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1 + i * 0.15, duration: 0.6 }}
                        >
                            <Card
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    height: '100%',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        boxShadow: '0 12px 40px rgba(0,180,216,0.15)',
                                    },
                                }}
                            >
                                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '1rem' }}>
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
            <Box sx={{ textAlign: 'center', py: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Water Quality Monitoring System &copy; {new Date().getFullYear()}
                </Typography>
            </Box>
        </Box>
    );
}

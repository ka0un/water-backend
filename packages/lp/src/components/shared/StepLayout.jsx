import { Box, Typography, LinearProgress, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useWizard } from '../../context/WizardContext';

/**
 * Consistent wrapper for every wizard step.
 * Shows title, progress bar, navigation, and auto-save indicator.
 */
export default function StepLayout({
    title,
    subtitle,
    children,
    onBack,
    stepNumber,
    totalSteps = 22,
    showProgress = true,
    hideBack = false,
}) {
    const { saving } = useWizard();
    const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
        >
            <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
                {/* Progress Bar */}
                {showProgress && (
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                Step {stepNumber} of {totalSteps}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {saving && (
                                    <Chip
                                        icon={<SaveIcon sx={{ fontSize: 14 }} />}
                                        label="Saving..."
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(21,101,192,0.08)',
                                            color: 'primary.main',
                                            fontSize: '0.75rem',
                                            height: 24,
                                        }}
                                    />
                                )}
                                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.85rem' }}>
                                    {Math.round(progress)}%
                                </Typography>
                            </Box>
                        </Box>
                        <LinearProgress variant="determinate" value={progress} />
                    </Box>
                )}

                {/* Back Button */}
                {!hideBack && onBack && (
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                        sx={{
                            mb: 2,
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main', bgcolor: 'rgba(21,101,192,0.04)' },
                        }}
                    >
                        Back
                    </Button>
                )}

                {/* Title */}
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>
                        {subtitle}
                    </Typography>
                )}

                {/* Step Content */}
                <Box sx={{ mt: 2 }}>
                    {children}
                </Box>
            </Box>
        </motion.div>
    );
}

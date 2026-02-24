import { Box, Typography, Button, Card } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

/**
 * Yes/No question card with large, tappable buttons.
 * Used for initial detection questions like "Is oil present?"
 */
export default function QuestionCard({
    question,
    icon,
    description,
    value,
    onChange,
    yesLabel = 'Yes',
    noLabel = 'No',
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card
                sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'rgba(17, 34, 64, 0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Icon */}
                {icon && (
                    <Box sx={{ mb: 2, fontSize: 48, lineHeight: 1 }}>
                        {typeof icon === 'string' ? (
                            <span style={{ fontSize: 48 }}>{icon}</span>
                        ) : (
                            icon
                        )}
                    </Box>
                )}

                {/* Question */}
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                    {question}
                </Typography>
                {description && (
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                        {description}
                    </Typography>
                )}

                {/* Yes/No Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant={value === true ? 'contained' : 'outlined'}
                        size="large"
                        startIcon={<CheckCircleOutlineIcon />}
                        onClick={() => onChange(true)}
                        sx={{
                            flex: 1,
                            maxWidth: 200,
                            py: 2,
                            fontSize: '1.1rem',
                            borderColor: value === true ? 'primary.main' : 'rgba(255,255,255,0.15)',
                            bgcolor: value === true ? undefined : 'transparent',
                            color: value === true ? 'white' : 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: value === true ? undefined : 'rgba(0,180,216,0.08)',
                            },
                        }}
                    >
                        {yesLabel}
                    </Button>
                    <Button
                        variant={value === false ? 'contained' : 'outlined'}
                        size="large"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={() => onChange(false)}
                        sx={{
                            flex: 1,
                            maxWidth: 200,
                            py: 2,
                            fontSize: '1.1rem',
                            borderColor: value === false ? 'error.main' : 'rgba(255,255,255,0.15)',
                            bgcolor: value === false ? 'rgba(255,82,82,0.2)' : 'transparent',
                            color: value === false ? 'error.light' : 'text.primary',
                            '&:hover': {
                                borderColor: 'error.main',
                                bgcolor: 'rgba(255,82,82,0.1)',
                            },
                            ...(value === false && {
                                background: 'linear-gradient(135deg, rgba(255,82,82,0.3) 0%, rgba(255,82,82,0.15) 100%)',
                            }),
                        }}
                    >
                        {noLabel}
                    </Button>
                </Box>
            </Card>
        </motion.div>
    );
}

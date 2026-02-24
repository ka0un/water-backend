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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <Card
                sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E8ECF0',
                }}
            >
                {/* Icon */}
                {icon && (
                    <Box sx={{ mb: 2, fontSize: 44, lineHeight: 1 }}>
                        {typeof icon === 'string' ? (
                            <span style={{ fontSize: 44 }}>{icon}</span>
                        ) : (
                            icon
                        )}
                    </Box>
                )}

                {/* Question */}
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
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
                            borderColor: value === true ? 'primary.main' : '#CFD8DC',
                            color: value === true ? '#FFFFFF' : 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: value === true ? 'primary.dark' : 'rgba(21, 101, 192, 0.04)',
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
                        color={value === false ? 'error' : 'inherit'}
                        sx={{
                            flex: 1,
                            maxWidth: 200,
                            py: 2,
                            fontSize: '1.1rem',
                            borderColor: value === false ? 'error.main' : '#CFD8DC',
                            color: value === false ? '#FFFFFF' : 'text.primary',
                            '&:hover': {
                                borderColor: 'error.main',
                                bgcolor: value === false ? 'error.dark' : 'rgba(211, 47, 47, 0.04)',
                            },
                        }}
                    >
                        {noLabel}
                    </Button>
                </Box>
            </Card>
        </motion.div>
    );
}

import { Box, Typography, Card, CardActionArea } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Grid of selectable option cards with optional icons/images.
 * Used for questions like "What type of water source?"
 */
export default function OptionGrid({
    options,
    selected,
    onSelect,
    columns = 2,
    multiSelect = false,
}) {
    const handleSelect = (value) => {
        if (multiSelect) {
            const current = Array.isArray(selected) ? selected : [];
            const updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            onSelect(updated);
        } else {
            onSelect(value);
        }
    };

    const isSelected = (value) => {
        if (multiSelect) {
            return Array.isArray(selected) && selected.includes(value);
        }
        return selected === value;
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: `repeat(${columns}, 1fr)` },
                gap: 2,
            }}
        >
            {options.map((option, index) => (
                <motion.div
                    key={option.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <Card
                        sx={{
                            position: 'relative',
                            overflow: 'visible',
                            border: isSelected(option.value)
                                ? '2px solid'
                                : '2px solid transparent',
                            borderColor: isSelected(option.value)
                                ? 'primary.main'
                                : 'transparent',
                            bgcolor: isSelected(option.value)
                                ? 'rgba(0, 180, 216, 0.12)'
                                : 'rgba(17, 34, 64, 0.6)',
                            transition: 'all 0.25s ease',
                            '&:hover': {
                                borderColor: 'primary.dark',
                                bgcolor: 'rgba(0, 180, 216, 0.06)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        <CardActionArea
                            onClick={() => handleSelect(option.value)}
                            sx={{ p: 2.5, textAlign: 'center' }}
                        >
                            {/* Selected checkmark */}
                            {isSelected(option.value) && (
                                <CheckCircleIcon
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: 'primary.main',
                                        fontSize: 22,
                                    }}
                                />
                            )}

                            {/* Icon */}
                            {option.icon && (
                                <Box sx={{ mb: 1.5, fontSize: 36, lineHeight: 1 }}>
                                    {typeof option.icon === 'string' ? (
                                        <span style={{ fontSize: 36 }}>{option.icon}</span>
                                    ) : (
                                        option.icon
                                    )}
                                </Box>
                            )}

                            {/* Label */}
                            <Typography
                                variant="body1"
                                sx={{
                                    fontWeight: isSelected(option.value) ? 600 : 500,
                                    color: isSelected(option.value) ? 'primary.light' : 'text.primary',
                                    fontSize: '0.95rem',
                                }}
                            >
                                {option.label}
                            </Typography>

                            {/* Description */}
                            {option.description && (
                                <Typography
                                    variant="body2"
                                    sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}
                                >
                                    {option.description}
                                </Typography>
                            )}
                        </CardActionArea>
                    </Card>
                </motion.div>
            ))}
        </Box>
    );
}

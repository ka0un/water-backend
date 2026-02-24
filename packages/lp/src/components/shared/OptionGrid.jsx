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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                    <Card
                        sx={{
                            position: 'relative',
                            overflow: 'visible',
                            border: isSelected(option.value)
                                ? '2px solid'
                                : '1px solid',
                            borderColor: isSelected(option.value)
                                ? 'primary.main'
                                : '#E8ECF0',
                            bgcolor: isSelected(option.value)
                                ? 'rgba(21, 101, 192, 0.06)'
                                : '#FFFFFF',
                            boxShadow: isSelected(option.value)
                                ? '0 0 0 3px rgba(21, 101, 192, 0.12)'
                                : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isSelected(option.value) ? 'primary.main' : '#B0BEC5',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
                                        fontSize: 20,
                                    }}
                                />
                            )}

                            {/* Icon */}
                            {option.icon && (
                                <Box sx={{ mb: 1.5, fontSize: 32, lineHeight: 1 }}>
                                    {typeof option.icon === 'string' ? (
                                        <span style={{ fontSize: 32 }}>{option.icon}</span>
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
                                    color: isSelected(option.value) ? 'primary.dark' : 'text.primary',
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

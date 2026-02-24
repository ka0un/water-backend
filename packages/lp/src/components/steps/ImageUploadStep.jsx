import { useState, useRef } from 'react';
import { Box, Button, Typography, Card, IconButton, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import * as reportApi from '../../api/reportApi';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function ImageUploadCard({ title, subtitle, icon, imageType, images, onAdd, onRemove }) {
    const fileInputRef = useRef(null);
    const existing = images.filter(img => img.imageType === imageType);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                alert(`${file.name} is too large. Maximum size is 5MB.`);
                continue;
            }
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file.`);
                continue;
            }
            const base64 = await fileToBase64(file);
            onAdd({
                imageType,
                data: base64,
                contentType: file.type,
                filename: file.name,
            });
        }
        e.target.value = '';
    };

    return (
        <Card sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                {icon}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>
                </Box>
            </Box>

            {/* Preview existing images */}
            {existing.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2 }}>
                    {existing.map((img, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.12 }}>
                            <Box sx={{ position: 'relative', width: 80, height: 80, borderRadius: 2, overflow: 'hidden', border: '1px solid #E8ECF0' }}>
                                <img
                                    src={`data:${img.contentType};base64,${img.data}`}
                                    alt={img.filename || imageType}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={() => onRemove(img)}
                                    sx={{
                                        position: 'absolute', top: 2, right: 2,
                                        bgcolor: 'rgba(255,255,255,0.9)', width: 22, height: 22,
                                        '&:hover': { bgcolor: '#FFF' },
                                    }}
                                >
                                    <DeleteOutlineIcon sx={{ fontSize: 14, color: 'error.main' }} />
                                </IconButton>
                            </Box>
                        </motion.div>
                    ))}
                </Box>
            )}

            {/* Upload button */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileSelect}
            />
            <Button
                variant="outlined"
                startIcon={<AddPhotoAlternateOutlinedIcon />}
                onClick={() => fileInputRef.current?.click()}
                size="small"
                sx={{ mt: 1 }}
            >
                {existing.length > 0 ? 'Add More Photos' : 'Select Photos'}
            </Button>
        </Card>
    );
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // strip data:xxx;base64, prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function ImageUploadStep({ onNext, onBack, stepNumber }) {
    const { reportId } = useWizard();
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleAdd = (img) => {
        if (images.length >= 10) {
            setError('Maximum 10 images per report');
            return;
        }
        setImages(prev => [...prev, img]);
        setError(null);
    };

    const handleRemove = (img) => {
        setImages(prev => prev.filter(i => i !== img));
    };

    const handleNext = async () => {
        if (images.length > 0 && reportId) {
            setUploading(true);
            setError(null);
            try {
                await reportApi.uploadImages(reportId, images);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to upload images');
                setUploading(false);
                return;
            }
            setUploading(false);
        }
        onNext();
    };

    return (
        <StepLayout
            title="Upload Photos (Optional)"
            subtitle="Adding photos helps our team assess the situation faster."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            )}

            <ImageUploadCard
                title="Water Source"
                subtitle="Photo of the well, river, tap, or other source"
                icon={<WaterDropOutlinedIcon sx={{ color: 'primary.main' }} />}
                imageType="water_source"
                images={images}
                onAdd={handleAdd}
                onRemove={handleRemove}
            />

            <ImageUploadCard
                title="Water Sample"
                subtitle="Photo of water in a clear glass or container"
                icon={<CameraAltOutlinedIcon sx={{ color: 'primary.main' }} />}
                imageType="water_sample"
                images={images}
                onAdd={handleAdd}
                onRemove={handleRemove}
            />

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
                Photos are optional. Max 5MB per image, up to 10 images total.
            </Typography>

            <Button
                fullWidth variant="contained" size="large"
                onClick={handleNext}
                disabled={uploading}
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 1.6 }}
            >
                {uploading ? 'Uploading...' : images.length > 0 ? `Continue (${images.length} photo${images.length > 1 ? 's' : ''})` : 'Skip'}
            </Button>
        </StepLayout>
    );
}

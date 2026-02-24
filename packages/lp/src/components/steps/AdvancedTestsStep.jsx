import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Card, InputAdornment } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const PARAMETERS = [
    { key: 'ph', label: 'pH Level', unit: 'pH', icon: '⚗️', min: 0, max: 14, desc: 'Acidity / alkalinity (0-14)' },
    { key: 'hardness', label: 'Water Hardness', unit: 'ppm', icon: '💎', desc: 'Calcium carbonate level' },
    { key: 'chlorine', label: 'Free Chlorine', unit: 'ppm', icon: '🧴', desc: 'Disinfectant level' },
    { key: 'tds', label: 'Total Dissolved Solids', unit: 'ppm', icon: '🔬', desc: 'All dissolved substances' },
    { key: 'totalAlkalinity', label: 'Total Alkalinity', unit: 'ppm', icon: '📊', desc: 'Buffering capacity' },
    { key: 'nitrate', label: 'Nitrate', unit: 'ppm', icon: '🌱', desc: 'From fertilizers / waste' },
    { key: 'nitrite', label: 'Nitrite', unit: 'ppm', icon: '🧫', desc: 'Bacterial contamination indicator' },
    { key: 'iron', label: 'Iron', unit: 'ppm', icon: '🔩', desc: 'Causes rust / staining' },
    { key: 'fluoride', label: 'Fluoride', unit: 'ppm', icon: '🦷', desc: 'Dental health related' },
    { key: 'copper', label: 'Copper', unit: 'ppm', icon: '🟤', desc: 'Pipe corrosion byproduct' },
    { key: 'lead', label: 'Lead', unit: 'ppb', icon: '⚠️', desc: 'Highly toxic heavy metal' },
    { key: 'mercury', label: 'Mercury', unit: 'ppb', icon: '☠️', desc: 'Industrial pollutant' },
    { key: 'chromium', label: 'Chromium', unit: 'ppb', icon: '🏭', desc: 'Industrial contaminant' },
    { key: 'bromine', label: 'Bromine', unit: 'ppm', icon: '🧪', desc: 'Alternative disinfectant' },
    { key: 'cyanuricAcid', label: 'Cyanuric Acid', unit: 'ppm', icon: '🛡️', desc: 'Chlorine stabilizer' },
    { key: 'carbonate', label: 'Carbonate', unit: 'ppm', icon: '🪨', desc: 'Mineral content' },
];

export default function AdvancedTestsStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [values, setValues] = useState({});

    useEffect(() => {
        if (reportData.advancedTests) {
            const initial = {};
            for (const param of PARAMETERS) {
                if (reportData.advancedTests[param.key]?.value != null) {
                    initial[param.key] = String(reportData.advancedTests[param.key].value);
                }
            }
            setValues(initial);
        }
    }, [reportData.advancedTests]);

    const handleChange = (key) => (e) => {
        setValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleNext = async () => {
        const advancedTests = {};
        for (const param of PARAMETERS) {
            if (values[param.key] && values[param.key].trim() !== '') {
                advancedTests[param.key] = {
                    value: parseFloat(values[param.key]),
                    unit: param.unit,
                };
            }
        }
        await saveStepData({ advancedTests }, stepNumber + 1);
        onNext();
    };

    const filledCount = Object.values(values).filter((v) => v && v.trim() !== '').length;

    return (
        <StepLayout
            title="Enter Your Test Results"
            subtitle="Fill in any values you have — leave blank any you didn't test."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    📋 {filledCount} of {PARAMETERS.length} parameters filled
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {PARAMETERS.map((param, index) => (
                    <motion.div
                        key={param.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                    >
                        <Card sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <span style={{ fontSize: 18 }}>{param.icon}</span>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {param.label}
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                {param.desc}
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder="Enter value"
                                value={values[param.key] || ''}
                                onChange={handleChange(param.key)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">{param.unit}</InputAdornment>,
                                }}
                                inputProps={{ min: param.min, max: param.max, step: 'any' }}
                            />
                        </Card>
                    </motion.div>
                ))}
            </Box>

            <Button fullWidth variant="contained" size="large" onClick={handleNext}
                endIcon={<ArrowForwardIcon />} sx={{ mt: 4, py: 1.6 }}>
                {filledCount > 0 ? 'Continue' : 'Skip — No Test Results'}
            </Button>
        </StepLayout>
    );
}

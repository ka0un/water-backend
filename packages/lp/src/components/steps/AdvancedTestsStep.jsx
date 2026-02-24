import { useState, useEffect, useMemo } from 'react';
import { Box, TextField, Button, Typography, Card, InputAdornment } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ALL_PARAMETERS = [
    { key: 'ph', label: 'pH Level', unit: 'pH', icon: '⚗️', min: 0, max: 14, desc: 'Acidity / alkalinity (0-14)' },
    { key: 'hardness', label: 'Water Hardness', unit: 'mg/L', icon: '💎', desc: 'Calcium carbonate level' },
    { key: 'chlorine', label: 'Free Chlorine', unit: 'mg/L', icon: '🧴', desc: 'Disinfectant level' },
    { key: 'tds', label: 'Total Dissolved Solids', unit: 'mg/L', icon: '🔬', desc: 'All dissolved substances' },
    { key: 'totalAlkalinity', label: 'Total Alkalinity', unit: 'mg/L', icon: '📊', desc: 'Buffering capacity' },
    { key: 'nitrate', label: 'Nitrate', unit: 'mg/L', icon: '🌱', desc: 'From fertilizers / waste' },
    { key: 'nitrite', label: 'Nitrite', unit: 'mg/L', icon: '🧫', desc: 'Bacterial contamination indicator' },
    { key: 'iron', label: 'Iron', unit: 'mg/L', icon: '🔩', desc: 'Causes rust / staining' },
    { key: 'fluoride', label: 'Fluoride', unit: 'mg/L', icon: '🦷', desc: 'Dental health related' },
    { key: 'copper', label: 'Copper', unit: 'mg/L', icon: '🟤', desc: 'Pipe corrosion byproduct' },
    { key: 'lead', label: 'Lead', unit: 'mg/L', icon: '⚠️', desc: 'Highly toxic heavy metal' },
    { key: 'mercury', label: 'Mercury', unit: 'mg/L', icon: '☠️', desc: 'Industrial pollutant' },
    { key: 'chromium', label: 'Chromium', unit: 'mg/L', icon: '🏭', desc: 'Industrial contaminant' },
    { key: 'bromine', label: 'Bromine', unit: 'mg/L', icon: '🧪', desc: 'Alternative disinfectant' },
    { key: 'cyanuricAcid', label: 'Cyanuric Acid', unit: 'mg/L', icon: '🛡️', desc: 'Chlorine stabilizer' },
    { key: 'carbonate', label: 'Carbonate', unit: 'mg/L', icon: '🪨', desc: 'Mineral content' },
];

// Test strips can only measure these basic params
const TEST_STRIP_KEYS = ['ph', 'chlorine', 'hardness', 'nitrate', 'nitrite'];

// Lab kits and professional labs can measure everything

export default function AdvancedTestsStep({ onNext, onBack, stepNumber, totalSteps }) {
    const { reportData, saveStepData } = useWizard();
    const [values, setValues] = useState({});

    // Filter parameters based on testing method
    const visibleParams = useMemo(() => {
        if (reportData.testingMethod === 'test_strips') {
            return ALL_PARAMETERS.filter(p => TEST_STRIP_KEYS.includes(p.key));
        }
        // lab_kit and professional_lab get all parameters
        return ALL_PARAMETERS;
    }, [reportData.testingMethod]);

    useEffect(() => {
        if (reportData.advancedTests) {
            const initial = {};
            for (const param of visibleParams) {
                if (reportData.advancedTests[param.key]?.value != null) {
                    initial[param.key] = String(reportData.advancedTests[param.key].value);
                }
            }
            setValues(initial);
        }
    }, [reportData.advancedTests, visibleParams]);

    const handleChange = (key) => (e) => {
        setValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleNext = async () => {
        const advancedTests = {};
        for (const param of visibleParams) {
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

    const methodLabel = {
        test_strips: 'Test Strips',
        lab_kit: 'Home Lab Kit',
        professional_lab: 'Professional Lab',
    }[reportData.testingMethod] || 'Test';

    return (
        <StepLayout
            title="Enter Your Test Results"
            subtitle={`Fill in any values from your ${methodLabel} — leave blank any you didn't test.`}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            onBack={onBack}
        >
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    📋 {filledCount} of {visibleParams.length} parameters filled
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {visibleParams.map((param, index) => (
                    <motion.div
                        key={param.key}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.015 }}
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

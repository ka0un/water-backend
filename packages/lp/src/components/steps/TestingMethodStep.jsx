import { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const OPTIONS = [
    { value: 'observation', label: 'Observation Only', icon: '👁️', description: 'I just looked at the water' },
    { value: 'test_strips', label: 'Test Strips', icon: '🧪', description: 'I used pH / test strip paper' },
    { value: 'lab_kit', label: 'Home Lab Kit', icon: '🔬', description: 'I used a testing kit at home' },
    { value: 'professional_lab', label: 'Professional Lab', icon: '🏥', description: 'Tested by a certified lab' },
];

export default function TestingMethodStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [selected, setSelected] = useState(reportData.testingMethod || null);

    useEffect(() => {
        if (reportData.testingMethod) setSelected(reportData.testingMethod);
    }, [reportData.testingMethod]);

    const handleNext = async () => {
        if (!selected) return;
        await saveStepData({ testingMethod: selected }, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout
            title="Have you tested this water?"
            subtitle="Let us know if you've done any chemical or physical testing."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <Box sx={{
                mb: 3, p: 2, bgcolor: 'rgba(237, 108, 2, 0.06)', borderRadius: 2,
                border: '1px solid rgba(237, 108, 2, 0.2)',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
            }}>
                <InfoOutlinedIcon sx={{ color: 'warning.main', fontSize: 20, mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    If you've tested the water with test strips or a lab kit, we'll ask you for those results next. Otherwise, we'll skip to the review.
                </Typography>
            </Box>

            <OptionGrid options={OPTIONS} selected={selected} onSelect={setSelected} columns={2} />

            <Button fullWidth variant="contained" size="large" onClick={handleNext}
                disabled={!selected} endIcon={<ArrowForwardIcon />} sx={{ mt: 4, py: 1.6 }}>
                Continue
            </Button>
        </StepLayout>
    );
}

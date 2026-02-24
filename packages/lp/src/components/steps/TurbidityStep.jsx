import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const OPTIONS = [
    { value: 'clear', label: 'Clear', icon: '💎', description: 'Can see through easily' },
    { value: 'slightly_cloudy', label: 'Slightly Cloudy', icon: '🌤️', description: 'A bit hazy' },
    { value: 'cloudy', label: 'Cloudy', icon: '☁️', description: 'Cannot see through clearly' },
    { value: 'very_murky', label: 'Very Murky', icon: '🌫️', description: 'Cannot see through at all' },
];

export default function TurbidityStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [selected, setSelected] = useState(reportData.turbidity?.value || null);

    useEffect(() => {
        if (reportData.turbidity?.value) setSelected(reportData.turbidity.value);
    }, [reportData.turbidity]);

    const handleNext = async () => {
        if (!selected) return;
        await saveStepData({ turbidity: { value: selected } }, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout
            title="How clear is the water?"
            subtitle="Hold a glass up to the light or look into the water source."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <OptionGrid options={OPTIONS} selected={selected} onSelect={setSelected} columns={2} />

            <Button
                fullWidth variant="contained" size="large"
                onClick={handleNext}
                disabled={!selected}
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 4, py: 1.6 }}
            >
                Continue
            </Button>
        </StepLayout>
    );
}

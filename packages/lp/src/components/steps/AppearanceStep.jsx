import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const COLORS = [
    { value: 'clear', label: 'Clear', icon: '💧', description: 'Transparent, no color' },
    { value: 'yellow', label: 'Yellow', icon: '🟡' },
    { value: 'brown', label: 'Brown', icon: '🟤', description: 'Rusty or muddy' },
    { value: 'green', label: 'Green', icon: '🟢', description: 'Algae-like' },
    { value: 'milky', label: 'Milky / White', icon: '⚪' },
    { value: 'red', label: 'Red / Orange', icon: '🔴', description: 'Iron-like' },
    { value: 'black', label: 'Black / Dark', icon: '⚫' },
    { value: 'blue', label: 'Blue', icon: '🔵', description: 'Chemical tint' },
];

export default function AppearanceStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [selected, setSelected] = useState(reportData.appearance?.value || null);

    useEffect(() => {
        if (reportData.appearance?.value) setSelected(reportData.appearance.value);
    }, [reportData.appearance]);

    const handleNext = async () => {
        if (!selected) return;
        await saveStepData({ appearance: { value: selected } }, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout
            title="What color is the water?"
            subtitle="Select the color that best matches the water you observed."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <OptionGrid options={COLORS} selected={selected} onSelect={setSelected} columns={2} />

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

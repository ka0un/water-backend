import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const OPTIONS = [
    { value: 'cold', label: 'Cold', icon: '🥶' },
    { value: 'normal', label: 'Normal', icon: '🌡️' },
    { value: 'warm', label: 'Warm', icon: '😐' },
    { value: 'hot', label: 'Hot', icon: '🔥' },
    { value: 'not_sure', label: 'Not Sure', icon: '❓' },
];

export default function TemperatureStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [selected, setSelected] = useState(reportData.temperature || null);

    useEffect(() => {
        if (reportData.temperature) setSelected(reportData.temperature);
    }, [reportData.temperature]);

    const handleNext = async () => {
        if (!selected) return;
        await saveStepData({ temperature: selected }, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout title="What is the water temperature?" subtitle="Touch or feel the water temperature."
            stepNumber={stepNumber} onBack={onBack}>
            <OptionGrid options={OPTIONS} selected={selected} onSelect={setSelected} columns={3} />
            <Button fullWidth variant="contained" size="large" onClick={handleNext}
                disabled={!selected} endIcon={<ArrowForwardIcon />} sx={{ mt: 4, py: 1.6 }}>
                Continue
            </Button>
        </StepLayout>
    );
}

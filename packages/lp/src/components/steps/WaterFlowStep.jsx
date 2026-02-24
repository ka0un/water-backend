import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const OPTIONS = [
    { value: 'stagnant', label: 'Stagnant', icon: '🚫', description: 'Not moving at all' },
    { value: 'slow', label: 'Slow', icon: '🐢', description: 'Barely flowing' },
    { value: 'normal', label: 'Normal', icon: '🌊', description: 'Regular flow' },
    { value: 'fast', label: 'Fast', icon: '💨', description: 'Rushing or rapid' },
];

export default function WaterFlowStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [selected, setSelected] = useState(reportData.waterFlow || null);

    useEffect(() => {
        if (reportData.waterFlow) setSelected(reportData.waterFlow);
    }, [reportData.waterFlow]);

    const handleNext = async () => {
        if (!selected) return;
        await saveStepData({ waterFlow: selected }, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout title="How is the water flowing?" subtitle="Describe the movement of the water."
            stepNumber={stepNumber} onBack={onBack}>
            <OptionGrid options={OPTIONS} selected={selected} onSelect={setSelected} columns={2} />
            <Button fullWidth variant="contained" size="large" onClick={handleNext}
                disabled={!selected} endIcon={<ArrowForwardIcon />} sx={{ mt: 4, py: 1.6 }}>
                Continue
            </Button>
        </StepLayout>
    );
}

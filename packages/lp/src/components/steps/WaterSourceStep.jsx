import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const WATER_SOURCES = [
    { value: 'well', label: 'Well', icon: '🪣' },
    { value: 'river', label: 'River / Stream', icon: '🏞️' },
    { value: 'lake', label: 'Lake / Pond', icon: '🏊' },
    { value: 'tap', label: 'Tap Water', icon: '🚰' },
    { value: 'tank', label: 'Water Tank', icon: '🏗️' },
    { value: 'canal', label: 'Canal / Drain', icon: '🌊' },
    { value: 'spring', label: 'Natural Spring', icon: '⛲' },
    { value: 'rainwater', label: 'Rainwater', icon: '🌧️' },
    { value: 'borehole', label: 'Borehole', icon: '🕳️' },
    { value: 'other', label: 'Other', icon: '❓' },
];

export default function WaterSourceStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [selected, setSelected] = useState(reportData.waterSource || null);

    useEffect(() => {
        if (reportData.waterSource) setSelected(reportData.waterSource);
    }, [reportData.waterSource]);

    const handleNext = async () => {
        if (!selected) return;
        await saveStepData({ waterSource: selected }, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout
            title="What type of water source?"
            subtitle="Select the type of water source you're reporting about."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <OptionGrid
                options={WATER_SOURCES}
                selected={selected}
                onSelect={setSelected}
                columns={2}
            />

            <Button
                fullWidth
                variant="contained"
                size="large"
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

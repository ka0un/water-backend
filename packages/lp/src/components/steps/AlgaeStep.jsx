import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import QuestionCard from '../shared/QuestionCard';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const COLOR_OPTIONS = [
    { value: 'green', label: 'Green', icon: '🟢' },
    { value: 'blue_green', label: 'Blue-Green', icon: '🔵', description: 'Can be toxic (cyanobacteria)' },
    { value: 'red', label: 'Red / Brown', icon: '🔴' },
    { value: 'brown', label: 'Brown', icon: '🟤' },
    { value: 'not_sure', label: 'Not Sure', icon: '❓' },
];

const COVERAGE_OPTIONS = [
    { value: 'patches', label: 'Small Patches', icon: '🟩', description: 'Scattered spots' },
    { value: 'partial', label: 'Partial Coverage', icon: '🟩', description: 'Covers some area' },
    { value: 'full', label: 'Full Coverage', icon: '🟩', description: 'Covers most of surface' },
    { value: 'not_sure', label: 'Not Sure', icon: '❓' },
];

export default function AlgaeStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const existing = reportData.algae || {};
    const [detected, setDetected] = useState(existing.detected ?? null);
    const [color, setColor] = useState(existing.color || null);
    const [coverage, setCoverage] = useState(existing.coverage || null);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const data = reportData.algae;
        if (data) {
            setDetected(data.detected ?? null);
            setColor(data.color || null);
            setCoverage(data.coverage || null);
        }
    }, [reportData.algae]);

    const handleDetected = async (value) => {
        setDetected(value);
        if (!value) {
            await saveStepData({ algae: { detected: false } }, stepNumber + 1);
            onNext();
        } else {
            setPhase(1);
        }
    };

    const handleColorSelect = (value) => {
        setColor(value);
        setPhase(2);
    };

    const handleNext = async () => {
        await saveStepData({ algae: { detected: true, color, coverage } }, stepNumber + 1);
        onNext();
    };

    const handleBack = () => {
        if (phase > 0) setPhase(phase - 1);
        else onBack();
    };

    return (
        <StepLayout
            title={
                phase === 0 ? 'Is there algae in the water?' :
                    phase === 1 ? 'What color is the algae?' :
                        'How much area does it cover?'
            }
            stepNumber={stepNumber}
            onBack={handleBack}
        >
            {phase === 0 && (
                <QuestionCard
                    question="Is there algae in the water?"
                    icon="🌿"
                    description="Look for green, blue-green, or slimy growth on or in the water."
                    value={detected}
                    onChange={handleDetected}
                />
            )}
            {phase === 1 && (
                <OptionGrid options={COLOR_OPTIONS} selected={color} onSelect={handleColorSelect} />
            )}
            {phase === 2 && (
                <Box>
                    <OptionGrid options={COVERAGE_OPTIONS} selected={coverage} onSelect={setCoverage} />
                    {coverage && (
                        <Button fullWidth variant="contained" size="large" onClick={handleNext}
                            endIcon={<ArrowForwardIcon />} sx={{ mt: 4, py: 1.6 }}>
                            Continue
                        </Button>
                    )}
                </Box>
            )}
        </StepLayout>
    );
}

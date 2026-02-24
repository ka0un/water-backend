import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import QuestionCard from '../shared/QuestionCard';
import OptionGrid from '../shared/OptionGrid';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Reusable multi-phase observation step:
 * Phase 0: Yes/No detection question
 * Phase 1: Type/category selection (if detected)
 * Phase 2: Severity/amount selection (if detected)
 * Automatically skips to next step if "No" is selected.
 */
export default function ObservationStep({
    fieldName,       // e.g. 'oilGrease'
    stepNumber,
    onNext,
    onBack,
    question,        // "Is oil or grease present in the water?"
    icon,            // emoji or component
    description,     // subtitle for the yes/no question
    typeLabel,       // "What type of oil do you see?"
    typeOptions,     // [{ value, label, icon }]
    amountLabel,     // "How much is present?"
    amountOptions,   // [{ value, label, icon }]
}) {
    const { reportData, saveStepData } = useWizard();
    const existing = reportData[fieldName] || {};

    const [detected, setDetected] = useState(existing.detected ?? null);
    const [type, setType] = useState(existing.type || null);
    const [amount, setAmount] = useState(existing.amount || existing.severity || null);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const data = reportData[fieldName];
        if (data) {
            setDetected(data.detected ?? null);
            setType(data.type || null);
            setAmount(data.amount || data.severity || null);
        }
    }, [reportData, fieldName]);

    const handleDetected = async (value) => {
        setDetected(value);
        if (value === false) {
            // Not detected — save and move on
            await saveStepData({ [fieldName]: { detected: false } }, stepNumber + 1);
            onNext();
        } else {
            // Detected — show follow-up
            if (typeOptions && typeOptions.length > 0) {
                setPhase(1);
            } else if (amountOptions && amountOptions.length > 0) {
                setPhase(2);
            } else {
                await saveStepData({ [fieldName]: { detected: true } }, stepNumber + 1);
                onNext();
            }
        }
    };

    const handleTypeSelect = (value) => {
        setType(value);
        if (amountOptions && amountOptions.length > 0) {
            setPhase(2);
        }
    };

    const handleAmountSelect = (value) => {
        setAmount(value);
    };

    const handleNext = async () => {
        const data = { detected: true };
        if (type) data.type = type;
        if (amount) data.amount = amount;
        await saveStepData({ [fieldName]: data }, stepNumber + 1);
        onNext();
    };

    const handleBack = () => {
        if (phase > 0) {
            setPhase(phase - 1);
        } else {
            onBack();
        }
    };

    // Determine if we can proceed
    const canProceed = phase === 2 ? !!amount : phase === 1 ? !!type && (!amountOptions || amountOptions.length === 0) : false;

    return (
        <StepLayout
            title={
                phase === 0 ? question :
                    phase === 1 ? typeLabel :
                        amountLabel
            }
            stepNumber={stepNumber}
            onBack={handleBack}
        >
            {/* Phase 0: Yes/No */}
            {phase === 0 && (
                <QuestionCard
                    question={question}
                    icon={icon}
                    description={description}
                    value={detected}
                    onChange={handleDetected}
                />
            )}

            {/* Phase 1: Type selection */}
            {phase === 1 && typeOptions && (
                <Box>
                    <OptionGrid
                        options={typeOptions}
                        selected={type}
                        onSelect={handleTypeSelect}
                    />
                    {(!amountOptions || amountOptions.length === 0) && type && (
                        <Button
                            fullWidth variant="contained" size="large"
                            onClick={handleNext}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ mt: 4, py: 1.6 }}
                        >
                            Continue
                        </Button>
                    )}
                </Box>
            )}

            {/* Phase 2: Amount/severity */}
            {phase === 2 && amountOptions && (
                <Box>
                    <OptionGrid
                        options={amountOptions}
                        selected={amount}
                        onSelect={handleAmountSelect}
                    />
                    {amount && (
                        <Button
                            fullWidth variant="contained" size="large"
                            onClick={handleNext}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ mt: 4, py: 1.6 }}
                        >
                            Continue
                        </Button>
                    )}
                </Box>
            )}
        </StepLayout>
    );
}

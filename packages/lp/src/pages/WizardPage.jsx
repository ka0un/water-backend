import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Container } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { WizardProvider, useWizard } from '../context/WizardContext';

// Steps
import WelcomeStep from '../components/steps/WelcomeStep';
import WaterSourceStep from '../components/steps/WaterSourceStep';
import LocationStep from '../components/steps/LocationStep';
import TestingMethodStep from '../components/steps/TestingMethodStep';
import AppearanceStep from '../components/steps/AppearanceStep';
import SmellStep from '../components/steps/SmellStep';
import TasteStep from '../components/steps/TasteStep';
import TurbidityStep from '../components/steps/TurbidityStep';
import SedimentStep from '../components/steps/SedimentStep';
import OilGreaseStep from '../components/steps/OilGreaseStep';
import FoamStep from '../components/steps/FoamStep';
import AlgaeStep from '../components/steps/AlgaeStep';
import TrashStep from '../components/steps/TrashStep';
import MudStep from '../components/steps/MudStep';
import InsectsStep from '../components/steps/InsectsStep';
import PlantMatterStep from '../components/steps/PlantMatterStep';
import WildlifeStep from '../components/steps/WildlifeStep';
import PipeConditionStep from '../components/steps/PipeConditionStep';
import WaterFlowStep from '../components/steps/WaterFlowStep';
import TemperatureStep from '../components/steps/TemperatureStep';
import AdvancedTestsStep from '../components/steps/AdvancedTestsStep';
import ImageUploadStep from '../components/steps/ImageUploadStep';
import ContactStep from '../components/steps/ContactStep';
import ReviewStep from '../components/steps/ReviewStep';

// ─── Step definitions ────────────────────────────────────────────
const STEPS = [
    { key: 'welcome', Component: WelcomeStep },
    { key: 'source', Component: WaterSourceStep },
    { key: 'location', Component: LocationStep },
    { key: 'testing', Component: TestingMethodStep },
    { key: 'advanced', Component: AdvancedTestsStep },
    { key: 'appearance', Component: AppearanceStep },
    { key: 'smell', Component: SmellStep },
    { key: 'taste', Component: TasteStep },
    { key: 'turbidity', Component: TurbidityStep },
    { key: 'sediment', Component: SedimentStep },
    { key: 'oil', Component: OilGreaseStep },
    { key: 'foam', Component: FoamStep },
    { key: 'algae', Component: AlgaeStep },
    { key: 'trash', Component: TrashStep },
    { key: 'mud', Component: MudStep },
    { key: 'insects', Component: InsectsStep },
    { key: 'plants', Component: PlantMatterStep },
    { key: 'wildlife', Component: WildlifeStep },
    { key: 'pipes', Component: PipeConditionStep },
    { key: 'flow', Component: WaterFlowStep },
    { key: 'temperature', Component: TemperatureStep },
    { key: 'images', Component: ImageUploadStep },
    { key: 'contact', Component: ContactStep },
    { key: 'review', Component: ReviewStep },
];

// ─── Source-based skip rules ─────────────────────────────────────
// Steps listed here will be SKIPPED for the given water source.
const SOURCE_SKIP = {
    tap: ['algae', 'trash', 'wildlife', 'plants', 'mud'],
    well: ['pipes', 'trash', 'wildlife', 'foam'],
    borehole: ['pipes', 'algae', 'trash', 'wildlife', 'plants', 'mud', 'foam'],
    river: ['pipes'],
    lake: ['pipes'],
    canal: ['pipes'],
    spring: ['pipes', 'foam'],
    tank: ['algae', 'trash', 'wildlife', 'plants', 'mud', 'oil', 'foam'],
    rainwater: ['algae', 'trash', 'wildlife', 'plants', 'mud', 'oil', 'foam', 'pipes'],
    other: [],
};

// ─── Determine if a step should be skipped ───────────────────────
function shouldSkip(stepKey, reportData) {
    // Advanced tests gate — skip if observation-only
    if (stepKey === 'advanced') {
        return reportData.testingMethod === 'observation';
    }

    // Source-based observation skipping
    const source = reportData.waterSource;
    if (source && SOURCE_SKIP[source]) {
        return SOURCE_SKIP[source].includes(stepKey);
    }

    return false;
}

// ─── Wizard orchestrator ─────────────────────────────────────────
function WizardContent() {
    const navigate = useNavigate();
    const { currentStep, reportData, submitReport, loading, error } = useWizard();
    const [stepIndex, setStepIndex] = useState(currentStep || 0);

    // Compute active (non-skipped) step count for progress bar
    const activeStepCount = useMemo(() => {
        return STEPS.filter((s) => s.key !== 'welcome' && !shouldSkip(s.key, reportData)).length;
    }, [reportData.waterSource, reportData.testingMethod]);

    // Compute current progress position (which active step number we're on)
    const activeStepNumber = useMemo(() => {
        let count = 0;
        for (let i = 1; i <= stepIndex; i++) {
            if (!shouldSkip(STEPS[i]?.key, reportData)) count++;
        }
        return count;
    }, [stepIndex, reportData.waterSource, reportData.testingMethod]);

    const goNext = useCallback(() => {
        setStepIndex((prev) => {
            let next = prev + 1;
            // Skip any steps that should be skipped
            while (next < STEPS.length && shouldSkip(STEPS[next]?.key, reportData)) {
                next++;
            }
            return Math.min(next, STEPS.length - 1);
        });
    }, [reportData]);

    const goBack = useCallback(() => {
        setStepIndex((prev) => {
            let back = prev - 1;
            // Skip any steps that should be skipped going backward
            while (back > 0 && shouldSkip(STEPS[back]?.key, reportData)) {
                back--;
            }
            return Math.max(back, 0);
        });
    }, [reportData]);

    const handleSubmit = async () => {
        try {
            const result = await submitReport();
            navigate(`/thank-you?id=${result._id}`);
        } catch {
            // error handled in context
        }
    };

    if (loading && stepIndex === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={48} />
            </Box>
        );
    }

    const currentStepDef = STEPS[stepIndex];
    if (!currentStepDef) return null;

    const { Component } = currentStepDef;

    const stepProps = {
        onNext: goNext,
        onBack: goBack,
        stepNumber: activeStepNumber,
        totalSteps: activeStepCount,
    };

    return (
        <Container maxWidth="md" sx={{ py: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}
            <AnimatePresence mode="wait">
                <Box key={currentStepDef.key}>
                    {currentStepDef.key === 'review' ? (
                        <Component {...stepProps} onSubmit={handleSubmit} />
                    ) : (
                        <Component {...stepProps} />
                    )}
                </Box>
            </AnimatePresence>
        </Container>
    );
}

export default function WizardPage() {
    return (
        <WizardProvider>
            <WizardContent />
        </WizardProvider>
    );
}

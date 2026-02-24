import { useState, useCallback } from 'react';
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

/**
 * Step order (reordered):
 * 0:  Welcome / NIC
 * 1:  Water Source
 * 2:  Location
 * 3:  Testing Method  ← moved earlier
 * 4:  Advanced Tests   (skipped if observation-only)
 * 5:  Appearance
 * 6:  Smell
 * 7:  Taste
 * 8:  Turbidity
 * 9:  Sediment
 * 10: Oil/Grease
 * 11: Foam
 * 12: Algae
 * 13: Trash
 * 14: Mud
 * 15: Insects
 * 16: Plants
 * 17: Wildlife
 * 18: Pipes
 * 19: Water Flow
 * 20: Temperature
 * 21: Image Upload     ← new
 * 22: Contact Info     ← new
 * 23: Review & Submit
 */
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

const TOTAL_STEPS = STEPS.length - 1; // exclude welcome

function WizardContent() {
    const navigate = useNavigate();
    const { currentStep, reportData, submitReport, loading, error } = useWizard();
    const [stepIndex, setStepIndex] = useState(currentStep || 0);

    const goNext = useCallback(() => {
        setStepIndex((prev) => {
            let next = prev + 1;

            // Gate: skip advanced tests if observation-only
            if (STEPS[next]?.key === 'advanced') {
                const method = reportData.testingMethod;
                if (method === 'observation') {
                    next++;
                }
            }

            return Math.min(next, STEPS.length - 1);
        });
    }, [reportData.testingMethod]);

    const goBack = useCallback(() => {
        setStepIndex((prev) => {
            let back = prev - 1;

            // Gate: skip advanced tests going backward if observation-only
            if (STEPS[back]?.key === 'advanced') {
                const method = reportData.testingMethod;
                if (method === 'observation') {
                    back--;
                }
            }

            return Math.max(back, 0);
        });
    }, [reportData.testingMethod]);

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
        stepNumber: stepIndex,
        totalSteps: TOTAL_STEPS,
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

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Container } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { WizardProvider, useWizard } from '../context/WizardContext';

// Steps
import WelcomeStep from '../components/steps/WelcomeStep';
import WaterSourceStep from '../components/steps/WaterSourceStep';
import LocationStep from '../components/steps/LocationStep';
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
import TestingMethodStep from '../components/steps/TestingMethodStep';
import AdvancedTestsStep from '../components/steps/AdvancedTestsStep';
import ReviewStep from '../components/steps/ReviewStep';

/**
 * Step definitions in order. Each step is numbered 1-based inside the wizard.
 * Step 0 is the Welcome/NIC step (no progress bar).
 */
const STEPS = [
    { key: 'welcome', Component: WelcomeStep },      // 0
    { key: 'source', Component: WaterSourceStep },    // 1
    { key: 'location', Component: LocationStep },     // 2
    { key: 'appearance', Component: AppearanceStep }, // 3
    { key: 'smell', Component: SmellStep },           // 4
    { key: 'taste', Component: TasteStep },           // 5
    { key: 'turbidity', Component: TurbidityStep },   // 6
    { key: 'sediment', Component: SedimentStep },     // 7
    { key: 'oil', Component: OilGreaseStep },         // 8
    { key: 'foam', Component: FoamStep },             // 9
    { key: 'algae', Component: AlgaeStep },           // 10
    { key: 'trash', Component: TrashStep },           // 11
    { key: 'mud', Component: MudStep },               // 12
    { key: 'insects', Component: InsectsStep },       // 13
    { key: 'plants', Component: PlantMatterStep },    // 14
    { key: 'wildlife', Component: WildlifeStep },     // 15
    { key: 'pipes', Component: PipeConditionStep },   // 16
    { key: 'flow', Component: WaterFlowStep },        // 17
    { key: 'temperature', Component: TemperatureStep }, // 18
    { key: 'testing', Component: TestingMethodStep }, // 19
    { key: 'advanced', Component: AdvancedTestsStep }, // 20
    { key: 'review', Component: ReviewStep },          // 21
];

const TOTAL_STEPS = STEPS.length - 1; // exclude welcome

function WizardContent() {
    const navigate = useNavigate();
    const { currentStep, setCurrentStep, reportData, submitReport, loading, error } = useWizard();
    const [stepIndex, setStepIndex] = useState(currentStep || 0);

    const goNext = useCallback(() => {
        setStepIndex((prev) => {
            let next = prev + 1;

            // Gate: skip advanced tests if observation-only
            if (STEPS[next]?.key === 'advanced') {
                const method = reportData.testingMethod;
                if (method === 'observation') {
                    next++; // skip to review
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

    // Common props for every step
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

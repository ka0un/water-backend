import { Box, Typography, Button, Card, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import SendIcon from '@mui/icons-material/Send';

const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'string') return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return String(val);
};

const Section = ({ title, icon, children, show = true }) => {
    if (!show) return null;
    return (
        <Card sx={{ p: 2.5, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                <span>{icon}</span> {title}
            </Typography>
            {children}
        </Card>
    );
};

const Row = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{formatValue(value)}</Typography>
    </Box>
);

const ObsRow = ({ label, data }) => {
    if (!data || data.detected === null || data.detected === undefined) return null;
    return (
        <>
            <Row label={label} value={data.detected ? 'Yes' : 'No'} />
            {data.detected && data.type && <Row label="  → Type" value={data.type} />}
            {data.detected && (data.amount || data.severity) && <Row label="  → Severity" value={data.amount || data.severity} />}
            {data.detected && data.color && <Row label="  → Color" value={data.color} />}
            {data.detected && data.coverage && <Row label="  → Coverage" value={data.coverage} />}
        </>
    );
};

export default function ReviewStep({ onBack, onSubmit, stepNumber }) {
    const { reportData, loading } = useWizard();

    const advancedParams = reportData.advancedTests || {};
    const filledAdvanced = Object.entries(advancedParams).filter(([, v]) => v?.value != null);

    return (
        <StepLayout
            title="Review Your Report"
            subtitle="Please review all details before submitting. You can go back to change any answer."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            {/* Source & Location */}
            <Section title="Water Source" icon="💧">
                <Row label="Source Type" value={reportData.waterSource} />
                <Row label="District" value={reportData.location?.district} />
                <Row label="City" value={reportData.location?.city} />
                {reportData.location?.address && <Row label="Address" value={reportData.location.address} />}
            </Section>

            {/* Visual Observations */}
            <Section title="Visual Observations" icon="👁️">
                <Row label="Appearance" value={reportData.appearance?.value} />
                <Row label="Turbidity" value={reportData.turbidity?.value} />
                <Row label="Water Flow" value={reportData.waterFlow} />
                <Row label="Temperature" value={reportData.temperature} />
                <Divider sx={{ my: 1 }} />
                <ObsRow label="Smell" data={reportData.smell} />
                <ObsRow label="Taste" data={reportData.taste} />
                <ObsRow label="Sediment" data={reportData.sediment} />
                <ObsRow label="Oil / Grease" data={reportData.oilGrease} />
                <ObsRow label="Foam / Bubbles" data={reportData.foamBubbles} />
                <ObsRow label="Algae" data={reportData.algae} />
                <ObsRow label="Trash / Debris" data={reportData.trashDebris} />
                <ObsRow label="Mud / Silt" data={reportData.mudSilt} />
                <ObsRow label="Insects / Larvae" data={reportData.insectsLarvae} />
                <ObsRow label="Plant Matter" data={reportData.plantMatter} />
                <ObsRow label="Dead Wildlife" data={reportData.deadWildlife} />
                <ObsRow label="Pipe Condition" data={reportData.pipeCondition} />
            </Section>

            {/* Testing Method */}
            <Section title="Testing Method" icon="🧪">
                <Row label="Method" value={reportData.testingMethod} />
            </Section>

            {/* Advanced Tests */}
            <Section title="Advanced Test Results" icon="🔬" show={filledAdvanced.length > 0}>
                {filledAdvanced.map(([key, val]) => (
                    <Row key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={`${val.value} ${val.unit || ''}`} />
                ))}
            </Section>

            {/* Submit */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Button
                    fullWidth variant="contained" size="large"
                    onClick={onSubmit}
                    disabled={loading}
                    startIcon={<SendIcon />}
                    color="success"
                    sx={{ mt: 3, py: 2, fontSize: '1.1rem' }}
                >
                    {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
            </motion.div>
        </StepLayout>
    );
}

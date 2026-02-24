import { useState, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
    'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
    'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
    'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

export default function LocationStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [location, setLocation] = useState({
        district: reportData.location?.district || '',
        city: reportData.location?.city || '',
        address: reportData.location?.address || '',
    });

    useEffect(() => {
        if (reportData.location) {
            setLocation({
                district: reportData.location.district || '',
                city: reportData.location.city || '',
                address: reportData.location.address || '',
            });
        }
    }, [reportData.location]);

    const handleChange = (field) => (e) => {
        setLocation((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleNext = async () => {
        if (!location.district || !location.city) return;
        await saveStepData({ location }, stepNumber + 1);
        onNext();
    };

    const canContinue = location.district.trim() && location.city.trim();

    return (
        <StepLayout
            title="Where is this water source?"
            subtitle="Help us locate the issue. The more detail, the faster we can respond."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                    select
                    fullWidth
                    label="District"
                    value={location.district}
                    onChange={handleChange('district')}
                    SelectProps={{ native: true }}
                >
                    <option value="">Select district...</option>
                    {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    label="City / Town"
                    placeholder="e.g., Kaduwela"
                    value={location.city}
                    onChange={handleChange('city')}
                />

                <TextField
                    fullWidth
                    label="Address or Landmark (optional)"
                    placeholder="e.g., Near Temple Junction, Kaduwela"
                    value={location.address}
                    onChange={handleChange('address')}
                    multiline
                    rows={2}
                />
            </Box>

            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={!canContinue}
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 4, py: 1.6 }}
            >
                Continue
            </Button>
        </StepLayout>
    );
}

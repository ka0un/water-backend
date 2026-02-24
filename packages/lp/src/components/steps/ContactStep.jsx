import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Card } from '@mui/material';
import StepLayout from '../shared/StepLayout';
import { useWizard } from '../../context/WizardContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

export default function ContactStep({ onNext, onBack, stepNumber }) {
    const { reportData, saveStepData } = useWizard();
    const [email, setEmail] = useState(reportData.email || '');
    const [phone, setPhone] = useState(reportData.phone || '');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (reportData.email) setEmail(reportData.email);
        if (reportData.phone) setPhone(reportData.phone);
    }, [reportData.email, reportData.phone]);

    const validate = () => {
        let valid = true;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError('Please enter a valid email address');
            valid = false;
        } else {
            setEmailError('');
        }
        if (phone && !/^[0-9+\-\s()]{7,15}$/.test(phone)) {
            setPhoneError('Please enter a valid phone number');
            valid = false;
        } else {
            setPhoneError('');
        }
        return valid;
    };

    const handleNext = async () => {
        if (!validate()) return;
        const updates = {};
        if (email.trim()) updates.email = email.trim();
        if (phone.trim()) updates.phone = phone.trim();
        updates.currentStep = stepNumber + 1;
        await saveStepData(updates, stepNumber + 1);
        onNext();
    };

    return (
        <StepLayout
            title="Stay Updated (Optional)"
            subtitle="Leave your contact details if you'd like to receive updates about this report."
            stepNumber={stepNumber}
            onBack={onBack}
        >
            <Card sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <EmailOutlinedIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Email Address</Typography>
                </Box>
                <TextField
                    fullWidth
                    type="email"
                    placeholder="e.g., yourname@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    error={!!emailError}
                    helperText={emailError}
                />
            </Card>

            <Card sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <PhoneOutlinedIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Phone Number</Typography>
                </Box>
                <TextField
                    fullWidth
                    type="tel"
                    placeholder="e.g., 0771234567"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                    error={!!phoneError}
                    helperText={phoneError}
                />
            </Card>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
                Both fields are optional. You can skip this step.
            </Typography>

            <Button
                fullWidth variant="contained" size="large"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 1.6 }}
            >
                {email || phone ? 'Continue' : 'Skip'}
            </Button>
        </StepLayout>
    );
}

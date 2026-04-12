import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    FactCheck as FactCheckIcon,
} from '@mui/icons-material';

export default function UserReportsHub() {
    const navigate = useNavigate();

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
                User Reports
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                Submit a new report or track your previously submitted reports.
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <AssignmentIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Submit Report
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Send a new water quality report for moderation and review.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/app/user/reports/submit')}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                            Go to Submit
                        </Button>
                    </CardContent>
                </Card>

                <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <FactCheckIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Track Reports
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Check the status of reports you already submitted.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/app/user/reports/track')}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                            Go to Tracker
                        </Button>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}

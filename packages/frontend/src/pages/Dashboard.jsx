import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const Dashboard = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Welcome Back!
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
                        <Typography component="h2" variant="h6" color="primary" gutterBottom>
                            Total Reports
                        </Typography>
                        <Typography component="p" variant="h4">
                            128
                        </Typography>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            on 11 Feb, 2026
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
                        <Typography component="h2" variant="h6" color="primary" gutterBottom>
                            Pending Reviews
                        </Typography>
                        <Typography component="p" variant="h4">
                            12
                        </Typography>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            needs attention
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
                        <Typography component="h2" variant="h6" color="primary" gutterBottom>
                            Quality Index
                        </Typography>
                        <Typography component="p" variant="h4">
                            Good
                        </Typography>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            Average of all regions
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;

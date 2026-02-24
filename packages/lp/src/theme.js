import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1565C0',
            light: '#1E88E5',
            dark: '#0D47A1',
        },
        secondary: {
            main: '#0277BD',
            light: '#039BE5',
            dark: '#01579B',
        },
        background: {
            default: '#F5F7FA',
            paper: '#FFFFFF',
        },
        success: {
            main: '#2E7D32',
        },
        warning: {
            main: '#ED6C02',
        },
        error: {
            main: '#D32F2F',
        },
        text: {
            primary: '#1A2027',
            secondary: '#546E7A',
        },
        divider: '#E0E0E0',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 800,
            fontSize: '3rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#1A2027',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2.25rem',
            lineHeight: 1.3,
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.75rem',
            lineHeight: 1.3,
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.7,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '12px 28px',
                    fontSize: '1rem',
                    boxShadow: 'none',
                },
                containedPrimary: {
                    backgroundColor: '#1565C0',
                    '&:hover': {
                        backgroundColor: '#0D47A1',
                        boxShadow: '0 2px 8px rgba(21, 101, 192, 0.25)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E8ECF0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    height: 6,
                    backgroundColor: '#E8ECF0',
                },
                bar: {
                    borderRadius: 6,
                    backgroundColor: '#1565C0',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                    },
                },
            },
        },
    },
});

export default theme;

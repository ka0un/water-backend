import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00B4D8',
            light: '#48CAE4',
            dark: '#0077B6',
        },
        secondary: {
            main: '#90E0EF',
            light: '#CAF0F8',
            dark: '#00B4D8',
        },
        background: {
            default: '#0A1929',
            paper: '#112240',
        },
        success: {
            main: '#00E676',
        },
        warning: {
            main: '#FFB74D',
        },
        error: {
            main: '#FF5252',
        },
        text: {
            primary: '#E0E0E0',
            secondary: '#90A4AE',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 800,
            fontSize: '3rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
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
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '12px 28px',
                    fontSize: '1rem',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                    boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #48CAE4 0%, #00B4D8 100%)',
                        boxShadow: '0 6px 30px rgba(0, 180, 216, 0.5)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    background: 'rgba(17, 34, 64, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
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
                    borderRadius: 8,
                    height: 8,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                },
                bar: {
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #00B4D8 0%, #48CAE4 100%)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                    },
                },
            },
        },
    },
});

export default theme;

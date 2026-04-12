import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    AppBar, Box, CssBaseline, Divider, Drawer, IconButton,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, useMediaQuery, useTheme, Chip, Avatar,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Gavel as GavelIcon,
    ListAlt as ListAltIcon,
    ExitToApp as LogoutIcon,
    Science as ScienceIcon,
    WaterDrop as WaterDropIcon,
    BiotechOutlined as BiotechIcon,
    Inventory as InventoryIcon,
    FactCheck as FactCheckIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';

const drawerWidth = 272;

const pageMetaByRole = (role, pathname) => {
    if (role === 'USER') {
        if (pathname.includes('/reports/submit')) {
            return {
                title: 'Submit Water Report',
                subtitle: 'Create and send a new community report',
            };
        }

        if (pathname.includes('/reports/track')) {
            return {
                title: 'Track Reports',
                subtitle: 'Check moderation progress for your submissions',
            };
        }

        if (pathname.includes('/water-sources')) {
            return {
                title: 'Water Sources',
                subtitle: 'Add resources and review your submitted locations',
            };
        }

        return {
            title: 'User Dashboard',
            subtitle: 'Reports and water sources in one workspace',
        };
    }

    if (role === 'LAB_STAFF') {
        return {
            title: 'Lab Dashboard',
            subtitle: 'Testing workflow and lab oversight',
        };
    }

    return {
        title: 'Dashboard',
        subtitle: 'Operational overview and management tools',
    };
};

const Layout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const pageMeta = pageMetaByRole(user?.role, location.pathname);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Role-based menu items
    const getMenuItems = () => {
        if (user?.role === 'USER') {
            return [
                { text: 'Reports', icon: <DescriptionIcon />, path: '/app/user/reports' },
                { text: 'Water Sources', icon: <InventoryIcon />, path: '/app/user/water-sources' },
            ];
        }

        if (user?.role === 'LAB_STAFF') {
            // Lab staff sees dashboard and lab test management
            return [
                { text: 'Dashboard', icon: <DashboardIcon />, path: '/app' },
                { text: 'Lab Tests', icon: <BiotechIcon />, path: '/app/lab-tests' },
            ];
        }
        
        // Admin and Moderator see all items
        return [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/app' },
            { text: 'Water Inventory', icon: <InventoryIcon />, path: '/app/water-inventory' },
            { text: 'Resource Approval', icon: <FactCheckIcon />, path: '/app/water-resource-approval' },
            { text: 'Moderator', icon: <GavelIcon />, path: '/app/moderator/water-tests' },
            { text: 'Moderation Logs', icon: <ListAltIcon />, path: '/app/moderation/logs' },
            { text: 'Laboratory Management', icon: <ScienceIcon />, path: '/app/laboratory' },
        ];
    };

    const menuItems = getMenuItems();

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAFCFF' }}>
            <Box sx={{ px: 2.25, py: 2, borderBottom: '1px solid #E6EEF8' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '10px',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(25, 118, 210, 0.25)',
                        }}
                    >
                        <WaterDropIcon sx={{ fontSize: 18, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#14233B' }}>
                            Water Quality
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Monitoring Portal
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 2.25, pt: 2 }}>
                <Typography
                    variant="overline"
                    sx={{
                        color: '#5E7391',
                        letterSpacing: '0.08em',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        px: 1,
                    }}
                >
                    Navigation
                </Typography>
            </Box>

            <List sx={{ px: 1.5, py: 0.75 }}>
                {menuItems.map((item) => {
                    const isSelected =
                        location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) setMobileOpen(false);
                                }}
                                sx={{
                                    borderRadius: 2,
                                    px: 1.2,
                                    py: 1.05,
                                    minHeight: 48,
                                    color: isSelected ? '#0F3E79' : '#1F3552',
                                    bgcolor: isSelected ? '#E7F1FF' : 'transparent',
                                    border: isSelected ? '1px solid #BCD8FF' : '1px solid transparent',
                                    boxShadow: isSelected ? '0 8px 18px rgba(25, 118, 210, 0.08)' : 'none',
                                    '&:hover': {
                                        bgcolor: isSelected ? '#E1EEFF' : '#F1F6FC',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        minWidth: 36,
                                        color: isSelected ? '#1976D2' : '#6B7E99',
                                    },
                                    '& .MuiListItemIcon-root svg': {
                                        fontSize: 21,
                                    },
                                    '& .MuiListItemText-primary': {
                                        fontSize: '0.92rem',
                                        fontWeight: isSelected ? 700 : 600,
                                    },
                                }}
                            >
                                <ListItemIcon>
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '9px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: isSelected ? 'rgba(25, 118, 210, 0.14)' : '#F2F6FB',
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    secondary={isSelected ? 'Open' : null}
                                    primaryTypographyProps={{ noWrap: true }}
                                    secondaryTypographyProps={{
                                        sx: {
                                            color: '#7B8CA6',
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                        },
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ mt: 'auto', px: 1.5, pb: 1.5, pt: 1, borderTop: '1px solid #E6EEF8' }}>
                <List sx={{ p: 0 }}>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{
                                borderRadius: 2,
                                minHeight: 44,
                                color: '#BF2A2A',
                                '&:hover': { bgcolor: '#FFEDEE' },
                                '& .MuiListItemIcon-root': { minWidth: 36, color: '#E53935' },
                                '& .MuiListItemText-primary': { fontWeight: 600, fontSize: '0.92rem' },
                            }}
                        >
                            <ListItemIcon>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '9px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#FDEEEE',
                                    }}
                                >
                                    <LogoutIcon />
                                </Box>
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F3F7FC' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'rgba(24, 118, 210, 0.92)',
                    backdropFilter: 'blur(14px)',
                    borderBottom: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 8px 24px rgba(20, 51, 92, 0.14)',
                }}
            >
                <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ display: { sm: 'none' }, bgcolor: 'rgba(255,255,255,0.12)' }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                            {pageMeta.title}
                        </Typography>
                        <Typography
                            variant="body2"
                            noWrap
                            sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.82rem' }}
                        >
                            {pageMeta.subtitle}
                        </Typography>
                    </Box>
                    {user && (
                        <Box
                            sx={{
                                px: 1.1,
                                py: 0.7,
                                borderRadius: 2.5,
                                border: '1px solid rgba(255,255,255,0.22)',
                                bgcolor: 'rgba(255,255,255,0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                minWidth: 0,
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 34,
                                    height: 34,
                                    bgcolor: '#fff',
                                    color: 'primary.main',
                                    fontSize: 13,
                                    fontWeight: 800,
                                }}
                            >
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.1 }}
                                    noWrap
                                >
                                    {user.name || 'User'}
                                </Typography>
                                <Chip
                                    label={user.role}
                                    size="small"
                                    sx={{
                                        mt: 0.45,
                                        height: 18,
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.5)',
                                        bgcolor: 'transparent',
                                        '& .MuiChip-label': { px: 0.8 },
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: '1px solid #DFE8F5',
                            boxShadow: '12px 0 32px rgba(15, 42, 77, 0.12)',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: '1px solid #DFE8F5',
                            boxShadow: '6px 0 18px rgba(15, 42, 77, 0.05)',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 3 },
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minWidth: 0,
                    position: 'relative',
                }}
            >
                <Toolbar />
                <Box
                    sx={{
                        minHeight: 'calc(100vh - 112px)',
                        borderRadius: 3,
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;

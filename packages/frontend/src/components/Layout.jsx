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
    Person as PersonIcon,
    BiotechOutlined as BiotechIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const Layout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Role-based menu items
    const getMenuItems = () => {
        if (user?.role === 'LAB_STAFF') {
            // Lab staff sees dashboard and lab test management
            return [
                { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
                { text: 'Lab Tests', icon: <BiotechIcon />, path: '/lab-tests' },
            ];
        }
        
        // Admin and Moderator see all items
        return [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
            { text: 'Moderator', icon: <GavelIcon />, path: '/moderator/water-tests' },
            { text: 'Moderation Logs', icon: <ListAltIcon />, path: '/moderation/logs' },
            { text: 'Laboratory Management', icon: <ScienceIcon />, path: '/laboratory' },
            { text: 'Lab Tests', icon: <BiotechIcon />, path: '/lab-tests' },
        ];
    };

    const menuItems = getMenuItems();

    const drawer = (
        <div>
            <Toolbar sx={{ gap: 1 }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
                    Water Quality
                </Typography>
            </Toolbar>
            <Divider />

            {/* User info */}
            {user && (
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {user.name?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                                {user.name || 'User'}
                            </Typography>
                            <Chip label={user.role} size="small" color="primary" variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem', mt: 0.3 }} />
                        </Box>
                    </Box>
                </Box>
            )}
            <Divider />

            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Dashboard
                    </Typography>
                    {user && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {user.email}
                        </Typography>
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
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;

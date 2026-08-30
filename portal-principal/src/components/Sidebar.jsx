import React, { useState } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Avatar, 
  Typography, 
  IconButton, 
  Tooltip,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Description as DescriptionIcon, 
  Gavel as GavelIcon, 
  Logout as LogoutIcon, 
  AccountCircle as AccountIcon,
  MoreHoriz as MoreIcon,
  ManageSearch as ManageSearchIcon
} from '@mui/icons-material';
import { 
  DarkModeOutlined as DarkModeIcon, 
  LightModeOutlined as LightModeIcon 
} from '@mui/icons-material';
import { auth } from '../config/firebase';

export default function Sidebar({ currentView, setCurrentView, user, darkMode, setDarkMode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    // Importante: Detenemos la propagación para que el Dashboard no detecte el click
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const doLogout = () => {
    auth.signOut();
    handleMenuClose();
  };

  const navItems = [
    { id: 'investigador', label: 'Investigador', icon: <SearchIcon />, fullLabel: 'Investigador' },
    { id: 'analizador', label: 'Analizador', icon: <DescriptionIcon />, fullLabel: 'Analizador Docs' },
    { id: 'precalificador', label: 'Precalificar', icon: <GavelIcon />, fullLabel: 'Evaluador Legal' },
  ];

  if (isMobile) {
    return (
      <Paper 
        elevation={10} 
        sx={{ 
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100000, // Un punto más que el layout
          borderRadius: '16px 16px 0 0', overflow: 'hidden'
        }}
      >
        <BottomNavigation
          showLabels
          value={currentView}
          onChange={(event, newValue) => {
            if (newValue !== 'menu') setCurrentView(newValue);
          }}
          sx={{ height: 70, bgcolor: 'var(--pida-primary)' }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction
              key={item.id}
              value={item.id}
              label={item.label}
              icon={item.icon}
              sx={{ 
                color: 'rgba(255,255,255,0.6)', 
                '&.Mui-selected': { color: 'white' },
                '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem' }
              }}
            />
          ))}
          <BottomNavigationAction
            label="Más"
            value="menu"
            icon={<MoreIcon />}
            onClick={handleMenuOpen} // Dispara el menú
            sx={{ color: 'rgba(255,255,255,0.6)' }}
          />
        </BottomNavigation>

        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          // ESTA ES LA SOLUCIÓN TÉCNICA CRÍTICA:
          sx={{ zIndex: 200001 }} 
          slotProps={{
            root: {
              onClick: (e) => e.stopPropagation() // Evita conflictos con el Dashboard
            }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{ 
            sx: { 
              width: 200, 
              borderRadius: '12px', 
              mb: 1, 
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' 
            } 
          }}
        >
          <MenuItem onClick={() => { setCurrentView('cuenta'); handleMenuClose(); }}>
            <ListItemIcon><AccountIcon fontSize="small" /></ListItemIcon>
            Mi Cuenta
          </MenuItem>
          <MenuItem onClick={() => { setDarkMode(!darkMode); handleMenuClose(); }}>
            <ListItemIcon>
              {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </ListItemIcon>
            {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </MenuItem>
          <Divider />
          <MenuItem onClick={doLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Paper>
    );
  }

  // ... (El resto del código Desktop se mantiene igual)
  return (
    <Box component="aside" sx={{ width: { xs: 260, lg: 280 }, height: '100vh', bgcolor: 'var(--pida-primary)', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Box component="img" src="/img/PIDA-logo-blanco-scaled.png" alt="PIDA" sx={{ width: '100%', maxWidth: 160, cursor: 'pointer' }} onClick={() => setCurrentView('investigador')} />
      </Box>
      <List sx={{ px: 2, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton selected={currentView === item.id} onClick={() => setCurrentView(item.id)} sx={{ borderRadius: '0 6px 6px 0', borderLeft: '3px solid transparent', color: 'rgba(255,255,255,0.7)', '&.Mui-selected': { borderLeft: '3px solid var(--red)', bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, '& .MuiListItemIcon-root': { color: 'white' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.fullLabel} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, mt: 'auto', bgcolor: 'rgba(0,0,0,0.1)' }}>
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
        }}>
            {/* Selector de Modo Oscuro para Escritorio (Custom Toggle) */}
            <Box
              onClick={() => setDarkMode(!darkMode)}
              sx={{
                width: 64,
                height: 32,
                borderRadius: '16px',
                bgcolor: 'rgba(0,0,0,0.15)',
                position: 'relative',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: '4px',
                mb: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.25)',
                }
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  position: 'absolute',
                  left: darkMode ? 'calc(100% - 28px)' : '4px',
                  transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  zIndex: 1,
                }}
              />
              <Box sx={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                <LightModeIcon sx={{ fontSize: 16, color: darkMode ? 'rgba(255,255,255,0.5)' : '#ffffff', transition: 'color 0.3s ease' }} />
              </Box>
              <Box sx={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                <DarkModeIcon sx={{ fontSize: 16, color: darkMode ? '#ffffff' : 'rgba(255,255,255,0.5)', transition: 'color 0.3s ease' }} />
              </Box>
            </Box>

            <Avatar 
                src={user?.photoURL}
                sx={{ width: 56, height: 56, mb: 1.5, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)' }} 
                onClick={() => setCurrentView('cuenta')}
            />
            <Typography 
                variant="body2" 
                sx={{ 
                    fontWeight: 500,
                    color: 'white',
                    wordBreak: 'break-all',
                    mb: 2,
                    width: '100%',
                    cursor: 'pointer'
                }}
                onClick={() => setCurrentView('cuenta')}
            >
                {user?.email}
            </Typography>
            <Button
                variant="text"
                startIcon={<LogoutIcon />}
                onClick={doLogout}
                sx={{ 
                    textTransform: 'none', 
                    color: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                Salir
            </Button>
        </Box>
      </Box>
    </Box>
  );
}
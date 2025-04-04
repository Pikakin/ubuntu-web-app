import BrushIcon from '@mui/icons-material/Brush';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import { Box, Divider, FormControl, FormControlLabel, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Paper, Select, SelectChangeEvent, Slider, Switch, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useContext, useRef } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';

const SettingsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
}));

const Sidebar = styled(Box)(({ theme }) => ({
  width: 240,
  borderRight: `1px solid ${theme.palette.divider}`,
  overflow: 'auto',
}));

const Content = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  overflow: 'auto',
}));

const SettingSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const WallpaperPreview = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 200,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const ColorOption = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'color' && prop !== 'selected'
})<{ color: string; selected: boolean }>(({ theme, color, selected }) => ({
  width: 40,
  height: 40,
  backgroundColor: color,
  borderRadius: '50%',
  margin: theme.spacing(1),
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  '&:hover': {
    opacity: 0.8,
  },
}));

const Settings: React.FC = () => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [activeSection, setActiveSection] = useState('personalization');

  const wallpapers = [
    { id: 'default', path: '/wallpapers/default.jpg', name: 'Default' },
    { id: 'mountains', path: '/wallpapers/mountains.jpg', name: 'Mountains' },
    { id: 'ocean', path: '/wallpapers/ocean.jpg', name: 'Ocean' },
    { id: 'forest', path: '/wallpapers/forest.jpg', name: 'Forest' },
  ];

  const accentColors = [
    { id: 'blue', color: '#0078d7', name: 'Blue' },
    { id: 'red', color: '#e81123', name: 'Red' },
    { id: 'green', color: '#107c10', name: 'Green' },
    { id: 'purple', color: '#5c2d91', name: 'Purple' },
    { id: 'orange', color: '#d83b01', name: 'Orange' },
  ];

  const handleWallpaperChange = (wallpaperId: string) => {
    updateSettings({ ...settings, wallpaper: wallpaperId });
  };

  const handleAccentColorChange = (colorId: string) => {
    updateSettings({ ...settings, accentColor: colorId });
  };

  const handleTaskbarStyleChange = (event: SelectChangeEvent) => {
    updateSettings({ ...settings, taskbarStyle: event.target.value });
  };

  const handleTaskbarPositionChange = (event: SelectChangeEvent) => {
    updateSettings({ ...settings, taskbarPosition: event.target.value });
  };

  const handleShowAppNamesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ ...settings, showAppNames: event.target.checked });
  };

  const handleTransparencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ ...settings, useTransparency: event.target.checked });
  };

  const handleDarkModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ ...settings, darkMode: event.target.checked });
  };

  const handleTaskbarSizeChange = (event: Event, newValue: number | number[]) => {
    updateSettings({ ...settings, taskbarSize: newValue as number });
  };

  return (
    <SettingsContainer>
      <Sidebar>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={activeSection === 'personalization'}
              onClick={() => setActiveSection('personalization')}
            >
              <ListItemIcon>
                <BrushIcon />
              </ListItemIcon>
              <ListItemText primary="Personalization" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              selected={activeSection === 'taskbar'}
              onClick={() => setActiveSection('taskbar')}
            >
              <ListItemIcon>
                <DesktopWindowsIcon />
              </ListItemIcon>
              <ListItemText primary="Taskbar" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              selected={activeSection === 'appearance'}
              onClick={() => setActiveSection('appearance')}
            >
              <ListItemIcon>
                <DisplaySettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Appearance" />
            </ListItemButton>
          </ListItem>
        </List>
      </Sidebar>
      
      <Content>
        {activeSection === 'personalization' && (
          <>
            <Typography variant="h5" gutterBottom>
              Personalization
            </Typography>
            
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                Background
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <WallpaperPreview 
                sx={{ backgroundImage: `url(${wallpapers.find(w => w.id === settings.wallpaper)?.path || wallpapers[0].path})` }} 
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {wallpapers.map((wallpaper) => (
                  <Box 
                    key={wallpaper.id}
                    sx={{ 
                      width: 100, 
                      textAlign: 'center',
                      mb: 2,
                      mr: 2,
                      cursor: 'pointer',
                      opacity: settings.wallpaper === wallpaper.id ? 1 : 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                    onClick={() => handleWallpaperChange(wallpaper.id)}
                  >
                    <Box 
                      sx={{ 
                        height: 60, 
                        backgroundImage: `url(${wallpaper.path})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 1,
                        border: settings.wallpaper === wallpaper.id ? '2px solid #0078d7' : '2px solid transparent',
                      }} 
                    />
                    <Typography variant="caption">{wallpaper.name}</Typography>
                  </Box>
                ))}
              </Box>
            </SettingSection>
            
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                Colors
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Accent Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {accentColors.map((color) => (
                  <ColorOption 
                    key={color.id}
                    color={color.color}
                    selected={settings.accentColor === color.id}
                    onClick={() => handleAccentColorChange(color.id)}
                  />
                ))}
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.darkMode} 
                    onChange={handleDarkModeChange}
                  />
                }
                label="Dark Mode"
                sx={{ mt: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.useTransparency} 
                    onChange={handleTransparencyChange}
                  />
                }
                label="Transparency Effects"
                sx={{ mt: 1 }}
              />
            </SettingSection>
          </>
        )}
        
        {activeSection === 'taskbar' && (
          <>
            <Typography variant="h5" gutterBottom>
              Taskbar
            </Typography>
            
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                Taskbar Appearance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Taskbar Style</InputLabel>
                <Select
                  value={settings.taskbarStyle}
                  label="Taskbar Style"
                  onChange={handleTaskbarStyleChange}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="centered">Centered Icons</MenuItem>
                  <MenuItem value="compact">Compact</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Taskbar Position</InputLabel>
                <Select
                  value={settings.taskbarPosition}
                  label="Taskbar Position"
                  onChange={handleTaskbarPositionChange}
                >
                  <MenuItem value="bottom">Bottom</MenuItem>
                  <MenuItem value="top">Top</MenuItem>
                </Select>
              </FormControl>
              
              <Typography gutterBottom>
                Taskbar Size
              </Typography>
              <Slider
                value={settings.taskbarSize}
                min={32}
                max={64}
                step={4}
                onChange={handleTaskbarSizeChange}
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.showAppNames} 
                    onChange={handleShowAppNamesChange}
                  />
                }
                label="Show App Names in Taskbar"
              />
            </SettingSection>
          </>
        )}
        
        {activeSection === 'appearance' && (
          <>
            <Typography variant="h5" gutterBottom>
              Appearance
            </Typography>
            
            <SettingSection>
              <Typography variant="h6" gutterBottom>
                Visual Effects
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.darkMode} 
                    onChange={handleDarkModeChange}
                  />
                }
                label="Dark Mode"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={settings.useTransparency} 
                    onChange={handleTransparencyChange}
                  />
                }
                label="Transparency Effects"
              />
            </SettingSection>
          </>
        )}
      </Content>
    </SettingsContainer>
  );
};

export default Settings;

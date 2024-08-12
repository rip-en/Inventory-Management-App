'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  createTheme,
  ThemeProvider,
  CssBaseline,
  Grid,
  Paper,
  IconButton,
  useMediaQuery,
  keyframes
} from '@mui/material';
import KitchenIcon from '@mui/icons-material/Kitchen';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Google as GoogleIcon } from '@mui/icons-material';

export default function LandingPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#ff0000', // Red color
      },
      background: {
        default: '#000000',
        paper: '#121212',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      },
    },
  });

  const glowKeyframes = keyframes`
    0% { text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000; }
    50% { text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000; }
    100% { text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000; }
  `;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        router.push('/home');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign in successful:', result.user);
      router.push('/home');
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    }
  };

  const features = [
    { icon: <KitchenIcon fontSize="large" />, title: 'Easy to Use', description: 'Our user-friendly interface makes managing your inventory a breeze.' },
    { icon: <ListAltIcon fontSize="large" />, title: 'Track Items', description: 'Keep an inventory of all your items with ease.' },
    { icon: <AttachMoneyIcon fontSize="large" />, title: 'Manage Suppliers & Expenses', description: 'Track your suppliers and monitor expenses to optimize your inventory costs.' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          background: 'linear-gradient(45deg, #000000, #1a1a1a)',
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            fontWeight="bold"
            sx={{
              animation: `${glowKeyframes} 2s ease-in-out infinite`,
              color: '#ffffff',
            }}
          >
            Welcome to Void Inventory
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
            Easily manage your inventory.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={signInWithGoogle}
            startIcon={<GoogleIcon />}
          >
            Sign In with Google
          </Button>

          <Grid container spacing={4} sx={{ mt: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper 
                  elevation={6} 
                  sx={{ 
                    p: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 12px 20px rgba(255, 0, 0, 0.2)',
                    },
                    background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
                  }}
                >
                  <Box 
                    sx={{ 
                      color: '#ff0000',
                      mb: 2,
                      transform: 'scale(1.5)',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      mt: 2, 
                      mb: 1,
                      fontWeight: 'bold',
                      color: '#ffffff',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
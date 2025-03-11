import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import VirtualConsultation from './components/VirtualConsultation';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <VirtualConsultation />
      </div>
    </ThemeProvider>
  );
}

export default App;

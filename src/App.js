import React from 'react';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import HeroSection from './HeroSection';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <HeroSection />
      </div>
    </ThemeProvider>
  );
}

export default App;

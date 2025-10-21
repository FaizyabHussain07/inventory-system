"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SessionContextProvider } from './components/SessionContextProvider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css'; // Ensure Tailwind CSS is imported

function App() {
  return (
    <Router>
      <SessionContextProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Dashboard />} /> {/* Default route */}
        </Routes>
      </SessionContextProvider>
    </Router>
  );
}

export default App;
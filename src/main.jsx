import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Staff from './Staff.jsx';
import StaffDashboard from './components/StaffDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/verify" element={<Staff />} />
        <Route path="/staff/dashboard" element={
          <ProtectedRoute>
            <StaffDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

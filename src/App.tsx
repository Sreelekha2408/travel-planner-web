import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './App.css'
import { SignIn } from './components/signin/SignIn'
import Dashboard from './components/dashboard/Dashboard';
import ProtectedRoute from './components/routing/ProtectedRoute';
import NotFound from './components/NotFound';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './services/queryClient';

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      {/* Date pickers work with dayjs objects */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App

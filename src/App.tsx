import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SignIn } from './components/signin/SignIn';
import SignUp from './components/signup/SignUp';
import Dashboard from './components/dashboard/Dashboard';
import ProtectedRoute from './components/routing/ProtectedRoute';
import NotFound from './components/NotFound';
import AppLayout from './components/layout/AppLayout';
import ComingSoon from './components/layout/ComingSoon';
import TripsPage from './components/trips/TripsPage';
import TripFormPage from './components/trips/TripFormPage';
import TripDetailPage from './components/trips/TripDetailPage';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './services/queryClient';
import { theme } from './common/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Global reset: Inter font, page background and margins from the theme */}
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* Date pickers work with dayjs objects */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/trips" element={<TripsPage />} />
                    <Route path="/trips/new" element={<TripFormPage />} />
                    <Route path="/trips/:tripId" element={<TripDetailPage />} />
                    <Route
                      path="/trips/:tripId/edit"
                      element={<TripFormPage />}
                    />
                    <Route
                      path="/itinerary"
                      element={<ComingSoon title="Itinerary" />}
                    />
                    <Route
                      path="/expenses"
                      element={<ComingSoon title="Expenses" />}
                    />
                    <Route
                      path="/packing"
                      element={<ComingSoon title="Packing list" />}
                    />
                    <Route
                      path="/shared"
                      element={<ComingSoon title="Shared trips" />}
                    />
                  </Route>
                </Route>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SignIn } from './components/signin/SignIn';
import ProtectedRoute from './components/routing/ProtectedRoute';
import NotFound from './components/NotFound';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationProvider';
import { queryClient } from './services/queryClient';
import { theme } from './common/theme';
import PageLoader from './components/layout/PageLoader';

// Code splitting: each page below is its own chunk, downloaded the first time it's
// visited. Sign-in stays in the main bundle because it's usually the first screen.
const SignUp = lazy(() => import('./components/signup/SignUp'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const ComingSoon = lazy(() => import('./components/layout/ComingSoon'));
const TripsPage = lazy(() => import('./components/trips/TripsPage'));
const TripFormPage = lazy(() => import('./components/trips/TripFormPage'));
const TripDetailPage = lazy(() => import('./components/trips/TripDetailPage'));

// Fallback for lazy pages outside the app layout (e.g. sign-up).
const RootLayout = () => (
  <Suspense fallback={<PageLoader fullScreen />}>
    <Outlet />
  </Suspense>
);

// A "data router" (createBrowserRouter) rather than <BrowserRouter>: same routes, but it
// enables features like useBlocker, which the trip form uses to confirm before leaving
// with unsaved changes.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/new" element={<TripFormPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/trips/:tripId/edit" element={<TripFormPage />} />
          <Route path="/itinerary" element={<ComingSoon title="Itinerary" />} />
          <Route path="/expenses" element={<ComingSoon title="Expenses" />} />
          <Route path="/packing" element={<ComingSoon title="Packing list" />} />
          <Route path="/shared" element={<ComingSoon title="Shared trips" />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Global reset: Inter font, page background and margins from the theme */}
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* Date pickers work with dayjs objects */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <NotificationProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

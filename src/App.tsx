import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';

const Login = lazy(() => import('./pages/Login').then(({ Login }) => ({ default: Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const Calendar = lazy(() => import('./pages/Calendar').then(({ Calendar }) => ({ default: Calendar })));
const Customers = lazy(() => import('./pages/Customers').then(({ Customers }) => ({ default: Customers })));
const Inventory = lazy(() => import('./pages/Inventory').then(({ Inventory }) => ({ default: Inventory })));
const Finance = lazy(() => import('./pages/Finance').then(({ Finance }) => ({ default: Finance })));
const Professionals = lazy(() => import('./pages/Professionals').then(({ Professionals }) => ({ default: Professionals })));
const Marketing = lazy(() => import('./pages/Marketing').then(({ Marketing }) => ({ default: Marketing })));
const Reports = lazy(() => import('./pages/Reports').then(({ Reports }) => ({ default: Reports })));
const Services = lazy(() => import('./pages/Services').then(({ Services }) => ({ default: Services })));

function PageFallback() {
  return <div role="status" aria-live="polite" className="page-loading">Carregando...</div>;
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<LandingPage onEnterPortal={() => window.location.assign('/login')} />} />
      <Route path="/login" element={<Login />} />

      {/* Rotas Protegidas */}
      <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="finance" element={<Finance />} />
        <Route path="professionals" element={<Professionals />} />
        <Route path="services" element={<Services />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      
      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

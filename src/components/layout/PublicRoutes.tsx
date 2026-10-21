import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './PublicLayout';
import { LandingPage } from '../../pages/LandingPage';
import { StudioPage, ServicesPage, ServiceDetailPage, ContactPage, LoyaltyPage, NotFoundPage } from '../../pages/PublicPages';

// Used by both the application and the static HTML renderer.
export function PublicRoutes() {
  return <Routes><Route element={<PublicLayout />}>
    <Route index element={<LandingPage />} />
    <Route path="o-studio" element={<StudioPage />} />
    <Route path="servicos" element={<ServicesPage />} />
    <Route path="servicos/:slug" element={<ServiceDetailPage />} />
    <Route path="contato" element={<ContactPage />} />
    <Route path="fidelidade" element={<LoyaltyPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}

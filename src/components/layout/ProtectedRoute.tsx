import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthorized, loading } = useAuth();
  const isLocalPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-aura-cream">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Sparkles className="w-12 h-12 text-aura-gold" />
        </motion.div>
      </div>
    );
  }

  if (!user && !isLocalPreview) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized && !isLocalPreview) {
    return <Navigate to="/login?error=access_denied" replace />;
  }

  return <>{children}</>;
}

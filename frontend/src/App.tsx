/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import AddItem from './pages/AddItem';
import Recipes from './pages/Recipes';
import FoodMap from './pages/FoodMap';
import ShareSurplus from './pages/ShareSurplus';
import RequestPickup from './pages/RequestPickup';
import SharingStatus from './pages/SharingStatus';
import Impact from './pages/Impact';
import Achievements from './pages/Achievements';
import { getCurrentUser } from './lib/auth';

function RequireAuth({ children }: { children: ReactNode }) {
  return getCurrentUser() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto h-[100dvh] max-h-[100dvh] w-full max-w-[390px] bg-white shadow-2xl overflow-hidden relative font-display text-slate-900">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/scanner" element={<RequireAuth><Scanner /></RequireAuth>} />
          <Route path="/add-item" element={<RequireAuth><AddItem /></RequireAuth>} />
          <Route path="/recipes" element={<RequireAuth><Recipes /></RequireAuth>} />
          <Route path="/map" element={<RequireAuth><FoodMap /></RequireAuth>} />
          <Route path="/share" element={<RequireAuth><ShareSurplus /></RequireAuth>} />
          <Route path="/pickup/:id" element={<RequireAuth><RequestPickup /></RequireAuth>} />
          <Route path="/sharing-status" element={<RequireAuth><SharingStatus /></RequireAuth>} />
          <Route path="/impact" element={<RequireAuth><Impact /></RequireAuth>} />
          <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

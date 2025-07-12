import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import OrganizationDetail from './pages/OrganizationDetail'
import UserManagement from './pages/UserManagement'
import SupportCenter from './pages/SupportCenter'
import AuditLogs from './pages/AuditLogs'
import ImpersonationView from './pages/ImpersonationView'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Protected admin routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/organizations/:id" element={
            <ProtectedRoute>
              <Layout>
                <OrganizationDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/organizations/:id/:tab" element={
            <ProtectedRoute>
              <Layout>
                <OrganizationDetail />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/support" element={
            <ProtectedRoute>
              <Layout>
                <SupportCenter />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/audit" element={
            <ProtectedRoute>
              <Layout>
                <AuditLogs />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/impersonate/:userId" element={
            <ProtectedRoute>
              <Layout>
                <ImpersonationView />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App

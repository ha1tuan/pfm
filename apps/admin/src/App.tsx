import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppShell, type RouteHandle } from '@/components/AppShell/AppShell';
import { AuditPage } from '@/pages/Audit/AuditPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { FeesPage } from '@/pages/Fees/FeesPage';
import { LimitsPage } from '@/pages/Limits/LimitsPage';
import { TransactionsPage } from '@/pages/Transactions/TransactionsPage';
import { WalletDetailPage } from '@/pages/Wallets/WalletDetailPage';
import { WalletsPage } from '@/pages/Wallets/WalletsPage';

const handle = (title: RouteHandle['title'], crumb: RouteHandle['crumb']): RouteHandle => ({ title, crumb });

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage />, handle: handle('page.dashboard', 'crumbs.overview') },
      { path: 'transactions', element: <TransactionsPage />, handle: handle('page.transactions', 'crumbs.operations') },
      { path: 'wallets', element: <WalletsPage />, handle: handle('page.wallets', 'crumbs.operations') },
      { path: 'wallets/:walletId', element: <WalletDetailPage />, handle: handle('page.walletDetail', 'crumbs.operations') },
      { path: 'config/fees', element: <FeesPage />, handle: handle('page.fees', 'crumbs.config') },
      { path: 'config/limits', element: <LimitsPage />, handle: handle('page.limits', 'crumbs.config') },
      { path: 'audit', element: <AuditPage />, handle: handle('page.audit', 'crumbs.security') },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

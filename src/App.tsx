import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { POSPage } from './pages/POS/POSPage';
import { OrdersPage } from './pages/Orders/OrdersPage';
import { InventoryPage } from './pages/Inventory/InventoryPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { CategoriesPage } from './pages/Categories/CategoriesPage';
import { PromotionsPage } from './pages/Promotions/PromotionsPage';
import { WorkShiftsPage } from './pages/WorkShifts/WorkShiftsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { AIDashboardPage } from './pages/AIDashboard/AIDashboardPage';
import { StoresPage } from './pages/Stores/StoresPage';
import { UsersPage } from './pages/Users/UsersPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ActivityLogsPage } from './pages/ActivityLogs/ActivityLogsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { Toast } from './components/common/Toast';
import { useToastStore } from './store/toastStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const { open, message, severity, hideToast } = useToastStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="work-shifts" element={<WorkShiftsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="ai-dashboard" element={<AIDashboardPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toast open={open} message={message} severity={severity} onClose={hideToast} />
    </ThemeProvider>
  );
}

export default App;

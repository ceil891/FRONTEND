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
import { AIDashboardPage } from './pages/AIDashboard/AIDashboardPage';
import { StoresPage } from './pages/Stores/StoresPage';
import { UsersPage } from './pages/Users/UsersPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ActivityLogsPage } from './pages/ActivityLogs/ActivityLogsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { Toast } from './components/common/Toast';
import { useToastStore } from './store/toastStore';
import  {EmployeesPage} from './pages/Employees/EmployeesPage';
import { ReceiptPage } from './pages/finance/ReceiptPage';
import { PaymentPage } from './pages/finance/PaymentPage';
import { BankBookPage } from './pages/finance/BankBookPage';
import { CashBookPage } from './pages/finance/CashBookPage'; // Quên nhắc bạn import cái này ở tin nhắn trước
import { SupplierDebtPage } from './pages/finance/SupplierDebtPage';
import { EmployeePerformancePage } from './pages/Employees/EmployeePerformancePage';
import { StoreRevenueReport } from './pages/Reports/StoreRevenueReport';
import { TopProductsReport } from './pages/Reports/TopProductsReport';
import { StorePerformanceReport } from './pages/Reports/StorePerformanceReport';
import { SystemInventoryReport } from './pages/Reports/SystemInventoryReport';
import { ProfitLossReport } from './pages/Reports/ProfitLossReport';
import { LoyaltyPage } from './pages/Customers/LoyaltyPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { RetailOrdersPage } from './pages/Orders/RetailOrdersPage';
import { OnlineOrdersPage } from './pages/Orders/OnlineOrdersPage';
import { CancelledOrdersPage } from './pages/Orders/CancelledOrdersPage';
import { OrderHistoryPage } from './pages/Orders/OrderHistoryPage';
import { InventoryCheckPage } from './pages/Inventory/InventoryCheckPage';
import { ExportInventoryPage } from './pages/Inventory/ExportInventoryPage';
import { TransferInventoryPage } from './pages/Inventory/TransferInventoryPage';
import { ReturnCustomerPage } from './pages/Inventory/ReturnCustomerPage';
import { ReturnSupplierPage } from './pages/Inventory/ReturnSupplierPage';
import { ProductPricingPage } from './pages/Products/ProductPricingPage';
import { SuppliersPage } from './pages/Products/SuppliersPage';
import { RolePermissionPage } from './pages/Systems/RolePermissionPage';
import { ImportInventoryPage } from './pages/Inventory/ImportInventoryPage';
import { UnitsPage } from './pages/Products/UnitsPage';
import { AreasPage } from './pages/Stores/AreasPage';
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
            <Route path="ai-dashboard" element={<AIDashboardPage />} />
          <Route path="/finance/receipt" element={<ReceiptPage />} />
        <Route path="/finance/payment" element={<PaymentPage />} />
        <Route path="/finance/supplier-debt" element={<SupplierDebtPage />} />
        <Route path="/finance/cash-book" element={<CashBookPage />} />
        <Route path="/finance/bank-book" element={<BankBookPage />} />
        <Route path="/employees/performance" element={<EmployeePerformancePage />} />
<Route path="/reports/store-performance" element={<StorePerformanceReport />} />
        <Route path="/reports/system-inventory" element={<SystemInventoryReport />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
       <Route path="/orders/cancelled" element={<CancelledOrdersPage />} />
              <Route path="/inventory/import" element={<ImportInventoryPage/>} />
        <Route path="/orders/history" element={<OrderHistoryPage />} />
        <Route path="/orders/retail" element={<RetailOrdersPage />} />
        <Route path="/orders/online" element={<OnlineOrdersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/inventory/export" element={<ExportInventoryPage />} />
<Route path="/inventory/check" element={<InventoryCheckPage />} />
<Route path="/inventory/return-supplier" element={<ReturnSupplierPage />} />
        <Route path="/inventory/return-customer" element={<ReturnCustomerPage />} />
                <Route path="/stores/area" element={<AreasPage />} />
<Route path="/inventory/transfer" element={<TransferInventoryPage />} />
<Route path="/system/roles" element={<RolePermissionPage />} />
<Route path="/units" element={<UnitsPage />} />
        <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
        <Route path="/reports/store-revenue" element={<StoreRevenueReport />} />
        <Route path="/reports/top-products" element={<TopProductsReport />} />
        <Route path="/product-pricing" element={<ProductPricingPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="employees" element={<EmployeesPage />} />
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

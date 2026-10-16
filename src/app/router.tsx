import { createBrowserRouter } from 'react-router-dom';

// Layouts
import { StorefrontLayout } from '../components/layout/StorefrontLayout';
import { AppShell } from '../components/layout/AppShell';

// Storefront Pages
import { HomePage } from '../features/storefront/HomePage';
import { CatalogPage } from '../features/storefront/CatalogPage';
import { ProductDetailPage } from '../features/storefront/ProductDetailPage';
import { CartPage } from '../features/storefront/CartPage';
import { CheckoutPage } from '../features/storefront/CheckoutPage';
import { CustomerOrdersPage } from '../features/storefront/CustomerOrdersPage';

// Auth Page
import { LoginPage } from '../features/auth/LoginPage';

// App Pages
import { AppRoleRedirect } from './AppRoleRedirect';
import { OwnerDashboardPage } from '../features/owner/OwnerDashboardPage';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { PosPage } from '../features/pos/PosPage';
import { ProductListPage } from '../features/admin/ProductListPage';
import { PriceTierPage } from '../features/admin/PriceTierPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { OrderListPage } from '../features/orders/OrderListPage';
import { ReceivablesPage } from '../features/receivables/ReceivablesPage';
import { SalesReportPage } from '../features/owner/SalesReportPage';
import { SettingsPage } from '../features/admin/SettingsPage';
import { UserManagementPage } from '../features/users/UserManagementPage';
import { PurchasesPage } from '../features/purchases/PurchasesPage';

// 404 Fallback
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  // Public Storefront Routes
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'produk', element: <CatalogPage /> },
      { path: 'produk/:id', element: <ProductDetailPage /> },
      { path: 'keranjang', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'akun/pesanan', element: <CustomerOrdersPage /> },
    ],
  },

  // Role Switcher / Demo Login
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Internal Management App (AppShell)
  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <AppRoleRedirect /> },
      { path: 'owner', element: <OwnerDashboardPage /> },
      { path: 'admin', element: <AdminDashboardPage /> },
      { path: 'kasir', element: <PosPage /> },
      { path: 'produk', element: <ProductListPage /> },
      { path: 'harga', element: <PriceTierPage /> },
      { path: 'persediaan', element: <InventoryPage /> },
      { path: 'pembelian', element: <PurchasesPage /> },
      { path: 'supplier', element: <PurchasesPage /> },
      { path: 'pesanan', element: <OrderListPage /> },
      { path: 'piutang', element: <ReceivablesPage /> },
      { path: 'laporan', element: <SalesReportPage /> },
      { path: 'pengguna', element: <UserManagementPage /> },
      { path: 'pengaturan', element: <SettingsPage /> },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

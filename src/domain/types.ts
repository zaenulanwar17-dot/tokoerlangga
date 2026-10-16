export type Role = 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOMER';

export type PriceTier = 'RETAIL' | 'WHOLESALE_1' | 'WHOLESALE_2';

export type SalesChannel = 'POS' | 'ONLINE';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER_MANUAL'
  | 'PAYMENT_GATEWAY'
  | 'COD';

export type PaymentStatus =
  | 'PENDING'
  | 'AWAITING_VERIFICATION'
  | 'PAID'
  | 'PARTIAL'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ProductStock {
  onHand: number;
  reserved: number;
  available: number;
  status: StockStatus;
}

export interface PriceRule {
  id?: string;
  tier: PriceTier;
  minQuantity: number;
  unitPrice: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  categoryId: string;
  categoryName: string;
  costPrice: number; // HPP
  minStockAlert: number;
  isActive: boolean;
  description?: string;
  imageUrl?: string;
  stock: ProductStock;
  priceRules: PriceRule[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  tier: PriceTier;
  creditLimit: number;
  currentDebt: number;
  address?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  appliedTier: PriceTier;
  unitPrice: number;
  subtotal: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tier: PriceTier;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: SalesChannel;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    tier: PriceTier;
    address?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAmount: number;
  changeAmount: number;
  shippingProvider?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivablePayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface Receivable {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  payments: ReceivablePayment[];
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID';
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  changeAmount: number;
  previousOnHand: number;
  newOnHand: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
}

export type LogoApprovalStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LogoSubmission {
  proposedLogoUrl: string;
  submittedBy: string;
  submittedAt: string;
  note?: string;
  status: LogoApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface OwnerProfile {
  name: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  securityPin: string;
  notesForStaff?: string;
}

export interface StoreProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  receiptFooter: string;
  bankAccount: string;
  logoUrl?: string;
  logoSubmission?: LogoSubmission;
  ownerProfile?: OwnerProfile;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  pin?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export type ShiftApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface CashierShiftClosure {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime: string;
  initialCash: number;
  systemCashSales: number;
  systemNonCashSales: number;
  totalSystemCash: number;
  actualPhysicalCash: number;
  difference: number;
  differenceReason?: string;
  differenceNotes?: string;
  status: ShiftApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}




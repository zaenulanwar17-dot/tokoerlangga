import {
  Product,
  PriceRule,
  StockStatus,
  StockMovement,
  Order,
  SalesChannel,
  OrderStatus,
  Receivable,
  PaymentMethod,
  Customer,
  Role,
  AppUser,
  Purchase,
  Supplier,
  CashierShiftClosure,
} from '../../domain/types';

export interface ProductListParams {
  query?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface CreateProductInput {
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  categoryId: string;
  categoryName: string;
  costPrice: number;
  minStockAlert: number;
  description?: string;
  imageUrl?: string;
  initialOnHand?: number;
  priceRules: PriceRule[];
}

export interface IProductRepository {
  list(params?: ProductListParams): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  bulkCreate(inputs: CreateProductInput[]): Promise<Product[]>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  updatePriceRules(productId: string, rules: PriceRule[]): Promise<Product>;
  deactivate(id: string): Promise<Product>;
}

export interface IInventoryRepository {
  list(params?: { query?: string; status?: StockStatus }): Promise<Product[]>;
  adjust(
    productId: string,
    changeAmount: number,
    reason: string,
    user: string
  ): Promise<{ product: Product; movement: StockMovement }>;
  getMovements(productId?: string): Promise<StockMovement[]>;
}

export interface IOrderRepository {
  list(params?: { channel?: SalesChannel; status?: OrderStatus }): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  create(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  updateStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
    shippingProvider?: string
  ): Promise<Order>;
}

export interface IReceivableRepository {
  list(): Promise<Receivable[]>;
  getById(id: string): Promise<Receivable | null>;
  getByCustomerId(customerId: string): Promise<Receivable[]>;
  create(input: Omit<Receivable, 'id' | 'createdAt'>): Promise<Receivable>;
  recordPayment(
    receivableId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string
  ): Promise<Receivable>;
  settleCustomerDebt(
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string
  ): Promise<{ settledAmount: number; remainingDebt: number; affectedReceivables: Receivable[] }>;
  addCustomerDebt(
    customerId: string,
    customerName: string,
    customerPhone: string,
    amount: number,
    orderId: string,
    orderNumber: string,
    note?: string
  ): Promise<Receivable>;
}

export interface ICustomerRepository {
  list(): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(input: Omit<Customer, 'id'>): Promise<Customer>;
  bulkCreate(inputs: Omit<Customer, 'id'>[]): Promise<Customer[]>;
  update(id: string, updates: Partial<Customer>): Promise<Customer>;
}

export interface CreatePurchaseInput {
  supplierId?: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  purchaseDate?: string;
  items: {
    productId: string;
    productName?: string;
    quantity: number;
    costPrice: number;
  }[];
  paymentStatus?: 'PAID' | 'UNPAID';
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdBy?: string;
}

export interface IPurchaseRepository {
  list(): Promise<Purchase[]>;
  getById(id: string): Promise<Purchase | null>;
  create(input: CreatePurchaseInput): Promise<Purchase>;
}

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export interface ISupplierRepository {
  list(): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(input: CreateSupplierInput): Promise<Supplier>;
  update(id: string, input: UpdateSupplierInput): Promise<Supplier>;
  delete(id: string): Promise<boolean>;
}

export interface UserListParams {
  role?: Role;
  query?: string;
  isActive?: boolean;
}

export interface IUserRepository {
  list(params?: UserListParams): Promise<AppUser[]>;
  getById(id: string): Promise<AppUser | null>;
  create(input: Omit<AppUser, 'id' | 'createdAt'>): Promise<AppUser>;
  update(id: string, updates: Partial<AppUser>): Promise<AppUser>;
  delete(id: string): Promise<boolean>;
  toggleStatus(id: string): Promise<AppUser>;
  resetPin(id: string, newPin: string): Promise<AppUser>;
}

export interface CreateShiftClosureInput {
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime: string;
  initialCash: number;
  systemCashSales: number;
  systemNonCashSales: number;
  actualPhysicalCash: number;
  differenceReason?: string;
  differenceNotes?: string;
}

export interface ICashierShiftRepository {
  list(): Promise<CashierShiftClosure[]>;
  getById(id: string): Promise<CashierShiftClosure | null>;
  create(input: CreateShiftClosureInput): Promise<CashierShiftClosure>;
  approve(id: string, reviewerName: string, notes?: string): Promise<CashierShiftClosure>;
  reject(id: string, reviewerName: string, reason: string): Promise<CashierShiftClosure>;
}


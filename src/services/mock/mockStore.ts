import {
  Product,
  Customer,
  Order,
  Receivable,
  StockMovement,
  OrderStatus,
  PaymentMethod,
  AppUser,
  Purchase,
  Supplier,
  CashierShiftClosure,
} from '../../domain/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_RECEIVABLES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_APP_USERS,
  INITIAL_PURCHASES,
  INITIAL_SUPPLIERS,
  INITIAL_CASHIER_SHIFTS,
} from '../../data/demo-data';
import { calculateAvailableStock, calculateStockStatus, calculateReceivableStatus } from '../../domain/pricing';
import {
  IProductRepository,
  IInventoryRepository,
  IOrderRepository,
  IReceivableRepository,
  ICustomerRepository,
  IUserRepository,
  IPurchaseRepository,
  ISupplierRepository,
  ICashierShiftRepository,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateShiftClosureInput,
  ProductListParams,
  CreateProductInput,
  CreatePurchaseInput,
  UserListParams,
} from '../contracts';

const STORAGE_KEYS = {
  PRODUCTS: 'warung_sembako_products_v1',
  CUSTOMERS: 'warung_sembako_customers_v1',
  ORDERS: 'warung_sembako_orders_v1',
  RECEIVABLES: 'warung_sembako_receivables_v1',
  MOVEMENTS: 'warung_sembako_movements_v1',
  USERS: 'warung_sembako_users_v1',
  PURCHASES: 'warung_sembako_purchases_v1',
  SUPPLIERS: 'warung_sembako_suppliers_v1',
  SHIFTS: 'warung_sembako_shifts_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback if localStorage unavailable
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota error
  }
}

// In-Memory state loaded from storage/seed
let products: Product[] = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
let customers: Customer[] = loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
let orders: Order[] = loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
let receivables: Receivable[] = loadFromStorage(STORAGE_KEYS.RECEIVABLES, INITIAL_RECEIVABLES);
let movements: StockMovement[] = loadFromStorage(STORAGE_KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
let users: AppUser[] = loadFromStorage(STORAGE_KEYS.USERS, INITIAL_APP_USERS);
let purchases: Purchase[] = loadFromStorage(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
let suppliers: Supplier[] = loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
let cashierShifts: CashierShiftClosure[] = loadFromStorage(STORAGE_KEYS.SHIFTS, INITIAL_CASHIER_SHIFTS);

export function resetDemoData(): void {
  products = [...INITIAL_PRODUCTS];
  customers = [...INITIAL_CUSTOMERS];
  orders = [...INITIAL_ORDERS];
  receivables = [...INITIAL_RECEIVABLES];
  movements = [...INITIAL_STOCK_MOVEMENTS];
  users = [...INITIAL_APP_USERS];
  purchases = [...INITIAL_PURCHASES];
  suppliers = [...INITIAL_SUPPLIERS];
  cashierShifts = [...INITIAL_CASHIER_SHIFTS];
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  saveToStorage(STORAGE_KEYS.ORDERS, orders);
  saveToStorage(STORAGE_KEYS.RECEIVABLES, receivables);
  saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
  saveToStorage(STORAGE_KEYS.USERS, users);
  saveToStorage(STORAGE_KEYS.PURCHASES, purchases);
  saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  saveToStorage(STORAGE_KEYS.SHIFTS, cashierShifts);
}

export class MockProductRepository implements IProductRepository {
  async list(params?: ProductListParams): Promise<Product[]> {
    let result = [...products];
    if (params?.isActive !== undefined) {
      result = result.filter((p) => p.isActive === params.isActive);
    }
    if (params?.categoryId) {
      result = result.filter((p) => p.categoryId === params.categoryId);
    }
    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      );
    }
    return result;
  }

  async getById(id: string): Promise<Product | null> {
    const found = products.find((p) => p.id === id);
    return found ? { ...found } : null;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const onHand = input.initialOnHand || 0;
    const reserved = 0;
    const available = calculateAvailableStock(onHand, reserved);
    const status = calculateStockStatus(onHand, reserved, input.minStockAlert);

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      sku: input.sku.toUpperCase(),
      barcode: input.barcode,
      name: input.name,
      unit: input.unit,
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      costPrice: input.costPrice,
      minStockAlert: input.minStockAlert,
      isActive: true,
      description: input.description || '',
      imageUrl: input.imageUrl,
      stock: {
        onHand,
        reserved,
        available,
        status,
      },
      priceRules: input.priceRules,
    };

    products = [newProd, ...products];
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    if (onHand > 0) {
      const movement: StockMovement = {
        id: `mov_${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        changeAmount: onHand,
        previousOnHand: 0,
        newOnHand: onHand,
        reason: 'Stok awal produk baru',
        createdAt: new Date().toISOString(),
        createdBy: 'Admin Demo',
      };
      movements = [movement, ...movements];
      saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
    }

    return newProd;
  }

  async bulkCreate(inputs: CreateProductInput[]): Promise<Product[]> {
    const createdList: Product[] = [];
    const newMovements: StockMovement[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const onHand = input.initialOnHand || 0;
      const reserved = 0;
      const available = calculateAvailableStock(onHand, reserved);
      const status = calculateStockStatus(onHand, reserved, input.minStockAlert || 5);

      const newProd: Product = {
        id: `prod_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
        sku: input.sku.toUpperCase(),
        barcode: input.barcode || '',
        name: input.name,
        unit: input.unit || 'pcs',
        categoryId: input.categoryId || 'cat_beras',
        categoryName: input.categoryName || 'Sembako Umum',
        costPrice: input.costPrice || 0,
        minStockAlert: input.minStockAlert || 5,
        isActive: true,
        description: input.description,
        imageUrl: input.imageUrl,
        stock: {
          onHand,
          reserved,
          available,
          status,
        },
        priceRules: input.priceRules || [],
      };

      createdList.push(newProd);

      if (onHand > 0) {
        newMovements.push({
          id: `mov_${Date.now()}_${i}`,
          productId: newProd.id,
          productName: newProd.name,
          sku: newProd.sku,
          changeAmount: onHand,
          previousOnHand: 0,
          newOnHand: onHand,
          reason: 'Saldo awal migrasi Excel',
          createdAt: now,
          createdBy: 'Admin Migrasi',
        });
      }
    }

    products = [...createdList, ...products];
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    if (newMovements.length > 0) {
      movements = [...newMovements, ...movements];
      saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
    }

    return createdList;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Produk dengan ID ${id} tidak ditemukan.`);
    }
    const current = products[index];
    const updated: Product = {
      ...current,
      ...updates,
      sku: updates.sku ? updates.sku.toUpperCase() : current.sku,
    };
    products[index] = updated;
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return updated;
  }

  async updatePriceRules(productId: string, rules: typeof products[0]['priceRules']): Promise<Product> {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) {
      throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
    }
    products[index].priceRules = rules;
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  }

  async deactivate(id: string): Promise<Product> {
    return this.update(id, { isActive: false });
  }
}

export class MockInventoryRepository implements IInventoryRepository {
  async list(params?: { query?: string; status?: typeof products[0]['stock']['status'] }): Promise<Product[]> {
    let result = [...products];
    if (params?.status) {
      result = result.filter((p) => p.stock.status === params.status);
    }
    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      );
    }
    return result;
  }

  async adjust(
    productId: string,
    changeAmount: number,
    reason: string,
    user: string
  ): Promise<{ product: Product; movement: StockMovement }> {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) {
      throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
    }
    const prod = products[index];
    const previousOnHand = prod.stock.onHand;
    const newOnHand = Math.max(0, previousOnHand + changeAmount);
    const reserved = prod.stock.reserved;
    const available = calculateAvailableStock(newOnHand, reserved);
    const status = calculateStockStatus(newOnHand, reserved, prod.minStockAlert);

    prod.stock = {
      onHand: newOnHand,
      reserved,
      available,
      status,
    };
    products[index] = prod;
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      changeAmount,
      previousOnHand,
      newOnHand,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: user || 'Staff Demo',
    };
    movements = [movement, ...movements];
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    return { product: prod, movement };
  }

  async getMovements(productId?: string): Promise<StockMovement[]> {
    if (productId) {
      return movements.filter((m) => m.productId === productId);
    }
    return [...movements];
  }
}

export class MockOrderRepository implements IOrderRepository {
  async list(params?: { channel?: typeof orders[0]['channel']; status?: typeof orders[0]['orderStatus'] }): Promise<Order[]> {
    let result = [...orders];
    if (params?.channel) {
      result = result.filter((o) => o.channel === params.channel);
    }
    if (params?.status) {
      result = result.filter((o) => o.orderStatus === params.status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<Order | null> {
    const found = orders.find((o) => o.id === id);
    return found ? { ...found } : null;
  }

  async create(orderInput: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const id = `ord_${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = orderInput.channel === 'POS' ? 'POS' : 'ONL';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `${prefix}-${dateStr}-${randomSuffix}`;
    const now = new Date().toISOString();

    const createdOrder: Order = {
      ...orderInput,
      id,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };

    // Update product stock in memory
    for (const item of createdOrder.items) {
      const prodIndex = products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        const prod = products[prodIndex];
        if (orderInput.channel === 'POS') {
          // Direct physical deduction
          const newOnHand = Math.max(0, prod.stock.onHand - item.quantity);
          prod.stock.onHand = newOnHand;
          prod.stock.available = calculateAvailableStock(newOnHand, prod.stock.reserved);
          prod.stock.status = calculateStockStatus(newOnHand, prod.stock.reserved, prod.minStockAlert);
        } else {
          // Online order places stock on reserved until delivered/shipped
          prod.stock.reserved += item.quantity;
          prod.stock.available = calculateAvailableStock(prod.stock.onHand, prod.stock.reserved);
          prod.stock.status = calculateStockStatus(prod.stock.onHand, prod.stock.reserved, prod.minStockAlert);
        }
        products[prodIndex] = prod;
      }
    }
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    orders = [createdOrder, ...orders];
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    return createdOrder;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
    shippingProvider?: string
  ): Promise<Order> {
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Pesanan ${id} tidak ditemukan.`);
    }
    const order = orders[index];
    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingProvider) order.shippingProvider = shippingProvider;
    order.updatedAt = new Date().toISOString();

    if (status === 'COMPLETED' || status === 'DELIVERED') {
      order.paymentStatus = 'PAID';
      // Release reserved stock to physical deduction for online orders
      if (order.channel === 'ONLINE') {
        for (const item of order.items) {
          const prodIndex = products.findIndex((p) => p.id === item.productId);
          if (prodIndex !== -1) {
            const prod = products[prodIndex];
            prod.stock.reserved = Math.max(0, prod.stock.reserved - item.quantity);
            prod.stock.onHand = Math.max(0, prod.stock.onHand - item.quantity);
            prod.stock.available = calculateAvailableStock(prod.stock.onHand, prod.stock.reserved);
            prod.stock.status = calculateStockStatus(prod.stock.onHand, prod.stock.reserved, prod.minStockAlert);
          }
        }
        saveToStorage(STORAGE_KEYS.PRODUCTS, products);
      }
    }

    orders[index] = order;
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    return order;
  }
}

export class MockReceivableRepository implements IReceivableRepository {
  async list(): Promise<Receivable[]> {
    return [...receivables];
  }

  async getById(id: string): Promise<Receivable | null> {
    const found = receivables.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  async getByCustomerId(customerId: string): Promise<Receivable[]> {
    return receivables.filter((r) => r.customerId === customerId);
  }

  async create(input: Omit<Receivable, 'id' | 'createdAt'>): Promise<Receivable> {
    const newRcv: Receivable = {
      ...input,
      id: `rcv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    receivables = [newRcv, ...receivables];
    saveToStorage(STORAGE_KEYS.RECEIVABLES, receivables);

    // Update customer's currentDebt
    const custIndex = customers.findIndex((c) => c.id === input.customerId);
    if (custIndex !== -1) {
      customers[custIndex].currentDebt = (customers[custIndex].currentDebt || 0) + input.remainingAmount;
      saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }

    return newRcv;
  }

  async addCustomerDebt(
    customerId: string,
    customerName: string,
    customerPhone: string,
    amount: number,
    orderId: string,
    orderNumber: string,
    note?: string
  ): Promise<Receivable> {
    const newRcv: Receivable = {
      id: `rcv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      customerId,
      customerName,
      customerPhone,
      orderId,
      orderNumber,
      totalAmount: amount,
      remainingAmount: amount,
      status: 'UNPAID',
      payments: [],
      notes: note,
      createdAt: new Date().toISOString(),
    };
    receivables = [newRcv, ...receivables];
    saveToStorage(STORAGE_KEYS.RECEIVABLES, receivables);

    // Update customer's currentDebt akumulatif
    const custIndex = customers.findIndex((c) => c.id === customerId);
    if (custIndex !== -1) {
      customers[custIndex].currentDebt = (customers[custIndex].currentDebt || 0) + amount;
      saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }

    return newRcv;
  }

  async recordPayment(
    receivableId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string
  ): Promise<Receivable> {
    const index = receivables.findIndex((r) => r.id === receivableId);
    if (index === -1) {
      throw new Error(`Piutang ${receivableId} tidak ditemukan.`);
    }
    const rcv = receivables[index];
    if (amount <= 0) {
      throw new Error('Nominal pembayaran harus lebih dari 0.');
    }
    if (amount > rcv.remainingAmount) {
      throw new Error(`Nominal pembayaran (${amount}) melebihi sisa tagihan (${rcv.remainingAmount}).`);
    }

    const newRemaining = rcv.remainingAmount - amount;
    const newStatus = calculateReceivableStatus(newRemaining, rcv.totalAmount, rcv.dueDate);

    rcv.remainingAmount = newRemaining;
    rcv.status = newStatus;
    rcv.payments.push({
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount,
      paymentDate: new Date().toISOString(),
      paymentMethod,
      note: note || 'Pembayaran cicilan piutang',
    });

    // Update customer's currentDebt
    const custIndex = customers.findIndex((c) => c.id === rcv.customerId);
    if (custIndex !== -1) {
      customers[custIndex].currentDebt = Math.max(0, customers[custIndex].currentDebt - amount);
      saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }

    receivables[index] = rcv;
    saveToStorage(STORAGE_KEYS.RECEIVABLES, receivables);
    return rcv;
  }

  async settleCustomerDebt(
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    note?: string
  ): Promise<{ settledAmount: number; remainingDebt: number; affectedReceivables: Receivable[] }> {
    let unallocated = amount;
    const affected: Receivable[] = [];

    // Filter unpaid/partial receivables for this customer, oldest first
    const custReceivables = receivables
      .filter((r) => r.customerId === customerId && r.remainingAmount > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const rcv of custReceivables) {
      if (unallocated <= 0) break;
      const rcvIndex = receivables.findIndex((r) => r.id === rcv.id);
      if (rcvIndex === -1) continue;

      const deduction = Math.min(rcv.remainingAmount, unallocated);
      const newRemaining = rcv.remainingAmount - deduction;
      unallocated -= deduction;

      rcv.remainingAmount = newRemaining;
      rcv.status = newRemaining <= 0 ? 'PAID' : 'PARTIAL';
      rcv.payments.push({
        id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: deduction,
        paymentDate: new Date().toISOString(),
        paymentMethod,
        note: note || 'Pelunasan piutang akumulatif dari transaksi POS',
      });

      receivables[rcvIndex] = rcv;
      affected.push(rcv);
    }

    saveToStorage(STORAGE_KEYS.RECEIVABLES, receivables);

    let newCustomerDebt = 0;
    const custIndex = customers.findIndex((c) => c.id === customerId);
    if (custIndex !== -1) {
      newCustomerDebt = Math.max(0, (customers[custIndex].currentDebt || 0) - (amount - unallocated));
      customers[custIndex].currentDebt = newCustomerDebt;
      saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }

    return {
      settledAmount: amount - unallocated,
      remainingDebt: newCustomerDebt,
      affectedReceivables: affected,
    };
  }
}

export class MockCustomerRepository implements ICustomerRepository {
  async list(): Promise<Customer[]> {
    return [...customers];
  }

  async getById(id: string): Promise<Customer | null> {
    const found = customers.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async create(input: Omit<Customer, 'id'>): Promise<Customer> {
    const newCust: Customer = {
      ...input,
      id: `cust_${Date.now()}`,
    };
    customers = [newCust, ...customers];
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCust;
  }

  async bulkCreate(inputs: Omit<Customer, 'id'>[]): Promise<Customer[]> {
    const createdList: Customer[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const newCust: Customer = {
        ...input,
        id: `cust_${Date.now()}_${i}`,
      };
      createdList.push(newCust);

      if (newCust.currentDebt > 0) {
        const initialRcv: Receivable = {
          id: `rcv_init_${Date.now()}_${i}`,
          customerId: newCust.id,
          customerName: newCust.name,
          customerPhone: newCust.phone || '-',
          orderId: `migrasi_${Date.now()}_${i}`,
          orderNumber: 'SALDO-AWAL-MIGRASI',
          totalAmount: newCust.currentDebt,
          remainingAmount: newCust.currentDebt,
          status: 'UNPAID',
          payments: [],
          notes: 'Saldo piutang awal migrasi aplikasi lama',
          createdAt: now,
        };
        receivables = [initialRcv, ...receivables];
      }
    }

    customers = [...createdList, ...customers];
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    saveToStorage(STORAGE_KEYS.RECEIVABLES, receivables);

    return createdList;
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Pelanggan dengan ID ${id} tidak ditemukan.`);
    }
    const updated: Customer = {
      ...customers[index],
      ...updates,
    };
    customers[index] = updated;
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return updated;
  }
}

export class MockUserRepository implements IUserRepository {
  async list(params?: UserListParams): Promise<AppUser[]> {
    let result = [...users];
    if (params?.role) {
      result = result.filter((u) => u.role === params.role);
    }
    if (params?.isActive !== undefined) {
      result = result.filter((u) => u.isActive === params.isActive);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }
    return result;
  }

  async getById(id: string): Promise<AppUser | null> {
    const found = users.find((u) => u.id === id);
    return found ? { ...found } : null;
  }

  async create(input: Omit<AppUser, 'id' | 'createdAt'>): Promise<AppUser> {
    const newUser: AppUser = {
      ...input,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users = [newUser, ...users];
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  async update(id: string, updates: Partial<AppUser>): Promise<AppUser> {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error(`User dengan ID ${id} tidak ditemukan`);
    }
    users[idx] = { ...users[idx], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return users[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    if (users[idx].id === 'usr_owner' || users[idx].role === 'OWNER') {
      throw new Error('Akun Pemilik Toko (Owner) tidak dapat dihapus');
    }
    users.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return true;
  }

  async toggleStatus(id: string): Promise<AppUser> {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User dengan ID ${id} tidak ditemukan`);
    if (users[idx].id === 'usr_owner') {
      throw new Error('Status Pemilik Utama (Owner) tidak dapat dinonaktifkan');
    }
    users[idx] = { ...users[idx], isActive: !users[idx].isActive };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return users[idx];
  }

  async resetPin(id: string, newPin: string): Promise<AppUser> {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User dengan ID ${id} tidak ditemukan`);
    users[idx] = { ...users[idx], pin: newPin };
    saveToStorage(STORAGE_KEYS.USERS, users);
    return users[idx];
  }
}

export class MockPurchaseRepository implements IPurchaseRepository {
  async list(): Promise<Purchase[]> {
    return [...purchases].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<Purchase | null> {
    const found = purchases.find((p) => p.id === id);
    return found ? { ...found } : null;
  }

  async create(input: CreatePurchaseInput): Promise<Purchase> {
    const id = `pur_${Date.now()}`;
    const dateStr = (input.purchaseDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const purchaseNumber = `PO-${dateStr}-${randomSuffix}`;
    const now = new Date().toISOString();

    let totalAmount = 0;
    const purchaseItems: typeof purchases[0]['items'] = [];

    for (let i = 0; i < input.items.length; i++) {
      const itemInput = input.items[i];
      const prodIndex = products.findIndex((p) => p.id === itemInput.productId);
      if (prodIndex === -1) continue;

      const prod = products[prodIndex];
      const qty = Number(itemInput.quantity) || 0;
      const costPrice = Number(itemInput.costPrice) || prod.costPrice;
      const subtotal = qty * costPrice;
      totalAmount += subtotal;

      purchaseItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantity: qty,
        costPrice,
        subtotal,
      });

      // Otomatis langsung menambah stok barang onHand & available
      const prevOnHand = prod.stock.onHand;
      const newOnHand = prevOnHand + qty;
      const reserved = prod.stock.reserved;
      const available = calculateAvailableStock(newOnHand, reserved);
      const status = calculateStockStatus(newOnHand, reserved, prod.minStockAlert);

      prod.stock = {
        onHand: newOnHand,
        reserved,
        available,
        status,
      };
      prod.costPrice = costPrice;
      products[prodIndex] = prod;

      // Pencatatan mutasi stok
      const movement: StockMovement = {
        id: `mov_pur_${Date.now()}_${i}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        changeAmount: qty,
        previousOnHand: prevOnHand,
        newOnHand,
        reason: `Pembelian Kulakan Supplier: ${input.supplierName} (${purchaseNumber})`,
        createdAt: now,
        createdBy: input.createdBy || 'Admin Demo',
      };
      movements = [movement, ...movements];
    }

    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    const newPurchase: Purchase = {
      id,
      purchaseNumber,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      supplierInvoiceNumber: input.supplierInvoiceNumber,
      purchaseDate: input.purchaseDate || now.slice(0, 10),
      items: purchaseItems,
      totalAmount,
      paymentStatus: input.paymentStatus || 'PAID',
      paymentMethod: input.paymentMethod || 'CASH',
      notes: input.notes,
      createdAt: now,
      createdBy: input.createdBy || 'Admin Demo',
    };

    purchases = [newPurchase, ...purchases];
    saveToStorage(STORAGE_KEYS.PURCHASES, purchases);

    return newPurchase;
  }
}

export class MockSupplierRepository implements ISupplierRepository {
  async list(): Promise<Supplier[]> {
    return [...suppliers].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(id: string): Promise<Supplier | null> {
    const found = suppliers.find((s) => s.id === id);
    return found ? { ...found } : null;
  }

  async create(input: CreateSupplierInput): Promise<Supplier> {
    const id = `sup_${Date.now()}`;
    const newSupplier: Supplier = {
      id,
      name: input.name.trim(),
      contactPerson: input.contactPerson?.trim() || undefined,
      phone: input.phone.trim(),
      address: input.address?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    suppliers = [newSupplier, ...suppliers];
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    return newSupplier;
  }

  async update(id: string, input: UpdateSupplierInput): Promise<Supplier> {
    const index = suppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Supplier dengan ID ${id} tidak ditemukan`);
    }
    const updated: Supplier = {
      ...suppliers[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    suppliers[index] = updated;
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const prevLen = suppliers.length;
    suppliers = suppliers.filter((s) => s.id !== id);
    if (suppliers.length !== prevLen) {
      saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
      return true;
    }
    return false;
  }
}

export class MockCashierShiftRepository implements ICashierShiftRepository {
  async list(): Promise<CashierShiftClosure[]> {
    return [...cashierShifts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<CashierShiftClosure | null> {
    const found = cashierShifts.find((s) => s.id === id);
    return found ? { ...found } : null;
  }

  async create(input: CreateShiftClosureInput): Promise<CashierShiftClosure> {
    const id = `sft_${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const shiftNumber = `SFT-${dateStr}-${randomSuffix}`;
    const totalSystemCash = input.initialCash + input.systemCashSales;
    const difference = input.actualPhysicalCash - totalSystemCash;

    const newClosure: CashierShiftClosure = {
      id,
      shiftNumber,
      cashierId: input.cashierId,
      cashierName: input.cashierName,
      startTime: input.startTime,
      endTime: input.endTime,
      initialCash: input.initialCash,
      systemCashSales: input.systemCashSales,
      systemNonCashSales: input.systemNonCashSales,
      totalSystemCash,
      actualPhysicalCash: input.actualPhysicalCash,
      difference,
      differenceReason: input.differenceReason,
      differenceNotes: input.differenceNotes,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
    };

    cashierShifts = [newClosure, ...cashierShifts];
    saveToStorage(STORAGE_KEYS.SHIFTS, cashierShifts);
    return newClosure;
  }

  async approve(id: string, reviewerName: string, notes?: string): Promise<CashierShiftClosure> {
    const idx = cashierShifts.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error(`Shift dengan ID ${id} tidak ditemukan`);
    }
    const updated: CashierShiftClosure = {
      ...cashierShifts[idx],
      status: 'APPROVED',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes,
    };
    cashierShifts[idx] = updated;
    saveToStorage(STORAGE_KEYS.SHIFTS, cashierShifts);
    return updated;
  }

  async reject(id: string, reviewerName: string, reason: string): Promise<CashierShiftClosure> {
    const idx = cashierShifts.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error(`Shift dengan ID ${id} tidak ditemukan`);
    }
    const updated: CashierShiftClosure = {
      ...cashierShifts[idx],
      status: 'REJECTED',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reason,
    };
    cashierShifts[idx] = updated;
    saveToStorage(STORAGE_KEYS.SHIFTS, cashierShifts);
    return updated;
  }
}

// Singletons for application injection
export const productRepository = new MockProductRepository();
export const inventoryRepository = new MockInventoryRepository();
export const orderRepository = new MockOrderRepository();
export const receivableRepository = new MockReceivableRepository();
export const customerRepository = new MockCustomerRepository();
export const userRepository = new MockUserRepository();
export const purchaseRepository = new MockPurchaseRepository();
export const supplierRepository = new MockSupplierRepository();
export const cashierShiftRepository = new MockCashierShiftRepository();




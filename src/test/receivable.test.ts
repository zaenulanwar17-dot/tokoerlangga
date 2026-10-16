import { describe, it, expect, beforeEach } from 'vitest';
import { MockReceivableRepository, MockCustomerRepository } from '../services/mock/mockStore';

describe('Receivable & Customer Repositories', () => {
  let receivableRepo: MockReceivableRepository;
  let customerRepo: MockCustomerRepository;

  beforeEach(() => {
    receivableRepo = new MockReceivableRepository();
    customerRepo = new MockCustomerRepository();
  });

  it('bisa mendaftarkan pelanggan baru untuk transaksi kasbon', async () => {
    const created = await customerRepo.create({
      name: 'Ibu Ratna',
      phone: '081234567899',
      tier: 'RETAIL',
      creditLimit: 1000000,
      currentDebt: 0,
      notes: 'Pelanggan kasbon kasir',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Ibu Ratna');
    expect(created.currentDebt).toBe(0);

    const found = await customerRepo.getById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Ibu Ratna');
  });

  it('membuat piutang baru dengan status UNPAID dan menambah hutang pelanggan', async () => {
    const cust = await customerRepo.create({
      name: 'Pak Budi',
      phone: '081298765432',
      tier: 'RETAIL',
      creditLimit: 2000000,
      currentDebt: 0,
    });

    const rcv = await receivableRepo.create({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      orderId: 'ord_test_01',
      orderNumber: 'POS-20261014-001',
      totalAmount: 150000,
      remainingAmount: 150000,
      dueDate: '2026-10-28',
      status: 'UNPAID',
      payments: [],
    });

    expect(rcv.id).toBeDefined();
    expect(rcv.remainingAmount).toBe(150000);
    expect(rcv.status).toBe('UNPAID');

    // Customer debt must have been updated
    const updatedCust = await customerRepo.getById(cust.id);
    expect(updatedCust?.currentDebt).toBe(150000);
  });

  it('membuat piutang kurang bayar (PARTIAL) dengan DP dan mencatat pembayaran awal', async () => {
    const cust = await customerRepo.create({
      name: 'Ibu Maya',
      phone: '081211112222',
      tier: 'WHOLESALE_1',
      creditLimit: 5000000,
      currentDebt: 0,
    });

    const rcv = await receivableRepo.create({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      orderId: 'ord_test_02',
      orderNumber: 'POS-20261014-002',
      totalAmount: 500000,
      remainingAmount: 300000, // DP 200.000, sisa 300.000
      dueDate: '2026-10-28',
      status: 'PARTIAL',
      payments: [
        {
          id: 'pay_dp_1',
          amount: 200000,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'CASH',
          note: 'DP Kasir',
        },
      ],
    });

    expect(rcv.status).toBe('PARTIAL');
    expect(rcv.remainingAmount).toBe(300000);
    expect(rcv.payments.length).toBe(1);

    const updatedCust = await customerRepo.getById(cust.id);
    expect(updatedCust?.currentDebt).toBe(300000);
  });

  it('mencatat cicilan pelunasan piutang dan mengupdate sisa hutang', async () => {
    const cust = await customerRepo.create({
      name: 'Pak Ahmad',
      phone: '081233334444',
      tier: 'RETAIL',
      creditLimit: 1000000,
      currentDebt: 0,
    });

    const rcv = await receivableRepo.create({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      orderId: 'ord_test_03',
      orderNumber: 'POS-20261014-003',
      totalAmount: 100000,
      remainingAmount: 100000,
      dueDate: '2026-10-28',
      status: 'UNPAID',
      payments: [],
    });

    // Bayar cicilan pertama 60.000
    const afterFirstPay = await receivableRepo.recordPayment(rcv.id, 60000, 'CASH', 'Cicilan 1');
    expect(afterFirstPay.remainingAmount).toBe(40000);
    expect(afterFirstPay.status).toBe('PARTIAL');

    let updatedCust = await customerRepo.getById(cust.id);
    expect(updatedCust?.currentDebt).toBe(40000);

    // Bayar sisa 40.000 (Lunas)
    const afterSecondPay = await receivableRepo.recordPayment(rcv.id, 40000, 'BANK_TRANSFER_MANUAL', 'Pelunasan');
    expect(afterSecondPay.remainingAmount).toBe(0);
    expect(afterSecondPay.status).toBe('PAID');

    updatedCust = await customerRepo.getById(cust.id);
    expect(updatedCust?.currentDebt).toBe(0);
  });
});

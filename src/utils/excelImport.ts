import * as XLSX from 'xlsx';
import { CreateProductInput } from '../services/contracts';
import { Customer, PriceTier } from '../domain/types';

/**
 * Generate dan unduh template Excel untuk Import Produk
 */
export function downloadProductExcelTemplate(): void {
  const headers = [
    {
      nama_produk: 'Beras Ramos Super 5 kg',
      sku: 'BRS-RAMOS-5K',
      barcode: '899100100099',
      kategori: 'Beras & Biji-bijian',
      satuan: 'sak',
      hpp: 64000,
      harga_eceran: 72000,
      harga_grosir_1: 69000,
      min_qty_grosir_1: 5,
      harga_grosir_2: 67000,
      min_qty_grosir_2: 20,
      stok_awal: 50,
      min_stok_alert: 10,
      deskripsi: 'Beras pulen kualitas super tanpa pengawet',
    },
    {
      nama_produk: 'Minyak Goreng Pouch 2 Liter',
      sku: 'MYK-GRG-2L',
      barcode: '899100100098',
      kategori: 'Minyak & Mentega',
      satuan: 'pouch',
      hpp: 31000,
      harga_eceran: 35000,
      harga_grosir_1: 33500,
      min_qty_grosir_1: 6,
      harga_grosir_2: 32500,
      min_qty_grosir_2: 12,
      stok_awal: 40,
      min_stok_alert: 10,
      deskripsi: 'Minyak goreng sawit jernih kualitas ekspor',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(headers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Produk');
  XLSX.writeFile(workbook, 'template_import_produk_sembako.xlsx');
}

/**
 * Parse file Excel (.xlsx / .xls / .csv) untuk Import Produk
 */
export async function parseProductExcelFile(file: File): Promise<{
  data: CreateProductInput[];
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const data: CreateProductInput[] = [];
        const errors: string[] = [];

        if (rows.length === 0) {
          errors.push('File Excel kosong atau tidak memiliki baris data.');
          resolve({ data: [], errors });
          return;
        }

        rows.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1
          const name = String(row.nama_produk || row.nama || row.name || '').trim();
          if (!name) {
            errors.push(`Baris ${rowNum}: Nama produk wajib diisi.`);
            return;
          }

          const sku = String(
            row.sku ||
              `PRD-${Date.now().toString().slice(-4)}-${index + 1}`
          ).trim();
          const barcode = String(row.barcode || '').trim();
          const unit = String(row.satuan || row.unit || 'pcs').trim();
          const categoryName = String(row.kategori || row.category || 'Sembako Umum').trim();
          const costPrice = Math.max(0, Number(row.hpp || row.harga_beli || row.cost_price) || 0);
          const retailPrice = Math.max(
            costPrice,
            Number(row.harga_eceran || row.harga_jual || row.retail_price) || costPrice || 1000
          );
          const minStockAlert = Math.max(1, Number(row.min_stok_alert || row.min_stok) || 5);
          const initialOnHand = Math.max(0, Number(row.stok_awal || row.stok || row.stock) || 0);
          const description = String(row.deskripsi || row.keterangan || '').trim();

          // Tier rules
          const priceRules: CreateProductInput['priceRules'] = [
            { tier: 'RETAIL', minQuantity: 1, unitPrice: retailPrice },
          ];

          const wholesale1Price = Number(row.harga_grosir_1 || row.grosir_1);
          const wholesale1MinQty = Number(row.min_qty_grosir_1 || row.min_grosir_1) || 5;
          if (wholesale1Price && wholesale1Price > 0) {
            priceRules.push({
              tier: 'WHOLESALE_1',
              minQuantity: wholesale1MinQty,
              unitPrice: wholesale1Price,
            });
          }

          const wholesale2Price = Number(row.harga_grosir_2 || row.grosir_2);
          const wholesale2MinQty = Number(row.min_qty_grosir_2 || row.min_grosir_2) || 20;
          if (wholesale2Price && wholesale2Price > 0) {
            priceRules.push({
              tier: 'WHOLESALE_2',
              minQuantity: wholesale2MinQty,
              unitPrice: wholesale2Price,
            });
          }

          data.push({
            sku,
            barcode,
            name,
            unit,
            categoryId: 'cat_migrasi',
            categoryName,
            costPrice,
            minStockAlert,
            initialOnHand,
            description: description || undefined,
            priceRules,
          });
        });

        resolve({ data, errors });
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca format file Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Generate dan unduh template Excel untuk Import Pelanggan & Piutang
 */
export function downloadCustomerExcelTemplate(): void {
  const headers = [
    {
      nama_pelanggan: 'Toko Kelontong Berkah (Ibu Siti)',
      no_telepon: '0812-3456-7890',
      alamat: 'Jl. Merdeka No. 12, RT 02/03',
      tier_harga: 'WHOLESALE_1',
      limit_kredit: 5000000,
      saldo_piutang_awal: 750000,
      catatan: 'Pelanggan lama pindahan dari pembukuan buku tulis',
    },
    {
      nama_pelanggan: 'Warung Nasi Barokah (Pak Joko)',
      no_telepon: '0813-8877-6655',
      alamat: 'Komplek Griya Indah Blok A1',
      tier_harga: 'WHOLESALE_2',
      limit_kredit: 10000000,
      saldo_piutang_awal: 1200000,
      catatan: 'Langganan katering mingguan',
    },
    {
      nama_pelanggan: 'Ibu Ratna',
      no_telepon: '0857-1122-3344',
      alamat: 'Jl. Melati No. 4',
      tier_harga: 'RETAIL',
      limit_kredit: 500000,
      saldo_piutang_awal: 0,
      catatan: 'Pelanggan eceran perumahan',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(headers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Pelanggan');
  XLSX.writeFile(workbook, 'template_import_pelanggan_dan_piutang.xlsx');
}

/**
 * Parse file Excel (.xlsx / .xls / .csv) untuk Import Pelanggan & Saldo Piutang Awal
 */
export async function parseCustomerExcelFile(file: File): Promise<{
  data: Omit<Customer, 'id'>[];
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const data: Omit<Customer, 'id'>[] = [];
        const errors: string[] = [];

        if (rows.length === 0) {
          errors.push('File Excel kosong atau tidak memiliki baris data.');
          resolve({ data: [], errors });
          return;
        }

        rows.forEach((row, index) => {
          const rowNum = index + 2;
          const name = String(row.nama_pelanggan || row.nama || row.name || '').trim();
          if (!name) {
            errors.push(`Baris ${rowNum}: Nama pelanggan wajib diisi.`);
            return;
          }

          const phone = String(row.no_telepon || row.telepon || row.phone || row.hp || '-').trim();
          const address = String(row.alamat || row.address || '').trim();

          let rawTier = String(row.tier_harga || row.tier || 'RETAIL').toUpperCase().trim();
          let tier: PriceTier = 'RETAIL';
          if (rawTier.includes('2') || rawTier.includes('GROSIR_2') || rawTier.includes('WHOLESALE_2')) {
            tier = 'WHOLESALE_2';
          } else if (rawTier.includes('1') || rawTier.includes('GROSIR_1') || rawTier.includes('WHOLESALE_1')) {
            tier = 'WHOLESALE_1';
          }

          const creditLimit = Math.max(0, Number(row.limit_kredit || row.plafon || row.credit_limit) || 1000000);
          const currentDebt = Math.max(
            0,
            Number(row.saldo_piutang_awal || row.piutang_awal || row.hutang_lama || row.current_debt) || 0
          );
          const notes = String(row.catatan || row.notes || 'Migrasi Excel').trim();

          data.push({
            name,
            phone,
            address: address || undefined,
            tier,
            creditLimit,
            currentDebt,
            notes,
          });
        });

        resolve({ data, errors });
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca format file Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsBinaryString(file);
  });
}

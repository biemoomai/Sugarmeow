import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding dummy data...');

  const now = new Date();

  // Create products
  const p1 = await prisma.product.create({ data: { name: 'กล้วยหอม', grade: 'A' } });
  const p2 = await prisma.product.create({ data: { name: 'ส้มเขียวหวาน', grade: 'B' } });
  const p3 = await prisma.product.create({ data: { name: 'มะละกอ', grade: 'A' } });

  // Create supplier & customer
  const s1 = await prisma.supplier.create({ data: { name: 'สวนคุณแดง' } });
  const c1 = await prisma.customer.create({ data: { name: 'เจ๊ศรี ตลาดสด' } });
  const c2 = await prisma.customer.create({ data: { name: 'ร้านผลไม้เจ๊น้อย' } });

  // Purchases (Buy)
  await prisma.purchase.create({
    data: { supplierId: s1.id, productId: p1.id, quantity: 500, unit: 'kg', unitPrice: 15, totalAmount: 7500, date: now }
  });
  await prisma.purchase.create({
    data: { supplierId: s1.id, productId: p2.id, quantity: 200, unit: 'kg', unitPrice: 40, totalAmount: 8000, date: now }
  });

  // Sales (Sell)
  await prisma.sale.create({
    data: { customerId: c1.id, productId: p1.id, quantity: 100, unit: 'kg', unitPrice: 30, totalAmount: 3000, paymentStatus: 'PAID', paymentDate: now, date: now }
  });
  await prisma.sale.create({
    data: { customerId: c2.id, productId: p2.id, quantity: 50, unit: 'kg', unitPrice: 60, totalAmount: 3000, paymentStatus: 'PENDING', date: now }
  });

  // Expenses
  await prisma.expense.create({
    data: { category: 'ค่าแรง', amount: 1000, description: 'จ่ายค่าแรงลูกน้อง', date: now }
  });
  await prisma.expense.create({
    data: { category: 'ค่าน้ำมัน', amount: 500, description: 'เติมน้ำมันรถกระบะ', date: now }
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

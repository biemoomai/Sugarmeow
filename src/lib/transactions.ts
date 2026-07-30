import { prisma } from './prisma';

export async function processTransaction(payload: any) {
  const { intent, data } = payload;
  const { item, partner, qty, price, total, payment_status } = data;

  if (intent === 'buy') {
    // Ensure product exists
    let product = await prisma.product.findFirst({ where: { name: item } });
    if (!product) {
      product = await prisma.product.create({ data: { name: item } });
    }

    // Ensure supplier exists
    const supplierName = partner || 'ไม่ระบุ';
    let supplier = await prisma.supplier.findFirst({ where: { name: supplierName } });
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: { name: supplierName } });
    }

    await prisma.purchase.create({
      data: {
        supplierId: supplier.id,
        productId: product.id,
        quantityKg: qty || 0,
        unitPrice: price || 0,
        totalAmount: total || ((qty || 0) * (price || 0)),
      }
    });
  } else if (intent === 'sell') {
    // Ensure product exists
    let product = await prisma.product.findFirst({ where: { name: item } });
    if (!product) {
      product = await prisma.product.create({ data: { name: item } });
    }

    // Ensure customer exists
    const customerName = partner || 'ลูกค้าทั่วไป';
    let customer = await prisma.customer.findFirst({ where: { name: customerName } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { name: customerName } });
    }

    await prisma.sale.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        quantityKg: qty || 0,
        unitPrice: price || 0,
        totalAmount: total || ((qty || 0) * (price || 0)),
        paymentStatus: payment_status || 'PAID',
        paymentDate: payment_status === 'PAID' ? new Date() : null,
      }
    });
  } else if (intent === 'expense') {
    await prisma.expense.create({
      data: {
        category: item || 'อื่นๆ',
        amount: total || price || 0,
        description: partner || '',
      }
    });
  }
}

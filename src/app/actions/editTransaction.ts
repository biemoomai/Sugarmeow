'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function editTransaction(
  transactionId: string, 
  data: { 
    date?: Date,
    entityName?: string, 
    productName?: string, 
    amount?: number, 
    status?: string 
  }
) {
  try {
    const type = transactionId.charAt(0);
    const id = parseInt(transactionId.slice(2));

    if (type === 'E') {
      const updateData: any = {};
      if (data.date) updateData.date = data.date;
      if (data.amount) updateData.amount = data.amount;
      if (data.productName) updateData.description = data.productName;
      if (data.entityName) updateData.category = data.entityName;

      await prisma.expense.update({
        where: { id },
        data: updateData
      });
    } else {
      const updateData: any = {};
      if (data.date) updateData.date = data.date;
      if (data.amount) updateData.totalAmount = data.amount;
      if (data.status && type === 'S') updateData.paymentStatus = data.status;

      // Handle Customer/Supplier
      if (data.entityName) {
        if (type === 'S') {
          let customer = await prisma.customer.findFirst({ where: { name: data.entityName } });
          if (!customer) {
            customer = await prisma.customer.create({ data: { name: data.entityName } });
          }
          updateData.customerId = customer.id;
        } else if (type === 'P') {
          let supplier = await prisma.supplier.findFirst({ where: { name: data.entityName } });
          if (!supplier) {
            supplier = await prisma.supplier.create({ data: { name: data.entityName } });
          }
          updateData.supplierId = supplier.id;
        }
      }

      // Handle Product
      if (data.productName) {
        let product = await prisma.product.findFirst({ where: { name: data.productName } });
        if (!product) {
          product = await prisma.product.create({ data: { name: data.productName } });
        }
        updateData.productId = product.id;
      }

      if (type === 'S') {
        await prisma.sale.update({
          where: { id },
          data: updateData
        });
      } else if (type === 'P') {
        await prisma.purchase.update({
          where: { id },
          data: updateData
        });
      }
    }

    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit transaction:", error);
    return { success: false, error: error.message };
  }
}

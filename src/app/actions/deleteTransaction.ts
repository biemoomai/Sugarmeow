'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteTransaction(transactionId: string) {
  try {
    const type = transactionId.charAt(0);
    const id = parseInt(transactionId.slice(2));

    if (type === 'S') {
      await prisma.sale.delete({ where: { id } });
    } else if (type === 'P') {
      await prisma.purchase.delete({ where: { id } });
    } else if (type === 'E') {
      await prisma.expense.delete({ where: { id } });
    } else {
      throw new Error('Invalid transaction type');
    }

    revalidatePath('/transactions');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: error.message };
  }
}

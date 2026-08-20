import type { GoodsReceiptNoteItemInput } from "../types/goodsReceipt";

export function calculateItemAmount(item: Pick<GoodsReceiptNoteItemInput, "qty_actual" | "unit_price">): number {
  return Math.round(item.qty_actual * item.unit_price * 100) / 100;
}

export function calculateNoteTotal(items: GoodsReceiptNoteItemInput[]): number {
  const total = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  return Math.round(total * 100) / 100;
}

export function formatCurrency(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("vi-VN");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

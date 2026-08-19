import { CreateGoodsReceiptNoteInput, GoodsReceiptNoteItemInput } from "../types";

/**
 * Tinh "Thanh tien" cho 1 dong chi tiet = So luong thuc nhap * Don gia.
 * Lam tron 2 chu so thap phan (don vi VND thuong khong co le, nhung giu 2 so cho tong quat).
 */
export function calculateItemAmount(item: Pick<GoodsReceiptNoteItemInput, "qty_actual" | "unit_price">): number {
  const amount = item.qty_actual * item.unit_price;
  return Math.round(amount * 100) / 100;
}

//  Tinh "Cong" (tong tien) cua toan bo phieu nhap kho = tong Thanh tien cua tat ca cac dong.
export function calculateNoteTotal(items: GoodsReceiptNoteItemInput[]): number {
  const total = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  return Math.round(total * 100) / 100;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate du lieu dau vao khi tao 1 phieu nhap kho moi.
 * Bao gom validate cac truong bat buoc theo mau 01-VT va validate tung dong chi tiet.
 */
export function validateCreateNotePayload(payload: CreateGoodsReceiptNoteInput): ValidationResult {
  const errors: string[] = [];

  if (!payload.note_number || payload.note_number.trim() === "") {
    errors.push("Số phiếu (note_number) không được để trống");
  }
  if (!payload.note_date) {
    errors.push("Ngày lập phiếu (note_date) không được để trống");
  } else if (Number.isNaN(Date.parse(payload.note_date))) {
    errors.push("Ngày lập phiếu (note_date) không đúng định dạng ngày hợp lệ");
  }
  if (!payload.deliverer_name || payload.deliverer_name.trim() === "") {
    errors.push("Họ và tên người giao hàng (deliverer_name) không được để trống");
  }
  if (!payload.warehouse_name || payload.warehouse_name.trim() === "") {
    errors.push("Kho nhập hàng (warehouse_name) không được để trống");
  }
  if (!payload.items || payload.items.length === 0) {
    errors.push("Phiếu nhập kho phải có ít nhất 1 dòng vật tư/hàng hoá");
  } else {
    payload.items.forEach((item, index) => {
      const rowLabel = `Dòng ${index + 1}`;
      if (!item.material_name || item.material_name.trim() === "") {
        errors.push(`${rowLabel}: tên vật tư/hàng hoá không được để trống`);
      }
      if (item.qty_actual === undefined || item.qty_actual === null) {
        errors.push(`${rowLabel}: số lượng thực nhập không được để trống`);
      } else if (item.qty_actual < 0) {
        errors.push(`${rowLabel}: số lượng thực nhập không được âm`);
      }
      if (item.unit_price === undefined || item.unit_price === null) {
        errors.push(`${rowLabel}: đơn giá không được để trống`);
      } else if (item.unit_price < 0) {
        errors.push(`${rowLabel}: đơn giá không được âm`);
      }
      if (item.qty_per_document !== undefined && item.qty_per_document < 0) {
        errors.push(`${rowLabel}: số lượng theo chứng từ không được âm`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

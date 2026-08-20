import type {
  ApiErrorBody,
  CreateGoodsReceiptNoteInput,
  GoodsReceiptNote,
} from "../types/goodsReceipt";

const BASE_URL = "/api/goods-receipt-notes";

export class ApiError extends Error {
  errors: string[];
  status: number;
  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? "Đã xảy ra lỗi");
    this.status = status;
    this.errors = body.errors ?? (body.message ? [body.message] : ["Lỗi không xác định"]);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data as ApiErrorBody);
  }
  return data as T;
}

export async function createGoodsReceiptNote(
  payload: CreateGoodsReceiptNoteInput
): Promise<GoodsReceiptNote> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<GoodsReceiptNote>(res);
}

export async function listGoodsReceiptNotes(): Promise<GoodsReceiptNote[]> {
  const res = await fetch(BASE_URL);
  return handleResponse<GoodsReceiptNote[]>(res);
}

export async function getGoodsReceiptNoteById(id: number): Promise<GoodsReceiptNote> {
  const res = await fetch(`${BASE_URL}/${id}`);
  return handleResponse<GoodsReceiptNote>(res);
}

export async function deleteGoodsReceiptNote(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data as ApiErrorBody);
  }
}

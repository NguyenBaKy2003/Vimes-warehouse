// Kieu du lieu tuong ung voi bang goods_receipt_note_items
export interface GoodsReceiptNoteItemInput {
  line_no: number;
  material_name: string;
  material_code?: string | null;
  unit_name?: string | null;
  qty_per_document: number;
  qty_actual: number;
  unit_price: number;
}

export interface GoodsReceiptNoteItem extends GoodsReceiptNoteItemInput {
  id: number;
  note_id: number;
  amount: number;
}

export interface CreateGoodsReceiptNoteInput {
  company_name?: string;
  department_name?: string;
  note_number: string;
  note_date: string;
  debit_account?: string;
  credit_account?: string;
  deliverer_name: string;
  ref_document_no?: string;
  ref_document_date?: string;
  ref_document_issuer?: string;
  warehouse_name: string;
  warehouse_address?: string;
  total_amount_in_words?: string;
  attached_documents_count?: number;
  preparer_name?: string;
  warehouse_keeper_name?: string;
  chief_accountant_name?: string;
  items: GoodsReceiptNoteItemInput[];
}

export interface GoodsReceiptNote {
  id: number;
  company_name: string | null;
  department_name: string | null;
  note_number: string;
  note_date: string;
  debit_account: string | null;
  credit_account: string | null;
  deliverer_name: string;
  ref_document_no: string | null;
  ref_document_date: string | null;
  ref_document_issuer: string | null;
  warehouse_name: string;
  warehouse_address: string | null;
  total_amount: number;
  total_amount_in_words: string | null;
  attached_documents_count: number;
  preparer_name: string | null;
  warehouse_keeper_name: string | null;
  chief_accountant_name: string | null;
  created_at: string;
  updated_at: string;
  items?: GoodsReceiptNoteItem[];
}
import { PoolClient } from "pg";
import { pool } from "../db";
import { CreateGoodsReceiptNoteInput, GoodsReceiptNote, GoodsReceiptNoteItem } from "../types";
import { calculateNoteTotal, validateCreateNotePayload } from "../utils/goodsReceiptCalc";

export class ValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super("Validation failed");
    this.errors = errors;
  }
}

export class NotFoundError extends Error {}

const PG_UNIQUE_VIOLATION = "23505";

interface PgError extends Error {
  code?: string;
  constraint?: string;
}

function isPgUniqueViolation(err: unknown): err is PgError {
  return !!err && typeof err === "object" && (err as PgError).code === PG_UNIQUE_VIOLATION;
}

export async function createGoodsReceiptNote(
  input: CreateGoodsReceiptNoteInput
): Promise<GoodsReceiptNote> {
  const validation = validateCreateNotePayload(input);
  if (!validation.valid) {
    throw new ValidationError(validation.errors);
  }

  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    const totalAmount = calculateNoteTotal(input.items);

    let noteResult;
    try {
      noteResult = await client.query(
        `INSERT INTO goods_receipt_notes
          (company_name, department_name, note_number, note_date, debit_account, credit_account,
           deliverer_name, ref_document_no, ref_document_date, ref_document_issuer, warehouse_name,
           warehouse_address, total_amount, total_amount_in_words, attached_documents_count,
           preparer_name, warehouse_keeper_name, chief_accountant_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          input.company_name ?? null,
          input.department_name ?? null,
          input.note_number,
          input.note_date,
          input.debit_account ?? null,
          input.credit_account ?? null,
          input.deliverer_name,
          input.ref_document_no ?? null,
          input.ref_document_date ?? null,
          input.ref_document_issuer ?? null,
          input.warehouse_name,
          input.warehouse_address ?? null,
          totalAmount,
          input.total_amount_in_words ?? null,
          input.attached_documents_count ?? 0,
          input.preparer_name ?? null,
          input.warehouse_keeper_name ?? null,
          input.chief_accountant_name ?? null,
        ]
      );
    } catch (err) {
      if (isPgUniqueViolation(err) && err.constraint === "goods_receipt_notes_note_number_key") {
        throw new ValidationError([`Số phiếu "${input.note_number}" đã tồn tại, vui lòng chọn số phiếu khác`]);
      }
      throw err;
    }

    const note = noteResult.rows[0];

    const itemRows: GoodsReceiptNoteItem[] = [];
    for (const item of input.items) {
      const itemResult = await client.query(
        `INSERT INTO goods_receipt_note_items
          (note_id, line_no, material_name, material_code, unit_name,
           qty_per_document, qty_actual, unit_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          note.id,
          item.line_no,
          item.material_name,
          item.material_code ?? null,
          item.unit_name ?? null,
          item.qty_per_document ?? 0,
          item.qty_actual,
          item.unit_price,
        ]
      );
      itemRows.push(itemResult.rows[0]);
    }

    await client.query("COMMIT");
    return { ...note, items: itemRows };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getGoodsReceiptNoteById(id: number): Promise<GoodsReceiptNote> {
  const noteResult = await pool.query("SELECT * FROM goods_receipt_notes WHERE id = $1", [id]);
  if (noteResult.rows.length === 0) {
    throw new NotFoundError(`Không tìm thấy phiếu nhập kho id=${id}`);
  }
  const itemsResult = await pool.query(
    "SELECT * FROM goods_receipt_note_items WHERE note_id = $1 ORDER BY line_no ASC",
    [id]
  );
  return { ...noteResult.rows[0], items: itemsResult.rows };
}

export async function listGoodsReceiptNotes(limit = 50, offset = 0): Promise<GoodsReceiptNote[]> {
  const result = await pool.query(
    "SELECT * FROM goods_receipt_notes ORDER BY note_date DESC, id DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return result.rows;
}

export async function deleteGoodsReceiptNote(id: number): Promise<void> {
  const result = await pool.query("DELETE FROM goods_receipt_notes WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    throw new NotFoundError(`Không tìm thấy phiếu nhập kho id=${id}`);
  }
}
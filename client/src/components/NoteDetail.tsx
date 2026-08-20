import { useEffect, useState } from "react";
import type { GoodsReceiptNote } from "../types/goodsReceipt";
import { getGoodsReceiptNoteById } from "../api/goodsReceiptApi";
import { formatCurrency, formatDate } from "../utils/calc";

interface Props {
  id: number;
  onBack: () => void;
}

export default function NoteDetail({ id, onBack }: Props) {
  const [note, setNote] = useState<GoodsReceiptNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNote(null);
    setError(null);
    getGoodsReceiptNoteById(id)
      .then((data) => {
        if (!cancelled) setNote(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không tìm thấy phiếu nhập kho.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div>
      <div className="actions back-btn">
        <button type="button" onClick={onBack}>
          ← Quay lại danh sách
        </button>
      </div>

      {error && <div className="message error">{error}</div>}

      {note && (
        <>
          <h1>Chi tiết phiếu nhập kho #{note.note_number}</h1>
          <div className="detail-grid">
            {[
              ["Đơn vị", note.company_name || "-"],
              ["Bộ phận", note.department_name || "-"],
              ["Số phiếu", note.note_number],
              ["Ngày lập phiếu", formatDate(note.note_date)],
              ["Nợ (TK)", note.debit_account || "-"],
              ["Có (TK)", note.credit_account || "-"],
              ["Người giao hàng", note.deliverer_name],
              ["Theo (HĐ/PO) số", note.ref_document_no || "-"],
              ["Ngày chứng từ", formatDate(note.ref_document_date) || "-"],
              ["Của (đơn vị/NCC)", note.ref_document_issuer || "-"],
              ["Nhập tại kho", note.warehouse_name],
              ["Địa điểm", note.warehouse_address || "-"],
              ["Số chứng từ gốc kèm theo", String(note.attached_documents_count ?? 0)],
              ["Tổng tiền (viết bằng chữ)", note.total_amount_in_words || "-"],
              ["Người lập phiếu", note.preparer_name || "-"],
              ["Thủ kho", note.warehouse_keeper_name || "-"],
              ["Kế toán trưởng", note.chief_accountant_name || "-"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </div>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên vật tư/hàng hoá</th>
                <th>Mã số</th>
                <th>Đơn vị tính</th>
                <th>SL theo chứng từ</th>
                <th>SL thực nhập</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(note.items ?? []).map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td className="text-left">{item.material_name}</td>
                  <td>{item.material_code}</td>
                  <td>{item.unit_name}</td>
                  <td className="num">{formatCurrency(item.qty_per_document)}</td>
                  <td className="num">{formatCurrency(item.qty_actual)}</td>
                  <td className="num">{formatCurrency(item.unit_price)}</td>
                  <td className="num">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ textAlign: "right" }}>
                  Tổng Cộng
                </td>
                <td>{formatCurrency(note.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </div>
  );
}

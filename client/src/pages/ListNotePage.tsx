import { useEffect, useState } from "react";
import type { GoodsReceiptNote } from "../types/goodsReceipt";
import { listGoodsReceiptNotes } from "../api/goodsReceiptApi";
import { formatCurrency, formatDate } from "../utils/calc";
import NoteDetail from "../components/NoteDetail";

export default function ListNotePage() {
  const [notes, setNotes] = useState<GoodsReceiptNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listGoodsReceiptNotes();
      setNotes(data);
    } catch (err) {
      setError((err as Error).message || "Lỗi kết nối tới server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (selectedId !== null) {
    return <NoteDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      <div className="actions">
        <button type="button" onClick={load}>
          ↻ Tải lại danh sách
        </button>
      </div>

      <table id="notesTable">
        <thead>
          <tr>
            <th>Số phiếu</th>
            <th>Ngày lập</th>
            <th>Người giao hàng</th>
            <th>Kho nhập</th>
            <th className="num">Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note.id}>
              <td>{note.note_number}</td>
              <td>{formatDate(note.note_date)}</td>
              <td>{note.deliverer_name}</td>
              <td>{note.warehouse_name}</td>
              <td className="num">{formatCurrency(note.total_amount)}</td>
              <td>
                <button className="link-btn" onClick={() => setSelectedId(note.id)}>
                  Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && <div className="loading-state">Đang tải danh sách...</div>}
      {!loading && !error && notes.length === 0 && (
        <div className="empty-state">Chưa có phiếu nhập kho nào.</div>
      )}
      {error && <div className="message error">{error}</div>}
    </div>
  );
}

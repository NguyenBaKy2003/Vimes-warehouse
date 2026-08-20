import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GoodsReceiptNoteItemInput } from "../types/goodsReceipt";
import { calculateItemAmount, calculateNoteTotal, formatCurrency } from "../utils/calc";
import { createGoodsReceiptNote, ApiError } from "../api/goodsReceiptApi";

type DraftItem = GoodsReceiptNoteItemInput & { key: number };

let keyCounter = 0;
function emptyItem(): DraftItem {
  keyCounter += 1;
  return {
    key: keyCounter,
    line_no: 0,
    material_name: "",
    material_code: "",
    unit_name: "",
    qty_per_document: 0,
    qty_actual: 0,
    unit_price: 0,
  };
}

export default function CreateNotePage() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("Công ty CP Phần mềm Y tế Việt Nam");
  const [departmentName, setDepartmentName] = useState("");
  const [noteNumber, setNoteNumber] = useState("");
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [delivererName, setDelivererName] = useState("");
  const [refDocNo, setRefDocNo] = useState("");
  const [refDocDate, setRefDocDate] = useState("");
  const [refDocIssuer, setRefDocIssuer] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [totalInWords, setTotalInWords] = useState("");
  const [attachedDocsCount, setAttachedDocsCount] = useState(0);
  const [preparerName, setPreparerName] = useState("");
  const [warehouseKeeperName, setWarehouseKeeperName] = useState("");
  const [chiefAccountantName, setChiefAccountantName] = useState("");

  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const total = calculateNoteTotal(items);

  function updateItem(key: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function addRow() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeRow(key: number) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  async function handleSubmit() {
    setErrors([]);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const note = await createGoodsReceiptNote({
        company_name: companyName,
        department_name: departmentName,
        note_number: noteNumber,
        note_date: noteDate,
        debit_account: debitAccount,
        credit_account: creditAccount,
        deliverer_name: delivererName,
        ref_document_no: refDocNo,
        ref_document_date: refDocDate || null,
        ref_document_issuer: refDocIssuer,
        warehouse_name: warehouseName,
        warehouse_address: warehouseAddress,
        total_amount_in_words: totalInWords,
        attached_documents_count: attachedDocsCount,
        preparer_name: preparerName,
        warehouse_keeper_name: warehouseKeeperName,
        chief_accountant_name: chiefAccountantName,
        items: items.map((it, idx) => ({
          line_no: idx + 1,
          material_name: it.material_name,
          material_code: it.material_code,
          unit_name: it.unit_name,
          qty_per_document: it.qty_per_document,
          qty_actual: it.qty_actual,
          unit_price: it.unit_price,
        })),
      });
      setSuccessMsg(`Đã lưu phiếu nhập kho #${note.note_number} thành công.`);
      setTimeout(() => navigate("/notes"), 900);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
      } else {
        setErrors([(err as Error).message || "Lỗi kết nối tới server"]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-wrap">
      <div className="header-row">
        <div className="org-fields">
          <label>Đơn vị</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <label>Bộ phận</label>
          <input
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="Phòng Kho vận"
          />
        </div>
        <div style={{ textAlign: "right" }}>
          <div>Mẫu số 01 - VT</div>
          <div>
            (Ban hành theo Thông tư số 200/2014/TT-BTC
            <br />
            ngày 22/12/2014 của Bộ Tài chính)
          </div>
        </div>
      </div>

      <h1>Phiếu nhập kho</h1>

      <div className="meta-grid">
        <div>
          <label>Ngày lập phiếu</label>
          <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
        </div>
        <div>
          <label>Số phiếu</label>
          <input
            value={noteNumber}
            onChange={(e) => setNoteNumber(e.target.value)}
            placeholder="PNK-2026-0001"
          />
        </div>
        <div>
          <label>Nợ (TK)</label>
          <input value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)} placeholder="152" />
        </div>
        <div>
          <label>Có (TK)</label>
          <input value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} placeholder="331" />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label>Họ và tên người giao hàng</label>
          <input
            value={delivererName}
            onChange={(e) => setDelivererName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label>Theo (HĐ/PO) số</label>
          <input value={refDocNo} onChange={(e) => setRefDocNo(e.target.value)} placeholder="HĐ-0099" />
        </div>
        <div>
          <label>Ngày chứng từ</label>
          <input type="date" value={refDocDate} onChange={(e) => setRefDocDate(e.target.value)} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label>Của (đơn vị/nhà cung cấp)</label>
          <input
            value={refDocIssuer}
            onChange={(e) => setRefDocIssuer(e.target.value)}
            placeholder="Công ty TNHH ABC"
          />
        </div>
        <div>
          <label>Nhập tại kho</label>
          <input
            value={warehouseName}
            onChange={(e) => setWarehouseName(e.target.value)}
            placeholder="Kho vật tư y tế trung tâm"
          />
        </div>
        <div>
          <label>Địa điểm</label>
          <input
            value={warehouseAddress}
            onChange={(e) => setWarehouseAddress(e.target.value)}
            placeholder="Tầng 2, 73 Lý Nam Đế, Hà Nội"
          />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowSpan={2}>STT</th>
            <th rowSpan={2}>Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ sản phẩm, hàng hoá</th>
            <th rowSpan={2}>Mã số</th>
            <th rowSpan={2}>Đơn vị tính</th>
            <th colSpan={2}>Số lượng</th>
            <th rowSpan={2}>Đơn giá</th>
            <th rowSpan={2}>Thành tiền</th>
            <th rowSpan={2}></th>
          </tr>
          <tr>
            <th>Theo chứng từ</th>
            <th>Thực nhập</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.key}>
              <td>{idx + 1}</td>
              <td>
                <input
                  className="text-left"
                  value={it.material_name}
                  onChange={(e) => updateItem(it.key, { material_name: e.target.value })}
                  placeholder="Tên vật tư/hàng hoá"
                />
              </td>
              <td>
                <input
                  value={it.material_code ?? ""}
                  onChange={(e) => updateItem(it.key, { material_code: e.target.value })}
                  placeholder="VT001"
                />
              </td>
              <td>
                <input
                  value={it.unit_name ?? ""}
                  onChange={(e) => updateItem(it.key, { unit_name: e.target.value })}
                  placeholder="Cái"
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.001"
                  value={it.qty_per_document}
                  onChange={(e) => updateItem(it.key, { qty_per_document: parseFloat(e.target.value) || 0 })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.001"
                  value={it.qty_actual}
                  onChange={(e) => updateItem(it.key, { qty_actual: parseFloat(e.target.value) || 0 })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={it.unit_price}
                  onChange={(e) => updateItem(it.key, { unit_price: parseFloat(e.target.value) || 0 })}
                />
              </td>
              <td className="line-amount">{formatCurrency(calculateItemAmount(it))}</td>
              <td>
                <button type="button" onClick={() => removeRow(it.key)} disabled={items.length === 1}>
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7} style={{ textAlign: "right" }}>
              Tổng Cộng
            </td>
            <td>{formatCurrency(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div className="actions">
        <button type="button" onClick={addRow}>
          + Thêm dòng
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Đang lưu..." : "Lưu phiếu nhập kho"}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="message error">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}
      {successMsg && <div className="message success">{successMsg}</div>}

      <div className="meta-grid" style={{ marginTop: 16 }}>
        <div>
          <label>Tổng số tiền (viết bằng chữ)</label>
          <input value={totalInWords} onChange={(e) => setTotalInWords(e.target.value)} />
        </div>
        <div>
          <label>Số chứng từ gốc kèm theo</label>
          <input
            type="number"
            value={attachedDocsCount}
            onChange={(e) => setAttachedDocsCount(parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      <div className="signatures">
        <div>
          Người lập phiếu
          <span>(Ký, họ tên)</span>
          <input value={preparerName} onChange={(e) => setPreparerName(e.target.value)} placeholder="Họ và tên" />
        </div>
        <div>
          Người giao hàng
          <span>(Ký, họ tên)</span>
          <input disabled value={delivererName} placeholder="(theo thông tin phía trên)" />
        </div>
        <div>
          Thủ kho
          <span>(Ký, họ tên)</span>
          <input
            value={warehouseKeeperName}
            onChange={(e) => setWarehouseKeeperName(e.target.value)}
            placeholder="Họ và tên"
          />
        </div>
        <div>
          Kế toán trưởng
          <span>(Ký, họ tên)</span>
          <input
            value={chiefAccountantName}
            onChange={(e) => setChiefAccountantName(e.target.value)}
            placeholder="Họ và tên"
          />
        </div>
      </div>
    </div>
  );
}

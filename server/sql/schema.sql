-- 1. Phieu nhap kho (header)
CREATE TABLE goods_receipt_notes (
    id SERIAL PRIMARY KEY,
    -- Thong tin don vi lap phieu (goc tren cung ben trai cua mau)
    company_name VARCHAR(255),
    -- Don vi
    department_name VARCHAR(255),
    -- Bo phan
    note_number VARCHAR(50) UNIQUE NOT NULL,
    -- So phieu
    note_date DATE NOT NULL,
    -- Ngay lap phieu
    debit_account VARCHAR(50),
    -- No (TK)
    credit_account VARCHAR(50),
    -- Co (TK)
    deliverer_name VARCHAR(255) NOT NULL,
    -- Ho va ten nguoi giao
    ref_document_no VARCHAR(100),
    -- Theo (HD/PO) so
    ref_document_date DATE,
    -- Ngay chung tu
    ref_document_issuer VARCHAR(255),
    -- Cua (don vi/NCC)
    warehouse_name VARCHAR(255) NOT NULL,
    -- Nhap tai kho (nhap tay, khong FK)
    warehouse_address VARCHAR(500),
    -- Dia diem kho (nhap tay)
    total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    -- Cong (tinh tu chi tiet)
    total_amount_in_words VARCHAR(500),
    -- Tong so tien viet bang chu
    attached_documents_count BIGINT DEFAULT 0,
    -- So chung tu goc kem theo
    -- Thong tin ky xac nhan (phan cuoi mau)
    preparer_name VARCHAR(255),
    -- Nguoi lap phieu (Ky, ho ten)
    warehouse_keeper_name VARCHAR(255),
    -- Thu kho (Ky, ho ten)
    chief_accountant_name VARCHAR(255),
    -- Ke toan truong (hoac bo phan co nhu cau nhap) (Ky, ho ten)
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
-- 2. Chi tiet phieu nhap kho (line items)
CREATE TABLE goods_receipt_note_items (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    -- STT
    material_name VARCHAR(255) NOT NULL,
    -- Ten, nhan hieu, quy cach vat tu/hang hoa
    material_code VARCHAR(50),
    -- Ma so
    unit_name VARCHAR(50),
    -- Don vi tinh (nhap tay, khong FK)
    qty_per_document NUMERIC(18, 3) NOT NULL DEFAULT 0,
    -- SL theo chung tu
    qty_actual NUMERIC(18, 3) NOT NULL DEFAULT 0,
    -- SL thuc nhap
    unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    -- Don gia
    amount NUMERIC(18, 2) GENERATED ALWAYS AS (qty_actual * unit_price) STORED -- Thanh tien
);
-- INDEXES
CREATE INDEX idx_grn_note_date ON goods_receipt_notes(note_date);
CREATE INDEX idx_grn_warehouse_name ON goods_receipt_notes(warehouse_name);
CREATE INDEX idx_grn_items_note ON goods_receipt_note_items(note_id);
import {
  calculateItemAmount,
  calculateNoteTotal,
  validateCreateNotePayload,
} from "../src/utils/goodsReceiptCalc";
import { CreateGoodsReceiptNoteInput } from "../src/types";

describe("calculateItemAmount", () => {
  it("tính đúng thành tiền = số lượng thực nhập * đơn giá", () => {
    expect(calculateItemAmount({ qty_actual: 10, unit_price: 15000 })).toBe(150000);
  });

  it("làm tròn 2 chữ số thập phân", () => {
    expect(calculateItemAmount({ qty_actual: 3, unit_price: 10.005 })).toBe(30.02);
  });

  it("trả về 0 khi số lượng bằng 0", () => {
    expect(calculateItemAmount({ qty_actual: 0, unit_price: 999 })).toBe(0);
  });
});

describe("calculateNoteTotal", () => {
  it("tính đúng tổng tiền của nhiều dòng chi tiết", () => {
    const items = [
      { line_no: 1, material_name: "Khẩu trang y tế", qty_per_document: 100, qty_actual: 100, unit_price: 1000 },
      { line_no: 2, material_name: "Găng tay cao su", qty_per_document: 50, qty_actual: 48, unit_price: 2000 },
    ];
    // 100*1000 + 48*2000 = 100000 + 96000 = 196000
    expect(calculateNoteTotal(items)).toBe(196000);
  });

  it("trả về 0 khi danh sách rỗng", () => {
    expect(calculateNoteTotal([])).toBe(0);
  });
});

describe("validateCreateNotePayload", () => {
  const basePayload: CreateGoodsReceiptNoteInput = {
    company_name: "Công ty CP Phần mềm Y tế Việt Nam",
    department_name: "Phòng Kho vận",
    note_number: "PNK-0001",
    note_date: "2026-08-24",
    deliverer_name: "Nguyễn Văn A",
    warehouse_name: "Kho vật tư y tế trung tâm",
    preparer_name: "Trần Thị B",
    warehouse_keeper_name: "Lê Văn C",
    chief_accountant_name: "Phạm Thị D",
    items: [
      { line_no: 1, material_name: "Khẩu trang y tế", qty_per_document: 10, qty_actual: 10, unit_price: 1000 },
    ],
  };

  it("hợp lệ khi đầy đủ thông tin bắt buộc", () => {
    const result = validateCreateNotePayload(basePayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("hợp lệ ngay cả khi bỏ trống các trường không bắt buộc (đơn vị, bộ phận, người ký)", () => {
    const { company_name, department_name, preparer_name, warehouse_keeper_name, chief_accountant_name, ...rest } =
      basePayload;
    const result = validateCreateNotePayload(rest as CreateGoodsReceiptNoteInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("báo lỗi khi thiếu số phiếu", () => {
    const result = validateCreateNotePayload({ ...basePayload, note_number: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Số phiếu"))).toBe(true);
  });

  it("báo lỗi khi ngày lập phiếu không hợp lệ", () => {
    const result = validateCreateNotePayload({ ...basePayload, note_date: "not-a-date" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Ngày lập phiếu"))).toBe(true);
  });

  it("báo lỗi khi không có dòng chi tiết nào", () => {
    const result = validateCreateNotePayload({ ...basePayload, items: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("ít nhất 1 dòng"))).toBe(true);
  });

  it("báo lỗi khi số lượng thực nhập âm", () => {
    const result = validateCreateNotePayload({
      ...basePayload,
      items: [{ line_no: 1, material_name: "Test", qty_per_document: 5, qty_actual: -1, unit_price: 100 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("không được âm"))).toBe(true);
  });

  it("báo lỗi khi đơn giá âm", () => {
    const result = validateCreateNotePayload({
      ...basePayload,
      items: [{ line_no: 1, material_name: "Test", qty_per_document: 5, qty_actual: 5, unit_price: -100 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("đơn giá không được âm"))).toBe(true);
  });

  it("báo lỗi khi thiếu tên vật tư ở 1 dòng bất kỳ", () => {
    const result = validateCreateNotePayload({
      ...basePayload,
      items: [{ line_no: 1, material_name: "", qty_per_document: 5, qty_actual: 5, unit_price: 100 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("tên vật tư"))).toBe(true);
  });
});
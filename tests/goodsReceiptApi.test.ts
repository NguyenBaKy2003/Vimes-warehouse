import request from "supertest";
import { createApp } from "../src/app";
import * as service from "../src/services/goodsReceiptService";
import { ValidationError, NotFoundError } from "../src/services/goodsReceiptService";

// Mock cac ham cua service layer de test API/controller ma khong can ket noi PostgreSQL that,
// nhung GIU NGUYEN class ValidationError/NotFoundError that de "instanceof" trong controller
// hoat dong dung (jest.mock tu dong se pha vo instanceof neu auto-mock ca class).
jest.mock("../src/services/goodsReceiptService", () => {
  const actual = jest.requireActual("../src/services/goodsReceiptService");
  return {
    ...actual,
    createGoodsReceiptNote: jest.fn(),
    getGoodsReceiptNoteById: jest.fn(),
    listGoodsReceiptNotes: jest.fn(),
    deleteGoodsReceiptNote: jest.fn(),
  };
});

const mockedService = service as jest.Mocked<typeof service>;

describe("API /api/goods-receipt-notes", () => {
  const app = createApp();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST tạo phiếu nhập kho thành công trả về 201", async () => {
    const fakeNote = {
      id: 1,
      company_name: "Công ty CP Phần mềm Y tế Việt Nam",
      department_name: "Phòng Kho vận",
      note_number: "PNK-0001",
      note_date: "2026-08-24",
      total_amount: 100000,
      preparer_name: "Trần Thị B",
      warehouse_keeper_name: "Lê Văn C",
      chief_accountant_name: "Phạm Thị D",
      items: [],
    };
    mockedService.createGoodsReceiptNote.mockResolvedValue(fakeNote as any);

    const res = await request(app)
      .post("/api/goods-receipt-notes")
      .send({
        company_name: "Công ty CP Phần mềm Y tế Việt Nam",
        department_name: "Phòng Kho vận",
        note_number: "PNK-0001",
        note_date: "2026-08-24",
        deliverer_name: "Nguyễn Văn A",
        warehouse_name: "Kho vật tư y tế trung tâm",
        preparer_name: "Trần Thị B",
        warehouse_keeper_name: "Lê Văn C",
        chief_accountant_name: "Phạm Thị D",
        items: [{ line_no: 1, material_name: "Khẩu trang", qty_actual: 100, unit_price: 1000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.note_number).toBe("PNK-0001");
    expect(res.body.company_name).toBe("Công ty CP Phần mềm Y tế Việt Nam");
    expect(res.body.department_name).toBe("Phòng Kho vận");
    expect(res.body.preparer_name).toBe("Trần Thị BTrần Thị B");
    expect(res.body.warehouse_keeper_name).toBe("Lê Văn C");
    expect(res.body.chief_accountant_name).toBe("Phạm Thị D");
    expect(mockedService.createGoodsReceiptNote).toHaveBeenCalledTimes(1);
  });

  it("POST tạo phiếu thành công ngay cả khi bỏ trống các trường không bắt buộc (đơn vị, bộ phận, người ký)", async () => {
    const fakeNote = {
      id: 2,
      note_number: "PNK-0002",
      note_date: "2026-08-24",
      total_amount: 50000,
      items: [],
    };
    mockedService.createGoodsReceiptNote.mockResolvedValue(fakeNote as any);

    const res = await request(app)
      .post("/api/goods-receipt-notes")
      .send({
        note_number: "PNK-0002",
        note_date: "2026-08-24",
        deliverer_name: "Nguyễn Văn A",
        warehouse_name: "Kho vật tư y tế trung tâm",
        items: [{ line_no: 1, material_name: "Khẩu trang", qty_actual: 50, unit_price: 1000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.note_number).toBe("PNK-0002");
  });

  it("POST trả về 400 kèm danh sách lỗi khi dữ liệu không hợp lệ", async () => {
    mockedService.createGoodsReceiptNote.mockRejectedValue(
      new ValidationError(["Số phiếu (note_number) không được để trống"])
    );

    const res = await request(app).post("/api/goods-receipt-notes").send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContain("Số phiếu (note_number) không được để trống");
  });

  it("GET /:id trả về phiếu nhập kho khi tồn tại (kèm đủ các trường mới)", async () => {
    mockedService.getGoodsReceiptNoteById.mockResolvedValue({
      id: 1,
      company_name: "Công ty CP Phần mềm Y tế Việt Nam",
      department_name: "Phòng Kho vận",
      note_number: "PNK-0001",
      preparer_name: "Trần Thị B",
      warehouse_keeper_name: "Lê Văn C",
      chief_accountant_name: "Phạm Thị D",
    } as any);

    const res = await request(app).get("/api/goods-receipt-notes/1");

    expect(res.status).toBe(200);
    expect(res.body.note_number).toBe("PNK-0001");
    expect(res.body.company_name).toBe("Công ty CP Phần mềm Y tế Việt Nam");
    expect(res.body.department_name).toBe("Phòng Kho vận");
    expect(res.body.preparer_name).toBe("Trần Thị B");
    expect(res.body.warehouse_keeper_name).toBe("Lê Văn C");
    expect(res.body.chief_accountant_name).toBe("Phạm Thị D");
  });

  it("GET /:id trả về 404 khi không tìm thấy phiếu", async () => {
    mockedService.getGoodsReceiptNoteById.mockRejectedValue(
      new NotFoundError("Không tìm thấy phiếu nhập kho id=99")
    );

    const res = await request(app).get("/api/goods-receipt-notes/99");

    expect(res.status).toBe(404);
  });

  it("GET / trả về danh sách phiếu nhập kho", async () => {
    mockedService.listGoodsReceiptNotes.mockResolvedValue([
      { id: 1, note_number: "PNK-0001" } as any,
      { id: 2, note_number: "PNK-0002" } as any,
    ]);

    const res = await request(app).get("/api/goods-receipt-notes");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("DELETE /:id trả về 204 khi xoá thành công", async () => {
    mockedService.deleteGoodsReceiptNote.mockResolvedValue(undefined);

    const res = await request(app).delete("/api/goods-receipt-notes/1");

    expect(res.status).toBe(204);
  });
});
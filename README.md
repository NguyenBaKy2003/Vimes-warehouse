# VIMES Warehouse — Quản lý Phiếu nhập kho

Ứng dụng quản lý Phiếu nhập kho theo **Mẫu số 01-VT** (ban hành theo Thông tư
200/2014/TT-BTC), gồm 2 phần: giao diện nhập liệu (React) và API lưu trữ dữ
liệu (Express + PostgreSQL).

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc & cấu trúc thư mục](#kiến-trúc--cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt lần đầu](#cài-đặt-lần-đầu)
- [Chạy dự án (dev)](#chạy-dự-án-dev)
- [Build production](#build-production)
- [Chạy test](#chạy-test)
- [API](#api)
- [Hướng dẫn sử dụng giao diện](#hướng-dẫn-sử-dụng-giao-diện)
- [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
- [Hướng cải tiến tiếp theo](#hướng-cải-tiến-tiếp-theo)

## Tổng quan

Chương trình cho phép:

- Nhập liệu Phiếu nhập kho theo đúng bố cục mẫu giấy 01-VT (đơn vị, bộ phận,
  người giao hàng, kho nhập, chứng từ gốc, bảng chi tiết vật tư, người ký...).
- Tự động tính "Thành tiền" từng dòng và "Cộng" tổng phiếu.
- Lưu trữ vào PostgreSQL qua transaction (đảm bảo header và chi tiết luôn
  nhất quán).
- Xem danh sách phiếu đã lưu và xem chi tiết từng phiếu.

## Kiến trúc & cấu trúc thư mục

Frontend (`client/`) gọi REST API của Backend (`server/`), Backend qua
Service Layer xử lý nghiệp vụ (validate, tính tiền, transaction) rồi thao
tác với PostgreSQL.

```
VIMES-WAREHOUSE/
├── client/                      ← Frontend: React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CreateNotePage.tsx   ← Form tạo phiếu
│   │   │   └── ListNotePage.tsx     ← Danh sách phiếu
│   │   ├── components/
│   │   │   └── NoteDetail.tsx       ← Xem chi tiết 1 phiếu
│   │   ├── api/goodsReceiptApi.ts   ← Gọi fetch tới /api/...
│   │   ├── types/goodsReceipt.ts    ← Type dùng chung (đồng bộ với server)
│   │   ├── utils/calc.ts            ← Tính tiền hiển thị realtime
│   │   ├── App.tsx / main.tsx
│   │   └── styles.css
│   ├── vite.config.ts               ← Có proxy /api sang server lúc dev
│   └── package.json
│
├── server/                      ← Backend: Express + TypeScript
│   ├── src/
│   │   ├── app.ts
│   │   ├── types.ts
│   │   ├── db.ts                    ← Kết nối PostgreSQL
│   │   ├── utils/goodsReceiptCalc.ts   ← Tính tiền + validate
│   │   └── services/goodsReceiptService.ts  ← Nghiệp vụ chính + transaction
│   ├── sql/schema.sql               ← Script khởi tạo database
│   ├── tests/                       ← Unit test & API test (Jest)
│   ├── .env                         ← Cấu hình kết nối DB (tự tạo, xem bên dưới)
│   └── package.json
│
└── README.md                    ← File này
```

### Vai trò từng lớp

| Lớp | File chính | Nhiệm vụ |
|---|---|---|
| Frontend | `client/src/pages/*.tsx` | 2 trang Tạo phiếu / Danh sách, tự tính thành tiền, gọi API |
| Frontend API client | `client/src/api/goodsReceiptApi.ts` | Tập trung toàn bộ lời gọi fetch, xử lý lỗi |
| Types | `types.ts` (2 bên) | Interface dùng chung input/output |
| Utils | `goodsReceiptCalc.ts` | Hàm thuần tính tiền, tổng tiền, validate payload |
| Service | `goodsReceiptService.ts` | Validate → transaction → INSERT/SELECT/DELETE |
| Database | `sql/schema.sql` | 2 bảng: `goods_receipt_notes` (header) và `goods_receipt_note_items` (chi tiết) |

## Yêu cầu môi trường

- Node.js ≥ 18
- PostgreSQL ≥ 13
- npm

## Cài đặt lần đầu

**Bước 1 — Tạo database và khởi tạo schema:**

```bash
psql -U <user> -d <database_name> -f server/sql/schema.sql
```

**Bước 2 — Cấu hình kết nối PostgreSQL:**

Tạo file `server/.env` với nội dung tương tự:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vimes_warehouse
DB_USER=postgres
DB_PASSWORD=your_password
```

**Bước 3 — Cài dependencies:**

```bash
cd server
npm install

cd ../client
npm install
```

## Chạy dự án (dev)

Cần mở **2 cửa sổ terminal** riêng biệt, chạy đồng thời:

```bash
# Terminal 1 — Backend
cd server
npm run dev
# → Express chạy ở http://localhost:3000
```

```bash
# Terminal 2 — Frontend
cd client
npm run dev
# → Vite chạy ở http://localhost:5173
```

Mở trình duyệt vào **`http://localhost:5173`** — đây là địa chỉ để thao tác.
Mọi request `/api/...` từ React sẽ tự động được Vite proxy sang cổng 3000
của Express (cấu hình trong `client/vite.config.ts`), không cần cấu hình
CORS ở backend.

## Build production

Gộp Frontend + Backend thành 1 server duy nhất:

**Bước 1 —** Build React ra thư mục `server/public`:

```bash
cd client
npm run build
```

**Bước 2 —** Thêm đoạn sau vào `server/src/app.ts` (đặt **sau** các route
`/api`):

```ts
import path from "path";

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
```

**Bước 3 —** Chạy backend:

```bash
cd server
npm start
```

Truy cập `http://localhost:3000` là ra thẳng giao diện — không cần chạy Vite
dev server nữa.

## Chạy test

```bash
cd server
npm test
```

| File test | Phạm vi |
|---|---|
| `tests/goodsReceiptCalc.test.ts` | Hàm tính tiền + validate (thuần logic, không cần DB) |
| `tests/goodsReceiptApi.test.ts` | API layer (mock service, dùng `supertest`) |

> Service layer (transaction, rollback, unique constraint) hiện được test
> gián tiếp qua API test với mock. Xem [Hướng cải tiến](#hướng-cải-tiến-tiếp-theo)
> để biết kế hoạch bổ sung integration test thật với DB.

## API

Base URL: `/api/goods-receipt-notes`

| Method | Endpoint | Mô tả | Response |
|---|---|---|---|
| POST | `/` | Tạo phiếu nhập kho mới (kèm danh sách items) | `201` + phiếu vừa tạo / `400` nếu lỗi validate hoặc trùng số phiếu |
| GET | `/` | Lấy danh sách phiếu (phân trang `limit`/`offset`) | `200` + mảng phiếu |
| GET | `/:id` | Lấy chi tiết 1 phiếu (kèm items) | `200` + phiếu / `404` nếu không tồn tại |
| DELETE | `/:id` | Xoá 1 phiếu (cascade xoá items) | `204` / `404` nếu không tồn tại |

### Quy tắc validate

- `note_number`: bắt buộc, không rỗng, **duy nhất** (trùng sẽ trả `400` với
  thông báo rõ ràng, không phải lỗi `500`).
- `note_date`: bắt buộc, đúng định dạng ngày.
- `deliverer_name`: bắt buộc.
- `warehouse_name`: bắt buộc.
- Phải có ít nhất 1 dòng vật tư/hàng hoá.
- Mỗi dòng: tên vật tư bắt buộc; số lượng thực nhập và đơn giá không được âm.
- `company_name`, `department_name`, `preparer_name`, `warehouse_keeper_name`,
  `chief_accountant_name` là tuỳ chọn.

## Hướng dẫn sử dụng giao diện

### Tab "Tạo phiếu mới"

1. Điền thông tin chung: Đơn vị, Bộ phận, Ngày lập phiếu, Số phiếu, TK Nợ/Có,
   Người giao hàng, thông tin chứng từ gốc, Kho nhập và địa điểm.
2. Bấm **"+ Thêm dòng"** để thêm dòng vật tư/hàng hoá; mỗi dòng cần ít nhất
   Tên vật tư, Số lượng thực nhập và Đơn giá.
3. Cột "Thành tiền" và dòng "Cộng" tự cập nhật ngay khi gõ số liệu.
4. Có thể xoá 1 dòng bằng nút **"X"** (không xoá được nếu chỉ còn 1 dòng).
5. Điền "Tổng số tiền viết bằng chữ" và "Số chứng từ gốc kèm theo" nếu cần.
6. Phần chữ ký cuối form: điền tên Người lập phiếu, Thủ kho, Kế toán trưởng;
   ô "Người giao hàng" tự đồng bộ theo tên đã nhập ở phần trên.
7. Bấm **"Lưu phiếu nhập kho"**. Nếu thiếu trường bắt buộc hoặc số phiếu bị
   trùng, hệ thống báo lỗi màu đỏ ngay trên form. Nếu thành công, báo màu
   xanh và tự chuyển sang tab Danh sách.

### Tab "Danh sách phiếu"

- Hiển thị toàn bộ phiếu đã lưu: Số phiếu, Ngày lập, Người giao hàng, Kho
  nhập, Tổng tiền.
- Bấm **"↻ Tải lại danh sách"** để lấy dữ liệu mới nhất từ server.
- Bấm **"Xem chi tiết"** trên 1 dòng để xem đầy đủ thông tin và bảng chi
  tiết vật tư.
- Bấm **"← Quay lại danh sách"** để trở về.

## Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `localhost:5173` báo `ERR_CONNECTION_REFUSED` | Chưa chạy `npm run dev` tại `client/`, hoặc terminal đó đã bị đóng/dừng | Mở lại terminal, `cd client`, chạy `npm run dev`, kiểm tra dòng `Local: http://localhost:5173` |
| Tab Danh sách phiếu báo lỗi kết nối tới server | Backend (`server/`) chưa chạy, hoặc chạy sai cổng 3000 | Kiểm tra terminal chạy `npm run dev` tại `server/`, đảm bảo không báo lỗi và đang lắng nghe cổng 3000 |
| Lưu phiếu báo lỗi 400 kèm danh sách lỗi | Thiếu trường bắt buộc, hoặc dòng vật tư không hợp lệ | Đọc kỹ thông báo lỗi màu đỏ trên form, bổ sung đúng trường còn thiếu |
| Lưu phiếu báo lỗi "Số phiếu đã tồn tại" | `note_number` bị trùng với phiếu đã lưu trước đó (cột `UNIQUE`) | Đổi sang một số phiếu khác chưa dùng |
| Port 5173 hoặc 3000 báo đã bị chiếm dụng | Có tiến trình khác đang dùng cổng đó | Windows: `netstat -ano \| findstr :5173` để tìm và tắt tiến trình, hoặc dùng cổng khác mà Vite/Express tự đề xuất |
| Backend báo lỗi kết nối PostgreSQL khi khởi động | Sai thông tin trong `server/.env`, hoặc PostgreSQL chưa chạy | Kiểm tra lại `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`, đảm bảo service PostgreSQL đang chạy |

## Hướng cải tiến tiếp theo

- Sinh tự động `note_number` (`PNK-YYYY-xxxx`) thay vì để người dùng tự nhập.
- Thêm trạng thái phiếu (`draft` / `confirmed` / `cancelled`) và API
  `PUT/PATCH` để sửa phiếu trước khi duyệt.
- Soft delete (`deleted_at`) thay vì xoá cứng — vì đây là chứng từ kế toán
  cần lưu vết.
- Tự sinh "Tổng số tiền viết bằng chữ" từ `total_amount` thay vì gõ tay.
- Chức năng in phiếu ra PDF đúng theo mẫu giấy 01-VT.
- Bổ sung integration test thật với PostgreSQL (testcontainers) để test
  transaction/rollback và unique constraint.

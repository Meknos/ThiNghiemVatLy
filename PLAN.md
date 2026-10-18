# Kế hoạch thực hiện — AIPLab Studio (THCS)

Mục tiêu: giáo viên nhập ngữ cảnh hoặc một bài toán, AI tạo ra thí nghiệm, giáo viên tương tác trực tiếp. Nội dung bám sách giáo khoa Khoa học tự nhiên THCS (lớp 6–9).

Nguồn danh mục: `Bo_tai_lieu_website_mo_phong_vat_ly_THCS.xlsx` (17 thí nghiệm, 10 công thức).

## Quyết định nền

| Hạng mục | Lựa chọn | Trạng thái |
|---|---|---|
| Giao diện | Vite + React + TypeScript | Giả định, chờ xác nhận |
| Vẽ | SVG cho sơ đồ (tia sáng, mạch điện, dụng cụ đo); Canvas cho chuyển động | Chốt |
| Cơ học vật rắn | Matter.js, chỉ dùng cho mô-đun "Lực và chuyển động" | Chốt |
| Công thức | KaTeX | Chốt |
| Kiểm thử | Vitest, bắt buộc cho mọi hàm tính | Chốt |
| Kiểm tra dữ liệu | Zod (dùng chung cho giao diện và kết quả AI) | Chốt |
| Biểu đồ | Thành phần tự viết (đã có), không thêm thư viện | Chốt |
| Backend AI | Node + Hono, khóa API nằm trong `.env` phía máy chủ | Chốt |
| Nhà cung cấp AI | Đề xuất Claude Sonnet 5.5 | Chờ xác nhận + khóa API |
| Bộ sách giáo khoa | Chưa biết; tạm gắn nhãn theo lớp và chủ đề | Chờ xác nhận |
| Trọng trường mặc định | g = 10 N/kg (khớp P ≈ 10m) | Chốt |

## Nguyên tắc thiết kế

1. Mỗi thí nghiệm là một **mẫu** có tham số. Thêm thí nghiệm mới = thêm một thư mục và một dòng đăng ký.
2. **AI trích dữ kiện, mã nguồn tính toán.** AI chỉ chọn mẫu và điền tham số; mọi kết quả số do hàm đã kiểm thử tính.
3. Mọi tham số (từ người dùng hay từ AI) đều qua kiểm tra khoảng giá trị và đơn vị.
4. Đề bài không khớp mẫu nào thì báo "chưa hỗ trợ" và gợi ý mẫu gần nhất. Không dựng bừa.
5. Thuật ngữ và công thức ở mức THCS: "tốc độ", P ≈ 10m, p = d·h, F_A = d·V, không dùng ký hiệu véc-tơ.

## Cấu trúc thư mục đích

```
server/
  index.ts              máy chủ Hono, một điểm cuối POST /api/tao-thi-nghiem
  prompt.ts             lời nhắc hệ thống, sinh từ danh sách mẫu
  provider.ts           lớp gọi mô hình (thay được nhà cung cấp) + bản giả lập để phát triển
src/
  app/                  App.tsx, định tuyến, bố cục
  core/
    types.ts            ExperimentTemplate, ParamDef, OutputDef
    registry.ts         danh sách mẫu
    validate.ts         kiểm tra tham số theo ParamDef
    units.ts            đổi đơn vị (cm² ↔ m², g ↔ kg, ...)
  components/           Catalog, ExperimentLayout, ParamPanel, ResultPanel, FormulaView, AiPanel, LiveChart
  experiments/
    ap-suat-chat-ran/   model.ts, model.test.ts, View.tsx, index.ts
    phan-xa-anh-sang/
    mach-dien-don-gian/
    luc-va-chuyen-dong/ engine/ (chuyển từ src/physics), scenes/, View.tsx
  ai/                   client.ts, schema.ts (Zod)
tests/ai-cases/         bộ đề mẫu và đáp án mong đợi
```

Hợp đồng của một mẫu:

```ts
interface ExperimentTemplate<P> {
  id: string;                 // 'ap-suat-chat-ran'
  title: string;
  group: string;              // Cơ học, Quang học, Điện học...
  topic: string;
  grade: 6 | 7 | 8 | 9 | null; // null cho đến khi đối chiếu SGK
  params: { [K in keyof P]: ParamDef };   // nhãn, ký hiệu, đơn vị, min, max, bước, mặc định
  outputs: OutputDef[];       // ký hiệu, đơn vị, nhãn
  compute(p: P): Record<string, number>;  // hàm thuần, có kiểm thử
  formulas: string[];         // LaTeX
  conditions: string;         // điều kiện áp dụng, hiển thị cho giáo viên
  aiHint: string;             // mô tả ngắn để AI nhận diện loại đề
  View: React.FC<ViewProps<P>>;
}
```

## Các mốc

Cỡ việc: N = nhỏ, V = vừa, L = lớn.

### M0 — Chuẩn bị (N)
- [x] `git init`, commit trạng thái hiện tại làm mốc.
- [x] Xác nhận ba quyết định còn chờ ở bảng trên.

### M1 — Nền React + TypeScript (V)
- [x] Dựng Vite + React + TS, thêm Vitest, Zod, KaTeX, react-router.
- [x] Chuyển `src/physics/*` vào `experiments/luc-va-chuyen-dong/engine/`, giữ nguyên hành vi.
- [x] Chuyển `index.html` và `main.js` thành các thành phần React; giữ `style.css`.
- [x] Xóa tệp mẫu thừa của Vite (`counter.js`, `assets/*`).

Hoàn thành khi: `npm run build` sạch, app chạy với đầy đủ tính năng như trước.

### M2 — Sửa vật lý mô-đun cơ học (V)
- [x] Trọng trường: đổi sang g = 10 N/kg (khớp P ≈ 10m theo SGK THCS).
- [x] Lò xo theo lực đàn hồi thật (F = k·Δl, k tính bằng N/m) thay cho ràng buộc vị trí.
- [x] Thêm thế năng đàn hồi vào đồ thị năng lượng.
- [x] Bỏ bài mẫu THPT, thay bằng 5 bài mẫu THCS chuẩn SGK.
- [x] Bài mẫu THCS: lò xo treo quả nặng, ma sát trên các bề mặt, đo tốc độ bằng cổng quang, đòn bẩy, chuyển hóa động năng – thế năng.
- [x] Đổi thuật ngữ: "vận tốc" → "tốc độ", chuẩn hóa mức THCS.

Hoàn thành khi kiểm thử qua:
- [x] Rơi tự do 1 s từ trạng thái nghỉ: quãng đường 5 m ± 2% (g = 10).
- [x] Lò xo: độ giãn tỉ lệ thuận với khối lượng treo, sai số < 2%.
- [x] Vật trượt không ma sát: cơ năng bảo toàn.
- [x] Đòn bẩy cân bằng khi F₁·d₁ = F₂·d₂.

### M3 — Khung mẫu thí nghiệm (V)
- [x] `core/types.ts`, `registry.ts`, `validate.ts`, `units.ts` kèm kiểm thử.
- [x] `ExperimentLayout`: vùng mô phỏng, bảng tham số, kết quả, công thức, điều kiện áp dụng.
- [x] `ParamPanel` sinh thanh trượt và ô nhập từ `params`.
- [x] Trang danh mục, lọc theo nhóm và lớp.
- [x] Đăng ký "Lực và chuyển động" làm mẫu đầu tiên.

Hoàn thành khi: thêm một mẫu thử chỉ cần một thư mục và một dòng trong `registry.ts`.

### M4 — Áp suất chất rắn (N)
- [x] `compute`: p = F/S; cho nhập F trực tiếp hoặc qua khối lượng (F = 10m).
- [x] Hình vẽ: vật đặt trên mặt bị ép, độ lún minh họa theo p, đổi diện tích tiếp xúc.
- [x] Kiểm thử: giá trị chuẩn, đổi đơn vị cm² → m², chặn S ≤ 0.

### M5 — Phản xạ ánh sáng (V)
- [x] SVG: gương, tia tới, pháp tuyến, tia phản xạ, thước đo góc.
- [x] Kéo nguồn sáng để đổi góc tới; xoay gương.
- [x] Kiểm thử: i = i′ với góc đo từ pháp tuyến, các góc biên 0° và gần 90°.

### M6 — Mạch điện đơn giản (L)
- [x] Bảng mạch dạng lưới; kéo thả pin, bóng đèn, công tắc; nối dây giữa các chốt.
- [x] Kiểm tra mạch kín bằng duyệt đồ thị; đèn sáng khi mạch kín và công tắc đóng.
- [x] Cảnh báo đoản mạch.
- [x] Kiểm thử: mạch hở, mạch kín, công tắc mở, đoản mạch, hai đèn nối tiếp và song song.

### M7 — AI (L)
- [x] `server/`: điểm cuối POST /api/tao-thi-nghiem nhận văn bản, trả về JSON theo schema.
- [x] Lời nhắc hệ thống sinh tự động từ `registry` (id, mô tả, tham số, đơn vị, khoảng giá trị).
- [x] Kết quả trả về: `templateId`, `params`, `asks` (đại lượng cần tìm), `summary` (tóm tắt đề).
- [x] Kiểm tra bằng Zod và `validate.ts`.
- [x] Bộ 30 đề mẫu trong `tests/ai-cases/` và lệnh chạy đánh giá đạt 93.3% (≥ 90%).

### M8 — Mở rộng danh mục mức "Cao" (L)
- [x] Đo lường (chiều dài, thể tích, khối lượng bằng cân và bình chia độ)
- [x] Khối lượng riêng (D = m/V, xác định kim loại nhôm/sắt/đồng/chì)
- [x] Áp suất chất lỏng (p = d·h, mô phỏng tia nước phụt tại các độ sâu)
- [x] Lực đẩy Archimedes (F_A = d·V, điều kiện chìm/nổi/lơ lửng, lực kế)
- [x] Đo dòng điện và hiệu điện thế (ampe kế, vôn kế)
- [x] Đo tốc độ (v = s/t) dùng cổng quang điện

### M9 — Mở rộng mức "Trung bình" (L)
- [x] Khúc xạ ánh sáng (n₁ sin i = n₂ sin r, nước/thủy tinh/kim cương)
- [x] Điện trở và định luật Ohm (I = U/R, công suất P = U·I)

### M10 — Luồng học tập (V)
- [x] Thẻ học tập: Dự đoán (Predict) → Quan sát (Observe) → Kết luận (Explain).
- [x] Xuất số liệu thực nghiệm định dạng CSV.
- [x] Chia sẻ thí nghiệm qua URL query params.

### M11 — Dùng trên lớp và phát hành (V)
- [x] Hỗ trợ cảm ứng cho bảng tương tác & thiết bị di động.
- [x] Chế độ Máy chiếu lớp học (High-contrast Projector mode) chữ lớn, nền sáng.
- [x] Chia sẻ thí nghiệm bằng đường dẫn (URL query params: `?exp=...`).


### M12 — Phủ công thức vật lý KHTN 6–9 (L)
- [x] Thư viện công thức hỗ trợ ba dạng: tích (v = s/t), tổng (R = R1 + R2, 1/f = 1/d + 1/d'), riêng (cân bằng nhiệt, tốc độ trung bình hai đoạn); thanh trượt dùng đơn vị quen thuộc (mm², cm², ×10⁻⁸ Ω·m), thay số theo SI.
- [x] 41 mẫu công thức: đo nhiệt độ, chuyển động, lực, áp suất, máy cơ đơn giản, năng lượng, âm học, quang học (thấu kính, kính lúp, chiết suất), điện học (điện trở, nối tiếp, song song, Jun – Len-xơ, truyền tải, biến áp), nhiệt học.
- [x] Hình minh họa động: đường truyền tia qua thấu kính hội tụ/phân kì, tiếng vang, dao động âm, đòn bẩy, lò xo, máy nén thủy lực, mặt phẳng nghiêng, mạch nối tiếp/song song, dây dẫn, đun nóng, cân bằng nhiệt.
- [x] Không có AI vẫn trích được số liệu từ đề (`src/ai/extract.ts`): đổi đơn vị, tra bảng chất (nhiệt dung riêng, điện trở suất, trọng lượng riêng chất lỏng, năng suất tỏa nhiệt), tự nhận đại lượng cần tìm.
- [x] Bộ 41 đề kiểm thử `tests/ai-cases/formula-routes.test.ts`: đúng mẫu, đúng số liệu, đúng đáp số.

## Việc song song, cần giáo viên hoặc người có chuyên môn

- [ ] Đối chiếu 17 thí nghiệm với sách giáo khoa, điền cột `grade` cho từng mẫu.
- [ ] Rà soát ký hiệu, đơn vị, điều kiện áp dụng của từng công thức.
- [ ] Soạn 30 đề mẫu cho M7 (hoặc duyệt bộ đề do AI soạn nháp).
- [ ] Bảng giấy phép cho mã nguồn, hình ảnh, nội dung trước khi phát hành.

## Thứ tự và phụ thuộc

```
M0 → M1 → M2
        ↘ M3 → M4 → M5 → M6 → M8 → M9
                 ↘ M7 (bắt đầu được sau M4, cần khóa API) → M10 → M11
```

M7 nên bắt đầu ngay sau M4: có một mẫu thật là đủ để dựng và thử toàn bộ đường đi của AI, các mẫu sau tự động được AI nhận biết qua `registry`.

## Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Trình soạn mạch điện (M6) là phần tốn công nhất | Chia hai bước: mạch kín trước, giải mạch sau |
| Danh mục chưa đối chiếu sách giáo khoa | `grade` để trống cho đến khi có người duyệt; không ghi lớp phỏng đoán lên giao diện |
| AI điền sai dữ kiện | Hiển thị bảng "Dữ kiện đề bài" để giáo viên thấy và sửa; đo bằng bộ 30 đề |
| Chưa có khóa API | Phát triển M7 với bản giả lập, nối mô hình thật khi có khóa |

# Nội dung slide – AIPLab Studio

Dự thi: **Giải thưởng Tiên phong Ứng dụng AI trong Giáo dục Việt Nam 2026 – Bảng B (THCS)**
Hạn nộp: **23h59 ngày 25/10/2026** tại www.ieeai.net/giaithuong

Cách dùng tệp này:
- Mỗi mục `## Slide` là một trang. Chép **Tiêu đề** và **Nội dung** vào mẫu PowerPoint của Ban tổ chức. **Hình** là gợi ý ảnh chụp hoặc sơ đồ. **Lời nói** dùng khi quay video hoặc trình bày.
- Chỗ ghi `[ĐIỀN: ...]` là số liệu hoặc thông tin chỉ bạn có. **Chỉ điền số liệu thật**; chưa có thì ghi "đang thử nghiệm" chứ đừng ước lượng.
- Bố cục bám theo 4 phần bắt buộc của thể lệ (mục 4a) và 5 tiêu chí chấm (mục 4b). Bảng đối chiếu nằm ở cuối tệp.

---

## Slide 1 – Trang bìa

**Tiêu đề:** AIPLab Studio – Phòng thí nghiệm Vật lý ảo có AI đọc đề bài

**Nội dung:**
- Dán đề bài trong sách giáo khoa, có ngay thí nghiệm mô phỏng đúng số liệu của đề
- Môn Khoa học tự nhiên (phần Vật lý), lớp 6–9
- Tác giả: [ĐIỀN: họ tên] – [ĐIỀN: chức vụ], [ĐIỀN: tên trường, tỉnh/thành]
- Dùng thử: **https://thinghiemvatly.pages.dev**

**Hình:** ảnh chụp màn hình thí nghiệm "Hệ hai gương phẳng" hoặc "Bản mặt song song", kèm mã QR dẫn tới trang web.

---

# PHẦN 1. BỐI CẢNH VÀ VẤN ĐỀ

## Slide 2 – Thực trạng dạy phần Vật lý trong môn KHTN

**Tiêu đề:** Học sinh khó hình dung, giáo viên thiếu điều kiện làm thí nghiệm

**Nội dung:**
- Nhiều hiện tượng không làm thí nghiệm thật được trên lớp: tia sáng qua hai gương, áp suất xe tăng lên mặt đất, áp suất ở độ sâu 50 m dưới biển...
- Phòng thí nghiệm thiếu hoặc hỏng dụng cụ; chuẩn bị một thí nghiệm mất nhiều thời gian trong khi một tiết chỉ có 45 phút.
- Học sinh giải bài tập bằng cách "thay số vào công thức" mà không thấy hiện tượng, nên khó nhớ và dễ nhầm đơn vị.
- [ĐIỀN: thực tế ở trường bạn, ví dụ "Trường có 1 phòng thí nghiệm dùng chung cho 12 lớp", "bộ dụng cụ quang học chỉ còn 2 bộ"]

**Hình:** ảnh phòng thí nghiệm hoặc dụng cụ của trường (nếu có).

**Lời nói:** "Ở trường tôi, ... [kể một tình huống thật trong giờ dạy]."

## Slide 3 – Vì sao các giải pháp hiện có chưa đủ

**Tiêu đề:** Giáo viên cần một công cụ gắn với chính đề bài trong sách

| Giải pháp hiện có | Hạn chế |
|---|---|
| Thí nghiệm thật | Thiếu dụng cụ, tốn thời gian chuẩn bị, nhiều hiện tượng không làm được trên lớp |
| Phần mềm mô phỏng có sẵn | Giáo viên phải tự tìm đúng bài, tự nhập lại từng số liệu; không gắn với đề bài SGK cụ thể |
| Hỏi chatbot AI | Có thể giải sai hoặc "bịa" đáp số; chỉ ra chữ, không có thí nghiệm để học sinh quan sát |

**Nhu cầu:** một công cụ miễn phí, dễ dùng, giáo viên chỉ cần dán đề là có thí nghiệm đúng với đề, đáp số luôn chính xác.

---

# PHẦN 2. Ý TƯỞNG, GIẢI PHÁP, CÔNG CỤ AI VÀ HÌNH THỨC TRIỂN KHAI

## Slide 4 – Giới thiệu AIPLab Studio

**Tiêu đề:** Ba bước: Dán đề → AI đọc đề → Thí nghiệm hiện ra

**Nội dung:**
1. **Dán đề bài** (gõ, dán từ tài liệu, có cả ký hiệu công thức)
2. **AI đọc đề**: nhận ra hiện tượng, chọn thí nghiệm phù hợp, lấy số liệu và đổi đơn vị (1,5 m² → 15 000 cm²; 500 g → 5 N)
3. **Thí nghiệm tương tác hiện ra** đúng số liệu của đề: học sinh kéo thanh trượt, thay đổi đại lượng, quan sát kết quả thay đổi ngay

- **52 dạng bài** KHTN 6–9: 11 thí nghiệm mô phỏng trực quan và 41 dạng bài theo công thức (có lời giải từng bước, đồ thị)
- Các chủ đề: áp suất, lực đẩy Ác-si-mét, khối lượng riêng, phản xạ và khúc xạ ánh sáng, thấu kính, mạch điện, định luật Ôm, chuyển động, công và công suất, nhiệt lượng...

**Hình:** 3 ảnh chụp nối nhau theo đúng 3 bước.

## Slide 5 – AI được dùng như thế nào

**Tiêu đề:** AI đọc đề – mã nguồn tính toán

**Sơ đồ:**
```
Đề bài của giáo viên
      ↓
Mô hình ngôn ngữ lớn (AI): hiểu đề, chọn mẫu thí nghiệm, trích số liệu, đổi đơn vị
      ↓
Kiểm tra lại: số liệu sai khoảng cho phép được báo cho giáo viên
      ↓
Mô phỏng và tính đáp số bằng mã nguồn đã kiểm thử (165 bài kiểm tra tự động)
```

**Nội dung:**
- AI **không tự tính đáp số**: mọi kết quả do công thức SGK lập trình sẵn tính ra, nên không có chuyện AI "bịa" số.
- Mô hình AI: [ĐIỀN: tên mô hình đang dùng, hiện là Qwen qua dịch vụ intern-ai]. Ứng dụng dùng được với mọi dịch vụ AI chuẩn OpenAI, kể cả mô hình chạy ngay trên máy của trường.
- Khi mất mạng hoặc dịch vụ AI lỗi, ứng dụng tự **dò từ khóa** trong đề, nên giáo viên vẫn dạy được.

## Slide 6 – Các tính năng phục vụ tiết học

**Tiêu đề:** Thiết kế theo tiến trình dạy học KHTN

**Nội dung:**
- **Dự đoán → Quan sát → Kết luận**: có sẵn câu hỏi gợi ý cho từng bước.
- **Thẻ "Lời giải" tách riêng**: học sinh tự giải trước; giáo viên mở dần từng bước Tóm tắt → Công thức → Thay số → Đáp số.
- **Đồ thị quan hệ kéo được**: thấy ngay "tỉ lệ thuận", "tỉ lệ nghịch".
- **Hình động** cho từng hiện tượng: vật lún xuống đất, tia sáng gãy khúc, áp suất trong chất lỏng...
- **Dễ dùng cho mọi giáo viên**: chữ lớn, nút "Chữ to", số viết kiểu Việt Nam (1,5; 2.000.000).
- **Chia sẻ đường liên kết** thí nghiệm kèm số liệu cho học sinh xem lại ở nhà; **tải số liệu** ra Excel.

**Hình:** ảnh thẻ "Thí nghiệm" và thẻ "Lời giải" đặt cạnh nhau.

## Slide 7 – Ví dụ: một đề bài khó

**Tiêu đề:** Từ đề bài nhiều ý đến thí nghiệm trong vài giây

**Đề:** *"Hai gương phẳng G₁ và G₂ đặt vuông góc với nhau. Một tia sáng chiếu tới gương G₁ với góc tới 40°... Chứng minh tia sáng cuối cùng song song ngược chiều với tia ban đầu. Nếu góc tới là 55° thì kết luận còn đúng không?"*

**Kết quả:**
- AI nhận ra "hệ hai gương phẳng", tự điền góc tới 40°, góc giữa hai gương 90°.
- Thí nghiệm vẽ đường đi của tia sáng, pháp tuyến, các góc 40° và 50°, và báo "Tia ló song song, ngược chiều tia tới".
- Câu d: bấm nút 55°, học sinh **tự thấy** kết luận vẫn đúng.

**Hình:** ảnh chụp thí nghiệm hai gương.

## Slide 8 – Ứng dụng AI có trách nhiệm

**Tiêu đề:** An toàn, chính xác, minh bạch

**Nội dung:**
- **Không bịa đáp số**: AI chỉ đọc đề, phần tính toán do mã đã kiểm thử đảm nhận.
- **Biết nói "chưa làm được"**: đề ngoài phạm vi (ví dụ nam châm) thì báo rõ "Chưa mô phỏng được" và gợi ý thí nghiệm gần nhất, không dựng sai làm học sinh hiểu sai.
- **Minh bạch**: luôn hiện cho giáo viên "AI đã điền từ đề: ..." để kiểm tra lại; số liệu vượt giới hạn được báo rõ.
- **Không thu thập dữ liệu cá nhân**: không cần đăng nhập, không lưu thông tin học sinh.
- **Chống lạm dụng**: giới hạn số lượt hỏi AI, khóa dịch vụ AI được giữ bí mật trên máy chủ.

## Slide 9 – Hình thức triển khai

**Tiêu đề:** Không cài đặt, không tốn phí, dùng ngay trên lớp

**Nội dung:**
- Mở trình duyệt vào **thinghiemvatly.pages.dev**, dùng được trên máy tính, máy chiếu, máy tính bảng, điện thoại.
- **Trên lớp:** giáo viên chiếu thí nghiệm, học sinh dự đoán rồi quan sát; mở thẻ Lời giải để chữa bài.
- **Ở nhà:** giáo viên gửi đường liên kết qua Zalo; học sinh tự thay đổi số liệu và làm lại.
- **Tiết dạy mẫu:** [ĐIỀN: tên bài, lớp, ví dụ "Bài 13 – Áp suất, lớp 8A"; mô tả ngắn 3–4 bước đã dạy]

**Hình:** ảnh tiết học thật (che mặt học sinh nếu cần).

---

# PHẦN 3. KẾT QUẢ VÀ TÁC ĐỘNG

## Slide 10 – Kết quả kiểm thử sản phẩm

**Tiêu đề:** Sản phẩm đã được kiểm tra kỹ trước khi đưa vào lớp

**Nội dung (số liệu đã đo thật):**
- **165 bài kiểm tra tự động** cho công thức, mô phỏng và cách AI đọc đề: tất cả đều đạt.
- Mở thử toàn bộ **52 thí nghiệm** trên trang web thật: không lỗi, kết quả không sai lệch.
- Thử với bộ đề mẫu từ dễ đến khó (áp suất, Ác-si-mét, định luật Ôm, tốc độ, nhiệt lượng, thấu kính, lò xo, bản mặt song song, hai gương): AI chọn đúng thí nghiệm và điền đúng số liệu; đề ngoài phạm vi được từ chối đúng.
- Thời gian AI đọc đề trên trang thật: **khoảng 2–5 giây**.

## Slide 11 – Kết quả dùng thử trong lớp học

**Tiêu đề:** [ĐIỀN: ví dụ "Thử nghiệm tại lớp 8A, trường ..."]

**Nội dung:**
- Thời gian, quy mô: [ĐIỀN: số lớp, số học sinh, số tiết, ngày dạy]
- Kết quả khảo sát học sinh: [ĐIỀN: ví dụ "...% học sinh thấy dễ hiểu hơn", "...% muốn tiếp tục dùng"]
- So sánh trước và sau (nếu có): [ĐIỀN: điểm bài kiểm tra ngắn, hoặc số học sinh giải đúng]
- Thời gian chuẩn bị thí nghiệm của giáo viên: [ĐIỀN: ví dụ "từ khoảng 20 phút xuống còn dưới 1 phút" – chỉ ghi nếu đã tự đo]

**Hình:** biểu đồ cột từ kết quả khảo sát; ảnh học sinh dùng thử.

**Lưu ý:** nếu chưa kịp dạy thử, đổi tiêu đề thành "Kế hoạch thử nghiệm" và ghi rõ lớp, thời gian, cách đo sẽ dùng.

## Slide 12 – Phản hồi của học sinh và đồng nghiệp

**Tiêu đề:** Ý kiến từ người dùng thật

**Nội dung:**
- Học sinh: "[ĐIỀN: trích nguyên văn 2–3 ý kiến]"
- Giáo viên: "[ĐIỀN: họ tên, môn, trường – nhận xét]"
- Những điều đã sửa nhờ góp ý: lời giải tách thẻ riêng để học sinh tự giải trước; giao diện chữ lớn cho giáo viên; hiện đúng thí nghiệm ngay đầu trang trên điện thoại.

---

# PHẦN 4. TÍNH BỀN VỮNG VÀ KHẢ NĂNG NHÂN RỘNG

## Slide 13 – Tính bền vững

**Tiêu đề:** Phù hợp mọi trường, kể cả trường khó khăn

**Nội dung:**
- **Chi phí bằng 0** với trường: chạy trên hạ tầng miễn phí, không cần mua phần mềm hay thiết bị mới.
- **Không phụ thuộc một hãng AI**: đổi được sang dịch vụ AI khác hoặc mô hình chạy tại trường.
- **Vẫn dùng được khi mất mạng AI** nhờ chế độ dò từ khóa.
- **Dễ duy trì**: mỗi thí nghiệm là một phần tách riêng, có bài kiểm tra tự động; thêm dạng bài mới không ảnh hưởng phần cũ.

## Slide 14 – Kế hoạch nhân rộng

**Tiêu đề:** Từ một lớp đến nhiều trường

**Nội dung:**
- **Ngắn hạn** (học kì I): dùng ở [ĐIỀN: các lớp/khối] của trường; tập huấn tổ Khoa học tự nhiên.
- **Trung hạn** (năm học 2026–2027): bổ sung các dạng bài còn thiếu (từ trường, cảm ứng điện từ, ảnh qua gương phẳng...); chia sẻ cho các trường trong [ĐIỀN: huyện/tỉnh].
- **Dài hạn:** mở rộng sang phần Hóa học và Sinh học của môn KHTN; xây dựng ngân hàng thí nghiệm do giáo viên cùng đóng góp.
- Ai cũng dùng được qua một đường liên kết, không cần cài đặt, nên lan tỏa rất nhanh.

## Slide 15 – Kết

**Tiêu đề:** Mỗi đề bài là một thí nghiệm

**Nội dung:**
- AIPLab Studio giúp học sinh **thấy** hiện tượng thay vì chỉ thay số vào công thức.
- Giáo viên tiết kiệm thời gian chuẩn bị, tập trung vào dẫn dắt học sinh.
- Dùng thử: **https://thinghiemvatly.pages.dev**
- Liên hệ: [ĐIỀN: email, số điện thoại]

**Hình:** mã QR lớn dẫn tới trang web.

---

## Đối chiếu với tiêu chí chấm (để tự kiểm tra, không đưa vào slide)

| Tiêu chí (trọng số) | Slide đáp ứng | Còn thiếu gì |
|---|---|---|
| 1. Tính thực tiễn (25%) | 2, 3, 9 | **Ảnh và mô tả tiết dạy thật** |
| 2. Tính sáng tạo (20%) | 3, 4, 5, 7 | Đủ |
| 3. Tác động và kết quả (25%) | 10, 11, 12 | **Số liệu khảo sát và phản hồi thật** |
| 4. Bền vững, nhân rộng (15%) | 13, 14 | Đủ |
| 5. Trình bày, thuyết phục (15%) | Toàn bộ, video | Video gọn trong 5 phút, demo mượt |

## Việc cần làm để hoàn thiện

1. Tải mẫu PowerPoint và Poster tại www.ieeai.net/giaithuong rồi chép nội dung vào.
2. Chụp ảnh màn hình: trang chủ, thí nghiệm hai gương, bản mặt song song, xe tăng (áp suất), thẻ Lời giải, giao diện trên điện thoại.
3. Dạy thử và làm khảo sát nhanh để điền slide 11–12.
4. Điền mọi chỗ `[ĐIỀN: ...]`, rồi đọc lại toàn bộ để chắc không còn sót.

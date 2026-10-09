# Kemkem — Project brief

> Trạng thái: **bản nháp v0.1** (2026-10-09). Các mục ghi _(giả định)_ là đề xuất
> mặc định, chờ xác nhận ở phần [Câu hỏi mở](#8-câu-hỏi-mở).

## 1. Tổng quan

Kemkem là bộ trò chơi học tập dạng gamify cho **trẻ 2–5 tuổi**, chạy trên
trình duyệt web, thiết bị mục tiêu là **máy đọc sách (e-ink)** — cả loại màu
(Kaleido) và loại đen trắng.

Mục tiêu:

- Trẻ tự chơi được, không cần biết đọc: mọi hướng dẫn bằng **giọng nói** và
  **biểu tượng**, không bằng chữ.
- Trải nghiệm mượt trên màn hình e-ink: ít lần vẽ lại, không cuộn, không hiệu
  ứng chuyển động.
- Khen ngợi, động viên liên tục; không có hình phạt, không có thua.

Ngôn ngữ giao diện và giọng nói: **tiếng Việt**. Nội dung học (v1): bảng chữ
cái tiếng Anh.

## 2. Người dùng

| Vai trò      | Nhu cầu                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| Trẻ 2–5 tuổi | Chạm là có phản hồi ngay, mục tiêu chạm to, nghe hướng dẫn, được khen.           |
| Phụ huynh    | Mở app, chọn theme màu/đen trắng một lần, giao máy cho con; không cần tài khoản. |

## 3. Ràng buộc nền tảng (bắt buộc cho mọi màn hình)

### 3.1 Hai theme: `color` và `bw`

- Chỉ có 2 theme: **Color** (máy e-ink màu) và **Black & White** (máy e-ink
  đen trắng). **Không có dark mode** — bỏ theme sáng/tối của template.
- Theme áp dụng cho **toàn bộ** nội dung: nền, chữ, nút, icon, hình minh hoạ,
  hình chúc mừng.
- **Color**: bảng màu ít màu, bão hoà cao, tương phản mạnh (màn Kaleido làm
  nhạt màu) — không dùng gradient, không dùng màu pastel nhạt.
- **B&W**: chỉ đen, trắng và tối đa 1–2 mức xám đặc; phân biệt bằng **nét
  viền, độ dày nét, hoạ tiết (sọc/chấm)** thay vì màu. Không thông tin nào chỉ
  truyền đạt bằng màu.
- Cài đặt bằng CSS variables theo `data-theme` trên `<html>`; mọi SVG dùng
  `currentColor`/biến CSS để tự đổi theo theme.
- Lựa chọn theme lưu trên máy (localStorage) _(giả định)_.

### 3.2 Không scroll, không zoom

- Mỗi màn hình vừa khít **100% viewport** (`100dvh`/`100dvw`), không thanh
  cuộn ở bất kỳ kích thước nào; bố cục co giãn theo kích thước màn hình thay
  vì tràn.
- Chặn zoom: `user-scalable=no, maximum-scale=1`, `touch-action: manipulation`,
  chặn pinch / double-tap zoom, `overscroll-behavior: none`.
- Hỗ trợ cả dọc và ngang; ưu tiên **dọc** _(giả định)_.
- Có nút vào **chế độ toàn màn hình** (Fullscreen API) nếu trình duyệt hỗ trợ.

### 3.3 Tối ưu cho e-ink (tần số làm tươi thấp)

- **Không animation, không transition, không hover effect**; thay đổi trạng
  thái là thay đổi tức thì (ví dụ chữ biến mất ngay khi chạm đúng).
- Hạn chế số lần vẽ lại: gom thay đổi giao diện vào một lần render.
- Mục tiêu chạm tối thiểu ~**15 mm** (≈ 64 px trở lên), khoảng cách giữa các
  mục đủ rộng cho ngón tay trẻ.
- Chữ to, đậm, font không chân, dễ nhận dạng cho trẻ (chữ `a`, `g` dạng một
  tầng như chữ viết tay) _(giả định)_.
- Nhẹ: tải nhanh trên chip yếu, không thư viện animation.

### 3.4 Hình ảnh

- Chỉ dùng **vector (SVG nội tuyến)** và **icon** (`lucide-react`); không
  dùng ảnh bitmap trừ khi thật sự cần.
- Hình minh hoạ (hình chúc mừng, linh vật…) vẽ bằng SVG nét đơn giản, nét
  dày, mảng đặc — hiển thị tốt cả 2 theme.

### 3.5 Âm thanh

- Mọi lời nhắc/khen/động viên đều có giọng nói tiếng Việt.
- Lần chạm đầu tiên mở khoá âm thanh (chính sách autoplay của trình duyệt):
  màn hình bắt đầu có một nút "Chơi" lớn.
- Nguồn giọng nói: xem câu hỏi Q1.

## 4. Kiến trúc tổng thể

- App là một **"game hub"**: màn hình chính là lưới các trò chơi (v1 chỉ có 1),
  chạm vào để vào trò chơi. Thay layout dạng trang danh sách hiện tại của
  template.
- Mỗi trò chơi là một thư mục `src/features/<game>/` theo quy ước của repo.
- v1 chạy **hoàn toàn phía client**, không cần tài khoản, không cần backend
  (D1/KV chưa dùng) _(giả định)_.
- Gỡ các feature mẫu `notes`, `visits` của template.

## 5. Game 1 — Tìm chữ cái (Alphabet hunt)

### 5.1 Luồng chơi

1. **Bắt đầu màn**: chọn ngẫu nhiên một **chữ mục tiêu** (ví dụ `A`). Màn
   hình hiện một lưới các chữ cái tiếng Anh, lẫn **viết hoa và viết thường**,
   trong đó có nhiều bản của chữ mục tiêu (cả `A` và `a`) xen với các chữ khác.
2. Giọng đọc: **"Bạn hãy tìm chữ A"**. Một **nút loa** cố định trên màn hình
   để nghe lại câu nhắc bất kỳ lúc nào.
3. **Chạm đúng** (chữ `A` hoặc `a`): chữ đó **biến mất** (để lại ô trống, lưới
   không dịch chuyển) và phát ngẫu nhiên một câu khen.
4. **Chạm sai**: chữ không biến mất; phát ngẫu nhiên một câu an ủi, động viên
   (có thể kèm nhắc lại chữ cần tìm). Không trừ điểm.
5. **Hết màn** (đã tìm hết các chữ mục tiêu): hiện **màn chúc mừng** — một
   hình SVG chúc mừng (chọn ngẫu nhiên trong vài mẫu) + một câu khen ngợi
   (chọn ngẫu nhiên) + nút **"Chơi tiếp"** lớn.
6. **Chơi tiếp**: sang màn mới với một chữ mục tiêu **khác** chữ vừa chơi.

### 5.2 Quy tắc nội dung _(giả định, chờ xác nhận)_

| Thông số                    | Đề xuất mặc định                                                   |
| --------------------------- | ------------------------------------------------------------------ |
| Số ô chữ trên màn           | 9–12 (lưới 3×3 / 3×4), tự co theo kích thước màn hình              |
| Số chữ mục tiêu mỗi màn     | 3–4 (gồm ít nhất 1 hoa, 1 thường)                                  |
| Chữ nhiễu                   | Chọn ngẫu nhiên, tránh chữ dễ nhầm khi mới chơi (b/d, p/q, m/w…)   |
| Chọn chữ mục tiêu tiếp theo | Ngẫu nhiên, không lặp lại cho đến khi đã chơi đủ 26 chữ            |
| Hiển thị chữ                | Mỗi chữ trong một ô thẻ to, viền rõ; theme Color có màu nền theo ô |

### 5.3 Câu thoại (bản nháp — sẽ mở rộng)

**Nhắc tìm**: "Bạn hãy tìm chữ A", "Chữ A đâu rồi nhỉ?", "Tìm giúp mình chữ A
nhé!"

**Chạm đúng**: "Đúng rồi!", "Chính xác!", "Giỏi quá!", "Tuyệt vời!", "Bé
giỏi lắm!", "Hay quá!", "Đúng rồi, đó là chữ A!", "Siêu quá!", "Làm tốt lắm!",
"Chuẩn luôn!"

**Chạm sai**: "Chưa đúng rồi, thử lại nhé!", "Gần đúng rồi, cố lên nào!",
"Không sao đâu, mình tìm tiếp nhé!", "Ồ, đó là chữ khác. Bé thử lại nha!",
"Cố lên, bé làm được mà!", "Nhìn kỹ lại nào, chữ A ở đâu nhỉ?"

**Hoàn thành màn**: "Hoan hô! Bé đã tìm được hết chữ A rồi!", "Tuyệt vời! Bé
thật là giỏi!", "Xuất sắc quá! Mình chơi tiếp nhé!", "Bé là nhà thám hiểm chữ
cái tài ba!", "Giỏi quá đi! Thưởng cho bé một tràng pháo tay!", "Hoàn hảo! Bé
đã tìm thấy tất cả rồi!"

## 6. Ngoài phạm vi v1

- Tài khoản, đồng bộ tiến độ, bảng điểm.
- Trò chơi khác (số đếm, màu sắc, hình khối…) — kiến trúc hub đã sẵn để thêm.
- Chế độ offline/PWA _(có thể đưa vào v1 nếu cần, xem Q7)_.
- Dark mode.

## 7. Tiêu chí hoàn thành v1

- Không xuất hiện thanh cuộn và không zoom được trên: màn 6", 7", 10" cả dọc
  và ngang.
- Chuyển theme Color ↔ B&W đổi toàn bộ giao diện, kể cả hình SVG.
- Chơi trọn một màn chỉ bằng chạm + giọng nói, không cần đọc chữ hướng dẫn.
- Không có animation/transition nào trong CSS.
- `npm run check` và build xanh.

## 8. Câu hỏi mở

- **Q1. Nguồn giọng nói.** (a) Thu âm sẵn file audio (tạo một lần bằng TTS
  chất lượng cao hoặc giọng người thật) — giọng ổn định, chạy được trên mọi
  máy; hay (b) dùng TTS có sẵn của trình duyệt (Web Speech API) — không cần
  file nhưng nhiều máy đọc sách không có giọng tiếng Việt hoặc không có TTS.
  _Đề xuất: (a)._
- **Q2. Cách đọc tên chữ cái.** Trong câu "Bạn hãy tìm chữ A", chữ A đọc theo
  tiếng Anh ("ây") hay tiếng Việt ("a")?
- **Q3. Hoa/thường.** Chạm vào cả `A` và `a` đều tính đúng, hay mỗi màn chỉ
  tìm một dạng?
- **Q4. Số lượng chữ & độ khó.** Có cần chia độ khó theo tuổi (2–3 tuổi: ít
  ô, 4–5 tuổi: nhiều ô) không, hay dùng một mức mặc định ở bảng 5.2?
- **Q5. Thiết bị cụ thể.** Đang nhắm tới máy nào (Boox, Kindle, Kobo,
  PocketBook…)? Lưu ý trình duyệt của Kindle/Kobo thường **không phát được âm
  thanh**; máy chạy Android (Boox, Bigme…) thì được.
- **Q6. Chọn theme.** Phụ huynh tự chọn trong cài đặt (lưu trên máy), hay
  hỏi chọn ngay lần mở đầu tiên? Có cần "khoá phụ huynh" để trẻ không bấm
  nhầm vào cài đặt không?
- **Q7. Offline.** Có cần chơi được khi không có mạng (PWA, cache audio)
  không?
- **Q8. Phản hồi khi chạm sai.** Ngoài giọng nói, có cần dấu hiệu hình ảnh
  (ví dụ viền đậm/hoạ tiết trên ô sai trong ~1 giây) không?

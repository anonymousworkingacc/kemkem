# Kemkem — Project brief

> Trạng thái: **v1.0** (2026-10-09) — đã chốt với chủ dự án, bản đầu tiên đã
> triển khai theo brief này.

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
- **Mặc định: Black & White.** Phụ huynh đổi sang Color trong màn Cài đặt;
  lựa chọn lưu trên máy (localStorage) và được áp dụng trước lần vẽ đầu tiên.

### 3.2 Không scroll, không zoom

- Mỗi màn hình vừa khít **100% viewport** (`100dvh`/`100dvw`), không thanh
  cuộn ở bất kỳ kích thước nào; bố cục co giãn theo kích thước màn hình thay
  vì tràn.
- Chặn zoom: `user-scalable=no, maximum-scale=1`, `touch-action: manipulation`,
  chặn pinch / double-tap zoom, `overscroll-behavior: none`.
- Hỗ trợ cả dọc và ngang; lưới tự đổi 3×4 (dọc) ↔ 4×3 (ngang).
- Có nút vào **chế độ toàn màn hình** (Fullscreen API) nếu trình duyệt hỗ trợ.

### 3.3 Tối ưu cho e-ink (tần số làm tươi thấp)

- **Không animation, không transition, không hover effect**; thay đổi trạng
  thái là thay đổi tức thì (ví dụ chữ biến mất ngay khi chạm đúng).
- Hạn chế số lần vẽ lại: gom thay đổi giao diện vào một lần render.
- Mục tiêu chạm tối thiểu ~**15 mm** (≈ 64 px trở lên), khoảng cách giữa các
  mục đủ rộng cho ngón tay trẻ.
- Chữ to, đậm, font không chân, dễ nhận dạng cho trẻ (chữ `a`, `g` dạng một
  tầng như chữ viết tay) — dùng font **Andika** (thiết kế cho trẻ học đọc, có
  dấu tiếng Việt), đóng gói cùng app.
- Nhẹ: tải nhanh trên chip yếu, không thư viện animation.

### 3.4 Hình ảnh

- Chỉ dùng **vector (SVG nội tuyến)** và **icon** (`lucide-react`); không
  dùng ảnh bitmap trừ khi thật sự cần.
- Hình minh hoạ (hình chúc mừng, linh vật…) vẽ bằng SVG nét đơn giản, nét
  dày, mảng đặc — hiển thị tốt cả 2 theme.

### 3.5 Âm thanh

- **Một giọng duy nhất cho mọi game**: giọng nữ tiếng Việt
  (`vi-VN-HoaiMyNeural`) đọc cả câu, kể cả tên chữ. Tên chữ đọc theo game:
  - Game tiếng Anh: tên chữ tiếng Anh phiên âm kiểu Việt — ây, bi, xi, đi, i,
    ép, gi, ếch, ai, giây, cây, eo, em, en, âu, pi, kiu, a, ét, ti, diu, vi,
    đắp bờ liu, ích, oai, dét.
  - Game tiếng Việt: cách đọc ở mầm non — a, á, ớ, bờ, cờ…
- **Giọng nói được tạo sẵn thành file mp3** (TTS neural) bằng
  `scripts/gen-voice.py`. Câu dùng chung (khen, động viên, chúc mừng) nằm ở
  `src/components/kid/letter-hunt/phrases.json`; bộ chữ và cách đọc của từng
  game ở `src/features/<game>/voice.json`. Với mỗi chữ, script tạo nguyên câu
  (không ghép âm tiết rời, nghe tự nhiên hơn):
  - `prompt-<n>-<chữ>.mp3`: "Bạn hãy tìm chữ bờ."
  - `letter-<chữ>.mp3`: "Chữ bờ." — đọc khi trẻ chạm vào ô chữ đó.
- Thêm/sửa câu thoại: sửa file json, chạy lại script (chỉ tạo file còn
  thiếu; `--force` để tạo lại tất cả), commit cả file mp3.
- Để chạy được trên nhiều loại máy, có 3 tầng dự phòng:
  1. Phát file mp3 (Boox và các máy Android: chạy tốt).
  2. Không phát được file → đọc bằng TTS có sẵn của trình duyệt nếu có.
  3. Máy không có âm thanh (trình duyệt Kindle/Kobo) → **câu nói luôn hiện
     thành chữ** trên thanh thông báo (mục 5.1), trò chơi vẫn chơi được.
- Lần chạm vào trò chơi ở màn chính mở khoá âm thanh (chính sách autoplay).

## 4. Kiến trúc tổng thể

- App là một **"game hub"**: màn hình chính là lưới các trò chơi (v1 chỉ có 1),
  chạm vào để vào trò chơi. Thay layout dạng trang danh sách hiện tại của
  template.
- Mỗi trò chơi là một thư mục `src/features/<game>/` theo quy ước của repo.
- Hợp đồng của một game: `src/features/<game>/index.tsx` export
  `meta: GameMeta` (tên, icon, thứ tự) và `default` là component nhận
  `{ onExit }` (xem `src/lib/game.ts`). Màn chính tự phát hiện game mới.
- Thành phần dùng chung cho trẻ: `src/components/kid/` (nút icon lớn, thanh
  thông báo ✓/✗, hình chúc mừng SVG); phát âm thanh: `src/lib/sound.ts`.
- v1 chạy **hoàn toàn phía client**, không cần tài khoản, không cần backend
  (D1/KV chưa dùng).
- Đã gỡ giao diện mẫu `notes`, `visits` của template (API mẫu phía Worker giữ
  nguyên, không ảnh hưởng app).

## 5. Game 1 — Chữ cái tiếng Anh (Alphabet hunt)

Cả hai game tìm chữ dùng chung một component
(`src/components/kid/letter-hunt/`); mỗi game chỉ khai báo bộ chữ, cách đọc
và các cặp chữ dễ nhầm.

### 5.1 Luồng chơi

1. **Bắt đầu màn**: chọn ngẫu nhiên một **chữ mục tiêu** (ví dụ `A`). Màn
   hình hiện một lưới các chữ cái tiếng Anh, lẫn **viết hoa và viết thường**,
   trong đó có nhiều bản của chữ mục tiêu (cả `A` và `a`) xen với các chữ khác.
2. Giọng đọc: **"Bạn hãy tìm chữ A"** (chữ A đọc tiếng Anh). Một **nút loa**
   cố định trên màn hình để nghe lại câu nhắc bất kỳ lúc nào.
   Dưới thanh trên cùng là hàng ô nhỏ hiện các chữ cần tìm (nét đứt), ô được
   tô đen khi đã tìm thấy — trẻ thấy còn bao nhiêu chữ.
3. **Chạm đúng** (chữ `A` hoặc `a`): chữ đó **biến mất** (để lại ô trống, lưới
   không dịch chuyển) và phát ngẫu nhiên một câu khen.
4. **Chạm sai**: chữ không biến mất, không có hiệu ứng trên chữ; phát ngẫu
   nhiên một câu an ủi, động viên. Không trừ điểm.
   **Mỗi lần chạm (đúng hay sai) đều đọc tên chữ vừa chạm trước** ("Chữ bờ."),
   rồi mới đến câu khen / động viên / chúc mừng.
   **Thanh thông báo** (trên cùng, cố định chiều cao): mỗi lần chạm hiện biểu
   tượng **✓** (đúng) hoặc **✗** (sai) kèm **đúng câu vừa nói** dưới dạng chữ.
   Ví dụ: "✓ Chữ a. Đúng rồi!". Lúc bắt đầu màn / bấm loa, thanh hiện câu
   nhắc "Bạn hãy tìm chữ A".
5. **Hết màn** (đã tìm hết các chữ mục tiêu): hiện **màn chúc mừng** — một
   hình SVG chúc mừng (chọn ngẫu nhiên trong vài mẫu) + một câu khen ngợi
   (chọn ngẫu nhiên) + nút **"Chơi tiếp"** lớn.
6. **Chơi tiếp**: sang màn mới với một chữ mục tiêu **khác** chữ vừa chơi.

### 5.2 Quy tắc nội dung

| Thông số                    | Quy tắc                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Số ô chữ trên màn           | 12 (lưới 3×4 dọc / 4×3 ngang), co theo kích thước màn hình                                     |
| Số chữ mục tiêu mỗi màn     | 3–4, gồm ít nhất 1 hoa và 1 thường; **chạm `A` hay `a` đều đúng**                              |
| Chữ nhiễu                   | Ngẫu nhiên, không trùng; loại chữ dễ nhầm với mục tiêu (b/d/p/q, m/w, n/u, I/l…)               |
| Chọn chữ mục tiêu tiếp theo | Ngẫu nhiên, không lặp lại cho đến khi đã chơi đủ 26 chữ                                        |
| Hiển thị chữ                | Ô thẻ to, viền đậm; **mỗi chữ nghiêng một góc khác nhau** (±3°…±14°); theme Color tô màu nền ô |

### 5.3 Câu thoại

Danh sách đầy đủ nằm trong `src/components/kid/letter-hunt/phrases.json` (3 câu nhắc, 12
câu khen, 8 câu động viên khi sai, 8 câu chúc mừng hết màn). Câu thoại dùng chung không được nhắc tới "chữ" hay
"số" để hợp với mọi game. Câu nhắc được
ghép sẵn với từng chữ của từng game (mục 3.5); các câu còn lại không phụ thuộc
chữ cái nên dùng chung cho mọi game.

## 5b. Game 2 — Chữ cái tiếng Việt

Luật chơi, giao diện và câu thoại giống hệt game 1, khác ở:

- **Bộ chữ**: 29 chữ cái tiếng Việt — a ă â b c d đ e ê g h i k l m n o ô ơ p
  q r s t u ư v x y — cả hoa và thường (`Ă`/`ă` đều đúng).
- **Cách đọc** (theo mầm non, xem mục 3.5): a, á (ă), ớ (â), bờ, cờ, dờ, đờ, e, ê, gờ, hờ,
  i, ca (k), lờ, mờ, nờ, o, ô, ơ, pờ, cu (q), rờ, sờ, tờ, u, ư, vờ, xờ,
  i dài (y).
- **Chữ dễ nhầm không xuất hiện cùng nhau**: các chữ chỉ khác dấu (a/ă/â,
  e/ê, o/ô/ơ, u/ư, d/đ) và b/d/đ/p/q, n/u/ư, i/l. Khi trẻ lớn hơn có thể bỏ
  bớt quy tắc này để luyện phân biệt dấu.

## 5c. Game 3 — Tìm số

Luật chơi, giao diện và câu thoại giống game tìm chữ (cùng engine), khác ở:

- **Nội dung**: các số từ 1 – 10 hoặc 1 – 20. Mỗi bàn vẫn 12 ô; với 1 – 10 các
  số nhiễu có thể lặp lại. 6/9 và 16/19 không xuất hiện cùng nhau (dễ nhầm khi
  ô bị nghiêng).
- **Giọng**: vẫn giọng HoaiMy đọc cả câu — "Bạn hãy tìm số bảy." / "Số bảy." —
  tên số đọc bằng **tiếng Việt** (một, hai… hai mươi) hoặc **tiếng Anh** phiên
  âm kiểu Việt (oan, tu, thờ ri… tuên ti).
- **Cài đặt trong game** (nút bánh răng trên thanh trên cùng, dành cho phụ
  huynh): chọn "Các số" 1 – 10 / 1 – 20 và "Đọc số bằng" Tiếng Việt / Tiếng
  Anh. Mặc định 1 – 10, tiếng Việt; lựa chọn lưu trên máy. Bấm "Chơi" để bắt
  đầu màn mới với cài đặt đó.
- Audio: `public/audio/numbers-vi/`, `public/audio/numbers-en/`; cấu hình ở
  `src/features/numbers/voice.json` (danh sách 2 bộ giọng).

## 6. Ngoài phạm vi v1

- Tài khoản, đồng bộ tiến độ, bảng điểm.
- Trò chơi khác (số đếm, màu sắc, hình khối…) — kiến trúc hub đã sẵn để thêm.
- Chế độ offline/PWA (chưa cần).
- Chia độ khó theo tuổi.
- Dark mode.

## 7. Tiêu chí hoàn thành v1

- Không xuất hiện thanh cuộn và không zoom được trên: màn 6", 7", 10" cả dọc
  và ngang.
- Chuyển theme Color ↔ B&W đổi toàn bộ giao diện, kể cả hình SVG.
- Chơi trọn một màn chỉ bằng chạm + giọng nói, không cần đọc chữ hướng dẫn.
- Không có animation/transition nào trong CSS.
- `npm run check` và build xanh.

## 8. Quyết định đã chốt (2026-10-09)

| #   | Câu hỏi           | Quyết định                                                       |
| --- | ----------------- | ---------------------------------------------------------------- |
| Q1  | Nguồn giọng nói   | Tạo sẵn file audio bằng TTS neural (mục 3.5)                     |
| Q2  | Đọc tên chữ cái   | Tiếng Anh, do giọng tiếng Việt đọc (phiên âm "ây, bi, xi…")      |
| Q3  | Hoa / thường      | Cả `A` và `a` đều tính đúng                                      |
| Q4  | Số ô, độ khó      | 12 ô, 3–4 mục tiêu, một mức độ khó; chữ nghiêng mỗi chữ một kiểu |
| Q5  | Thiết bị          | Boox là chính; máy khác chơi được nhờ dự phòng âm thanh + chữ    |
| Q6  | Chọn theme        | Mặc định đen trắng, đổi trong Cài đặt; chưa cần khoá phụ huynh   |
| Q7  | Offline           | Chưa cần                                                         |
| Q8  | Phản hồi khi chạm | Không hiệu ứng trên chữ; thanh thông báo ✓/✗ kèm câu vừa nói     |

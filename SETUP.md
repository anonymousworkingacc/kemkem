# Thiết lập (làm một lần cho mỗi dự án)

Có 2 branch lâu dài, mỗi branch là một môi trường trên Cloudflare:

| Branch | Môi trường | Worker / URL                        | Dữ liệu                   |
| ------ | ---------- | ----------------------------------- | ------------------------- |
| `dev`  | dev        | `<app>-dev.<subdomain>.workers.dev` | `<app>-db-dev`, KV dev    |
| `main` | production | `<app>.<subdomain>.workers.dev`     | `<app>-db`, KV production |

Luồng làm việc:

1. Nhắn yêu cầu cho Claude Code (web/mobile). Claude code trên branch riêng
   và mở PR vào `dev`.
2. CI deploy **preview** cho PR và comment link vào PR. Bạn review.
3. Bảo Claude merge. PR được squash vào `dev` và CI deploy môi trường **dev**.
4. Dev ổn thì bảo Claude **release**. Claude mở PR `dev → main`; bạn duyệt,
   PR được merge và CI deploy **production**.

## Tạo project mới: checklist

Skill `ship`, `CLAUDE.md`, CI và hook đều nằm trong repo, nên project tạo từ
template có sẵn toàn bộ luồng.

**Cách nhanh nhất:** tạo repo (bước 1 bên dưới), mở một session Claude Code
trên repo mới và gõ **`/setup-project`**. Claude sẽ kiểm tra từng bước, tự
làm phần làm được (đổi tên app, mở PR, merge, release), chỉ cho bạn phần chỉ
bạn làm được (secret, settings repo), và báo bước tiếp theo. Gọi lại
`/setup-project` bất cứ lúc nào để kiểm tra tiếp, cho đến khi dev và
production đều chạy.

Việc cần làm cho mỗi project mới (nếu làm tay):

| #   | Việc                                                                              | Chi tiết    |
| --- | --------------------------------------------------------------------------------- | ----------- |
| 1   | **Use this template**, **không** tick Include all branches                        | mục 1       |
| 2   | Thêm 2 secret `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (dùng lại token cũ) | mục 3.1     |
| 3   | Default branch `dev`; bật squash + merge commit; tắt auto-delete head branches    | mục 3.2–3.3 |
| 4   | Cho Claude GitHub App truy cập repo mới (nếu app chỉ cài cho một số repo)         | mục 3.6     |
| 5   | Session Claude đầu tiên: **đổi tên app** rồi ship                                 | mục 1       |
| 6   | Nhắn "merge" (lên dev), rồi "release" (lên production)                            | mục 5       |

Phần Cloudflare (mục 2) và environment Claude Code (mục 4) chỉ làm **một lần
cho mỗi account**. Project sau dùng lại được, bỏ qua hai mục này.

## 1. Tạo repo từ template

- Ở repo template này: **Settings → General → Template repository** (bật
  một lần). Trước khi tạo project, xoá các branch `claude/…` cũ ở trang
  **Branches** để bản sao không mang theo.
- Dự án mới: **Use this template → Create a new repository**, đặt tên và
  **không tick Include all branches**. Repo mới chỉ có một branch, mang tên
  default branch của template. Branch còn lại phải được **tạo từ branch đó**
  (mục 3.2, hoặc `/setup-project` tự làm) để `dev` và `main` có chung lịch
  sử. Nếu tick, GitHub tạo mỗi branch thành một commit gốc riêng không liên
  quan nhau: GitHub sẽ liên tục gợi ý so sánh / tạo PR giữa hai branch, và PR
  release `dev → main` không merge được. `/setup-project` phát hiện và sửa
  được trường hợp này.
- Làm mục 3, rồi mở session Claude Code đầu tiên trên repo mới và gõ
  `/setup-project` (hoặc nhắn: "Đổi tên app thành `<ten-app>` bằng
  `npm run rename -- <ten-app>`, rồi ship").

  Tên app là tên Worker và là tiền tố cho tên D1/KV, nên phải là **duy nhất
  trong tài khoản Cloudflare** (chữ thường, số, gạch ngang, ví dụ
  `shop-admin`). Nếu giữ `my-app`, project mới sẽ deploy **đè lên app cũ**
  và dùng chung database của nó.

- App mẫu (notes, visits) có thể giữ để tham khảo cấu trúc, hoặc nhắn Claude
  xoá trong một PR.

## 2. Cloudflare (một lần cho mỗi account)

Mục tiêu: lấy 2 giá trị **API token** và **Account ID** để dán vào GitHub ở
mục 3.1. Đăng nhập https://dash.cloudflare.com trước.

### 2.1. Đặt subdomain workers.dev (chỉ lần đầu dùng Workers)

1. Menu trái → **Workers & Pages**.
2. Nếu Cloudflare hỏi chọn subdomain thì gõ một tên (ví dụ `tencuaban`) →
   **Set up**. App sẽ có URL dạng `<app>.tencuaban.workers.dev`.
   Đã có subdomain rồi thì bỏ qua bước này (xem ở mục **Subdomain** bên phải
   trang Workers & Pages).

### 2.2. Lấy Account ID

Nhìn thanh địa chỉ khi đang ở dashboard:
`https://dash.cloudflare.com/`**`0123456789abcdef0123456789abcdef`**`/home`.
Chuỗi 32 ký tự ngay sau `dash.cloudflare.com/` chính là **Account ID**. (Cũng
thấy ở trang **Workers & Pages**, cột bên phải, mục **Account ID** → Copy.)

### 2.3. Tạo API token

1. Mở https://dash.cloudflare.com/profile/api-tokens (hoặc: ảnh đại diện
   góc trên phải → **My Profile** → **API Tokens**).
2. Bấm **Create Token**.
3. Ở dòng **Edit Cloudflare Workers** → bấm **Use template**.
4. Mục **Permissions**: bấm **+ Add more** để thêm một dòng mới, chọn
   **Account** · **D1** · **Edit**. (Các dòng có sẵn của template giữ nguyên.)
5. Mục **Account Resources**: **Include** · chọn **account của bạn**.
6. Mục **Zone Resources**: **Include** · **All zones** (dự án không dùng
   domain riêng thì chọn gì ở đây cũng không ảnh hưởng).
7. Bấm **Continue to summary** → **Create Token**.
8. **Copy token ngay** — Cloudflare chỉ hiển thị một lần. Lưu vào trình quản
   lý mật khẩu để dùng lại cho các project sau (cùng account thì dùng chung
   một token được). Lỡ mất thì tạo token mới, không sao.

Bạn **không cần** tự tạo D1 hay KV. CI tự tạo theo tên khi chạy lần đầu:
`<app>-db`, `<app>-KV` cho production và `<app>-db-dev`, `<app>-dev-KV` cho dev.

**R2 (chưa dùng):** template hiện chưa có binding R2. Khi cần, bật R2 một lần
ở **R2 Object Storage** trên dashboard (cần thêm phương thức thanh toán; gói
miễn phí 10 GB/tháng), rồi nhờ Claude thêm `r2_buckets` vào `wrangler.jsonc`
theo ghi chú ở đầu file. CI sẽ tự tạo bucket.

## 3. GitHub

1. **Thêm 2 secret Cloudflare** (làm cho **mỗi repo**):
   1. Mở repo trên GitHub → tab **Settings** (thanh trên cùng của repo, bên
      phải).
   2. Menu trái → **Secrets and variables** → **Actions**.
   3. Ở tab **Secrets**, phần **Repository secrets** → bấm **New repository
      secret**.
   4. **Name**: `CLOUDFLARE_API_TOKEN` · **Secret**: dán token ở mục 2.3 →
      **Add secret**.
   5. Bấm **New repository secret** lần nữa. **Name**:
      `CLOUDFLARE_ACCOUNT_ID` · **Secret**: dán Account ID ở mục 2.2 → **Add
      secret**.

   Kết quả: phần **Repository secrets** có đúng 2 dòng trên. Lưu ý:
   - Tên phải gõ **chính xác**, chữ hoa, dấu gạch dưới.
   - Đặt ở **Repository secrets**, **không** đặt ở _Environment secrets_ hay
     tab _Variables_ — CI sẽ không đọc được.
   - Dùng GitHub Organization thì có thể đặt một lần ở cấp org (Organization
     settings → Secrets and variables → Actions) cho mọi repo dùng chung.

2. **Branch `dev` và `main`**: repo mới chỉ có một trong hai. Tạo branch còn
   thiếu từ branch đang có (trang Code → chọn branch đang có → menu branch →
   gõ tên branch thiếu → Create branch). Đặt `dev` làm **default branch** (Settings → General →
   Default branch). Session Claude mới sẽ bắt đầu từ `dev` và PR mặc định
   nhắm vào `dev`.
3. **Settings → General → Pull Requests**:
   - Bật **Allow squash merging** (PR tính năng vào `dev`) và **Allow merge
     commits** (PR release `dev → main`). Tắt **Allow rebase merging**.
   - **Tắt Automatically delete head branches.** `dev` là head branch của PR
     release, nên nếu bật ô này thì GitHub sẽ xoá `dev` sau khi release
     (trừ khi có ruleset chặn xoá, xem bước 5). Branch `claude/…` đã merge
     sẽ còn lại (session cloud không xoá được branch). Chúng vô hại; muốn
     dọn thì vào trang **Branches** của repo và xoá.
4. **Không có ruleset vẫn an toàn**:
   - Job `deploy` chỉ chạy khi `check` xanh, nên code lỗi không lên được
     dev hay production.
   - Claude chỉ push vào branch `claude/…` và chỉ merge khi CI xanh và bạn
     đồng ý (skill `ship`).
   - Nếu tự bấm merge trên GitHub, hãy xem CI có xanh không trước khi bấm.
5. **Ruleset (tuỳ chọn)**: với repo **private**, GitHub chỉ áp dụng ruleset
   khi tài khoản có gói trả phí (GitHub Pro cho tài khoản cá nhân, hoặc
   Team cho organization). Repo public thì miễn phí. Nên bật khi có thêm
   người cùng push vào repo. Vào Settings → Rules → Rulesets → New branch
   ruleset:
   - **`dev`**:
     - Restrict deletions, Block force pushes.
     - Require a pull request before merging, với **Required approvals = 0**
       (PR do Claude mở bằng tài khoản của bạn, mà bạn không tự duyệt được PR
       của mình) và Allowed merge methods chỉ chọn **Squash**.
     - Require status checks to pass: chọn `check` và `preview`, và bật
       **Require branches to be up to date before merging**.
   - **`main`**: giống `dev`, nhưng Allowed merge methods chỉ chọn **Merge**
     và status check chỉ chọn `check` (PR release không chạy preview).
   - Khi đã có ruleset chặn xoá `dev`, có thể bật lại Automatically delete
     head branches.
6. **Claude GitHub App** phải truy cập được repo. Nếu app chỉ cài cho một số
   repo: GitHub → Settings → Applications → Claude → Configure → thêm repo
   mới (claude.ai/code cũng sẽ nhắc khi bạn chọn repo lần đầu).

## 4. Môi trường Claude Code (claude.ai/code)

Trong environment của session (menu environment trên thanh tiêu đề → Edit):

- **Network access**: thêm `ui.shadcn.com` vào _Allowed domains_ (giữ nguyên
  ô _package managers_), để Claude chạy được `npx shadcn add <component>`.
  Nếu thiếu domain này, Claude vẫn code được nhưng không thêm component
  shadcn mới bằng CLI.
- Không cần đưa token Cloudflare cho Claude. Mọi thao tác với Cloudflare đều
  chạy trong GitHub Actions.

Mỗi session cloud tự chạy `npm ci` khi khởi động (hook ở `.claude/settings.json`).

## 5. Lần deploy đầu tiên

Môi trường dev deploy lần đầu khi PR đầu tiên (ví dụ PR đổi tên app) được
merge vào `dev`. Production deploy lần đầu khi bạn merge PR release
`dev → main` đầu tiên. Cũng có thể chạy tay: **Actions → CI → Run workflow**,
chọn `dev` hoặc `main`. Job `deploy` sẽ tạo tài nguyên, chạy migration và
deploy. URL nằm trong summary của job và trong tab **Environments** (`dev`,
`production`).

## Cách dùng hằng ngày

| Bạn nhắn           | Claude làm                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------- |
| "Thêm tính năng X" | Code trên branch riêng, test, rồi chạy skill `ship`: push, mở PR vào `dev`, gửi link preview |
| "Sửa chỗ Y"        | Push thêm vào cùng PR, preview tự cập nhật                                                   |
| "OK, merge đi"     | Kiểm tra CI xanh, squash-merge vào `dev`, môi trường dev tự deploy                           |
| "Release"          | Mở PR `dev → main`; khi bạn duyệt thì merge (merge commit), production tự deploy             |

Muốn làm nhiều tính năng cùng lúc thì mở **mỗi tính năng một session**. Mỗi
session có branch, PR và URL preview riêng (`pr-<số PR>-…`). Nếu PR bị xung
đột sau khi PR khác được merge, session đó sẽ tự merge `dev` vào, giải quyết
xung đột rồi push lại.

## Lưu ý

- **Preview của PR dùng chung D1/KV với môi trường dev**, tách biệt hoàn
  toàn với production. Migration của một PR được áp ngay vào DB dev, nên viết
  migration theo kiểu tương thích ngược (thêm cột hoặc bảng, không xoá hay
  đổi tên ngay).
- **Không squash PR `dev → main`**: squash tạo commit mới trên `main` mà `dev`
  không có, lần release sau sẽ xung đột. Luôn dùng merge commit. Sau khi
  merge, Claude đẩy `dev` tiến tới đúng commit đó (fast-forward, không đổi
  code), nên GitHub không còn gợi ý "main had recent pushes / Compare & pull
  request". Nếu vẫn thấy gợi ý đó thì bỏ qua, không cần tạo PR.
- **Hotfix gấp:** tạo branch từ `main`, mở PR vào `main`, merge, rồi mở PR
  `main → dev` để `dev` có bản sửa.
- URL dev và preview là public. Nếu cần giới hạn người xem, bật **Cloudflare
  Access** cho `*.workers.dev` của Worker `<app>-dev`.
- Preview alias của PR đã đóng vẫn còn trên Cloudflare nhưng không gây hại.
- **Cập nhật template không lan sang project cũ**: template chỉ được sao
  chép một lần lúc tạo repo. Cải tiến CI, skill hay quy ước thì làm ở repo
  template, rồi nhờ Claude ở từng project cũ áp dụng thay đổi tương tự nếu
  cần.
- Gắn domain riêng cho production: thêm `routes` hoặc `custom_domain` vào
  phần top-level của `wrangler.jsonc`.

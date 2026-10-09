# Claude × GitHub × Cloudflare template

Template full-stack để làm việc hoàn toàn từ Claude Code trên web/mobile:

```
Bạn nhắn yêu cầu ─► Claude code trên branch claude/… ─► PR vào dev
      ─► CI: check (format, lint, typecheck, test, build)
      ─► preview: deploy lên Cloudflare, comment URL vào PR ─► bạn review
      ─► bạn duyệt ─► squash-merge vào dev ─► deploy môi trường dev
      ─► dev ổn ─► PR release dev → main ─► bạn duyệt ─► deploy production
```

**Stack:** React 19 · Vite · Tailwind v4 · shadcn/ui (Base UI) · Hono ·
Cloudflare Workers · D1 · KV · Vitest (chạy trong workerd).

- **Thiết lập:** xem [SETUP.md](SETUP.md). Cần 2 secret Cloudflare và branch
  `dev`; ruleset bảo vệ branch là tuỳ chọn.
- **Quy ước cho Claude:** [CLAUDE.md](CLAUDE.md), skill
  [`ship`](.claude/skills/ship/SKILL.md).
- **CI/CD:** [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Chạy local

```bash
npm ci
npm run db:migrate:local
npm run dev        # http://localhost:5173 — React + API + D1/KV giả lập
npm run check      # đúng những gì CI chạy
```

App mẫu có 2 tính năng, mỗi tính năng minh hoạ một binding: notes (D1) và
visits (KV). Mỗi tính năng nằm trong thư mục riêng ở cả
`src/features/` và `worker/features/` và được nạp tự động. Muốn thêm tính
năng mới chỉ cần thêm thư mục, không phải sửa file chung, nên nhiều session
làm song song ít bị xung đột.

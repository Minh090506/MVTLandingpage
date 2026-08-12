# MVT Landing Page Operations System

Hệ thống quản lý + đo lường tập trung cho toàn bộ landing page MyVivaTour.

**Trạng thái:** code + docs xong, đã verify local. **Chưa deploy** — còn 2 cổng người ở §Bàn giao.

## Outcome
Mọi LP dùng chung: 1 brand guide, 1 endpoint lead, 1 event taxonomy, 1 playbook nội dung, 1 pipeline CI/CD có gate. Đo được lead theo LP/UTM/campaign.

## Non-goals
- Không đổi design/nội dung LP hiện tại
- Không migrate ảnh khỏi Supabase bucket hiện tại
- Không xây CRM đầy đủ (chỉ ingest + forward)

## Quyết định đã chốt (user, 260811)
| # | Quyết định |
|---|---|
| Backend | CF Worker `/api/lead` → Supabase; vẫn forward Web3Forms |
| Lead delivery | Email (Web3Forms) + đẩy sang mvt-saas (operator.myvivatour.com) |
| CI/CD | Validation gate + PR preview deploy |
| RLS | Bật toàn bộ 19 bảng |

## Phases

| # | Phase | Status | Kết quả |
|---|---|---|---|
| 01 | Brand guideline | ✅ | `docs/mvt-brand-guidelines.md` |
| 02 | RLS hardening | ✅ | 20/20 bảng RLS on, 0 policy (default-deny) |
| 03 | Lead backend | ✅ | `marketing_leads` + `worker-modules/lead-ingest-handler.js` + route `/api/lead` |
| 04 | Tracking standardisation | ✅ | `docs/mvt-tracking-spec.md`, attribution client, tracking client, dental bù event |
| 05 | Content playbook | ✅ | `docs/mvt-content-playbook.md` |
| 06 | CI/CD gate + PR preview | ✅ | `scripts/validate-landing-pages.js`, `validate.yml`, gate trên cả 2 deploy workflow |

## Kiến trúc lead

```
Form (escape / happytours / dental)
   │  lead-attribution-client.js  ─ gắn utm/gclid/fbclid, first-touch 90 ngày
   ▼
POST /api/lead   (same-origin, cùng worker.js → dental dùng chung miễn phí)
   │
   ├─► Supabase public.marketing_leads   (service_role, RLS default-deny)
   ├─► Web3Forms ──► info@myvivatour.com  (bản sao email)
   └─► mvt-saas   (ctx.waitUntil, chỉ khi MVT_CRM_LEAD_URL được set)
```

Fail-open: chỉ báo lỗi cho khách khi **cả** DB lẫn email fail. Ingest chết → client tự fallback về Web3Forms.

## Verify đã chạy

| Kiểm tra | Kết quả |
|---|---|
| `node build.js` + parse worker.js as ESM | PASS (629.4 KB) |
| `scripts/test-lead-ingest-handler.mjs` | 24/24 PASS |
| `scripts/test-lead-attribution-client.mjs` | 22/22 PASS |
| `scripts/validate-landing-pages.js` (remote) | PASS — 6 page, 58/58 ảnh CDN HTTP 200 |
| 3 workflow YAML parse | PASS |
| Round-trip payload thật vào `marketing_leads` | PASS, đã xoá row test |
| RLS toàn schema | 20/20 bảng on, 0 bảng hở |

## Bàn giao

Handoff đầy đủ (gotcha, file đã đụng, prompt cho phiên sau):
`/Users/minhhome/plans/handoffs/260812-0851-mvt-landing-page-operations-system-handoff.md`

### 2 việc cần người

1. **Set secrets trên Worker** (`docs/mvt-tracking-spec.md` §9) — chưa set thì `/api/lead` trả 502 và client tự fallback về Web3Forms (không mất lead, nhưng **không có row nào vào DB**).
2. **Cấu hình GTM** (`docs/mvt-tracking-spec.md` §6) — event đã bắn vào dataLayer nhưng chưa có trigger/tag nào tiêu thụ.

Sau đó: mở PR → xem preview → merge → chạy QA §7 tracking spec.

## Rủi ro còn lại
- **mvt-saas ingest chưa có endpoint** → `MVT_CRM_LEAD_URL` trống, `crm_synced_at` null. Index `marketing_leads_crm_pending_idx` sẵn cho backfill sau.
- **Bật RLS ngoài repo**: đã verify repo này không đọc Postgres bằng anon key (chỉ storage + service_role), `dashboard-worker.js` không gọi Supabase. Hệ thống *ngoài* repo chưa verify được → smoke test sau deploy.
- **Preview worker không có secrets** → submit form trên preview sẽ fallback gửi email thật. Giống hành vi hiện tại, không phải regression, nhưng đừng test form bừa trên preview.

## Phối hợp Codex
Codex CLI 0.147.0 làm Phase 06 (validator 589 dòng + validate.yml + guide). Claude làm 01–05, review Codex và vá 2 lỗ hổng nó tự flag/bỏ sót: gate thiếu trên `deploy-dental.yml`, và `worker-modules/**` thiếu trong `paths` của cả 3 workflow.

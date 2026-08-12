# MVT landing-page CI/CD guide

## What runs when

- A pull request targeting `main` runs `.github/workflows/validate.yml` when landing-page, build, Wrangler, dashboard, workflow, or `scripts/**` files change.
- The validator runs `build.js` in an isolated temporary directory, syntax-checks the generated Worker, compares `PAGES_CONFIG` with page directories containing `index.html`, checks metadata/tracking/image references, and sends concurrency-limited HEAD requests to every referenced MVT Supabase CDN URL.
- After validation passes, same-repository PRs deploy `mvt-preview-pr-<PR_NUMBER>` to its `workers.dev` URL. The workflow creates its Wrangler config at runtime with `workers_dev = true` and no routes, then creates or updates one PR comment with the preview URL.
- Fork PRs validate but do not receive Cloudflare secrets and do not deploy previews.
- A push to `main` still runs `.github/workflows/deploy.yml`. The same validator is a blocking step before the existing build and three production deploy steps. The existing `[upload-images]` job remains unchanged.
- `.github/workflows/deploy-dental.yml` (the dental-only fast path) runs the same validator before deploying. It has no emergency bypass — an urgent dental deploy that must skip validation should go through the manual `deploy.yml` run instead.
- All three workflows also trigger on `worker-modules/**`, because `build.js` inlines those files into `worker.js`; editing the lead-ingest handler or the tracking client changes what ships.

## Run and diagnose locally

```bash
node scripts/validate-landing-pages.js
node scripts/validate-landing-pages.js --skip-remote
node scripts/validate-landing-pages.js --json > validation-report.json
```

Failures are grouped as `Build`, `Registration`, `Page checks`, or `Remote assets`. In GitHub Actions, read the job summary first, then download the `landing-page-validation-pr-<number>` JSON artifact for exact page names, line numbers, missing IDs, status codes, and URLs.

Tracking checks are skipped only when `PAGES_CONFIG` declares `redirectTo`, or when HTML is under 2,000 bytes and also contains a clear redirect/placeholder signal such as `301`, meta refresh, `window.location.replace`, `location.href`, or “coming soon”. Other checks still apply to these stubs.

`--skip-remote` is only for offline local work. CI deliberately uses remote checks. A new CDN URL must already return HTTP 200 before its PR and production deploy gates can pass; upload new assets to Supabase before merging. The `[upload-images]` post-deploy job is still useful for replacing or synchronising already-published paths, but it cannot satisfy a gate for a brand-new URL by itself.

## Emergency production bypass

Repository operators can open **Actions → Build & Deploy MVT Landing Pages → Run workflow**, enable **Emergency only: deploy without the landing-page validation gate**, and run the manual deployment. This bypass applies only to that manual production run; it does not weaken PR validation. Record why it was used and immediately fix or revert the failing source.

## Preview cleanup

Closing or merging a same-repository PR triggers the cleanup job. It deletes `mvt-preview-pr-<PR_NUMBER>` through the Cloudflare API and changes the existing preview comment to show that the Worker was removed. A missing Worker is treated as already clean. If deletion fails, the workflow fails and the PR comment tells the operator to inspect the logs and delete that exact Worker in Cloudflare.

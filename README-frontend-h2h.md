# Frontend H2H + Economy patch

این پچ UI چیزهایی را که در بک‌اند اضافه شده ولی در سایت دیده نمی‌شود اضافه می‌کند:

- صفحه کیف پول: `/wallet`
- صفحه بازی‌های رو-در-رو: `/h2h`
- صفحه جزئیات بازی و ثبت/تایید/اعتراض نتیجه: `/h2h/:id`
- پنل ادمین داوری اعتراض‌ها: `/admin/h2h-review`
- پنل ادمین اقتصاد، شارژ کیف پول، گریدها و ریست فصل: `/admin/economy`

## روش اعمال

فایل‌ها را در ریشه پروژه `claude-fullstack` کپی کنید و سپس اجرا کنید:

```bash
node tools/apply-h2h-frontend.mjs
npm --prefix frontend run build

git add .
git commit -m "Add frontend for head-to-head economy workflow"
git push origin main
```

اگر build خطا داد، متن خطا را بفرستید.

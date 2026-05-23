# Free Deployment (Cloudflare Pages + Render)

This project is ready for a free split deployment:
- Frontend (`client`) on Cloudflare Pages
- Backend (`server`) on Render Free Web Service

## 1) Deploy Backend on Render

1. Push repository to GitHub.
2. Open Render dashboard and click `New` -> `Blueprint`.
3. Select this repo. Render will detect `render.yaml`.
4. Create service and set required environment variables in Render:
   - `CLIENT_URL` = your Cloudflare Pages URL (example: `https://pinqoza.pages.dev`)
   - `JWT_SECRET`
   - `JWT_ADMIN_SECRET`
   - `MONGODB_URI`
   - `ADMIN_MONGODB_URI` (if your app uses a separate admin DB)
   - SMTP and OAuth values if those features are used.
5. Wait for deploy and copy backend URL:
   - Example: `https://pinqoza-api.onrender.com`
6. Verify health:
   - `https://pinqoza-api.onrender.com/api/health`

## 2) Deploy Frontend on Cloudflare Pages

1. Open Cloudflare dashboard -> `Workers & Pages` -> `Create` -> `Pages` -> `Connect to Git`.
2. Select this repo.
3. Set:
   - `Project root` = `client`
   - `Build command` = `npm run build`
   - `Build output directory` = `build`
4. Add environment variable in Pages:
   - `REACT_APP_API_URL` = `https://pinqoza-api.onrender.com/api`
5. Deploy and copy frontend URL:
   - Example: `https://pinqoza.pages.dev`

## 3) Final CORS Update on Render

After frontend URL is known, update Render env var:
- `CLIENT_URL=https://pinqoza.pages.dev`

If you use custom domain too, include both comma-separated:
- `CLIENT_URL=https://pinqoza.pages.dev,https://www.yourdomain.com`

Redeploy backend after env update.

## 4) Notes

- Render free web services can sleep when idle; first request can be slow.
- Never commit `node_modules` or `.env` files.

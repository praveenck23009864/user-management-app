# RAKA tech — User Workspace

A responsive React and Express user dashboard built from your RAKA project. It includes dashboard, searchable user table and cards, analytics based on fetched users, AI assistant, settings, admin login, and slide-over user forms. The frontend uses the existing backend proxy for the Playground users API. Only admins can add, edit, delete, or ask the AI assistant.

## Run locally

Open this folder in VS Code. Use **two terminals**:

**Backend**

```powershell
cd backend
npm install
Copy-Item .env.example .env
node admin.js
```

Choose a password of at least 12 characters. Put the printed hash in `backend/.env` as `ADMIN_PASSWORD_HASH`; change `ADMIN_EMAIL` to your login email. Fill `OLLAMA_API_KEY` and `OLLAMA_MODEL` only if using AI chat. Then run:

```powershell
npm start
```

**Frontend** (from the project root):

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The backend runs on port 5000. The dashboard can show users as a viewer; click **Admin login** to unlock changes and chat. Your local `.env` is intentionally absent from this project file. Never commit it to GitHub.

## Notes

- Status is shown as **Unknown** when the Playground API does not supply it. Analytics count only fields returned by the API; there are no invented join dates or trends.
- The Playground API and Ollama Cloud need internet access. AI chat requires valid Ollama credentials. The API sandbox may be shared or reset independently of this app.
- Verify the project with `npm run lint` and `npm run build`.

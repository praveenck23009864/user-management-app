# User Management App — simple component structure

This is the refactored React CRUD and AI chat project from the uploaded archive.

## Start the app

Extract this ZIP. Open the `react-crud-playground` folder in VS Code. Run commands from this folder, not its parent.

Frontend terminal:

```sh
npm install
npm run dev
```

Backend terminal:

```sh
cd backend
npm install
npm start
```

Keep your existing backend `.env` file, or copy `backend/.env.example` to `backend/.env` and fill in your Ollama API key and cloud model name. The real credential file is excluded from the download. Keep the backend port at 5000 to match the Vite proxy. Open the URL printed by Vite.

## File organization

`src` contains `App.jsx`, the required `main.jsx` entry file, and `components/`. Build configuration and the chat backend remain outside `src` because they are required to run the project.

| File under components | Responsibility |
| --- | --- |
| UserManagement.jsx | Shared state, user requests, and overall page layout |
| PageHeader.jsx | Page title and Add user button |
| UserDirectory.jsx | Filtering, loading/error/empty states, and user list |
| UserSearch.jsx | Search input |
| UserCard.jsx | User information, Edit, and in-app delete confirmation |
| UserForm.jsx | Add/edit fields and validation |
| UserChat.jsx | Conversation, thinking state, and chat request |
| usersApi.js | GET, POST, PATCH, and DELETE request helpers |
| Global.css | Shared fonts, controls, and feedback styles |

Every UI component imports its matching CSS file. Global.css is imported once in main.jsx. App.jsx imports UserManagement and returns it; UserManagement brings the smaller UI components together.

## Readability changes

Components follow imports, a normal function with a return, and a final default export. Ordinary function declarations or function callbacks replace arrow functions. The app uses core React hooks: useState for data, useEffect for loading/focus, and useRef for focus and preventing duplicate/stale requests. No custom hooks, context, reducers, or extra state libraries were added.

App.jsx has no API logic or try/catch. Necessary error handling remains with user requests and chat so failed requests show a message and unlock controls. Duplicate unused form/list components, source assets, unused styles, and repeated delete CSS were removed. The missing Add user button is restored so a closed form can be reopened. The delete confirmation button now has readable white text.

## Verification

- ESLint passed.
- Vite production build passed.
- DOM interaction checks with mocked API responses passed: listing, search and no-match state, editing, adding/reopening the form, save failure/retry, delete/cancel, chat thinking/history/error, and loading failure/retry.
- No runtime errors occurred in those DOM checks.
- Live Playground API mutations and Ollama Cloud calls were not tested. Browser visual checks were unavailable; responsive CSS rules were retained.

To repeat the static checks:

```sh
npm run lint
npm run build
```

Dependencies, generated build output, Git metadata, and real environment credentials are not included. Install dependencies separately in both the project folder and backend folder.

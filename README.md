# RFP Management Platform

A two-part application (Express backend + React/Vite frontend) for managing Requests for Proposal (RFPs), parsing vendor responses, and storing structured data in MongoDB.

## Requirements
- Node.js **20.x or newer** (the backend uses ES modules that rely on Node 20 runtime features).
- npm 10+ (bundled with recent Node releases).
- MongoDB 6+ reachable from your machine.
- Create databse named **AERCHAIN**
- Update the vendor.json in frontend with emails you wish to send.
- API credentials (OpenAI) and mailbox access to ingest proposal emails automatically.
- The Only supported attachments currently docx, xlsx and pdf.

Check your versions with:

```bash
node -v
npm -v
```

## Project Structure
- `backend/` – Express server, MongoDB integration, email/LLM services.
- `frontend/` – React + Vite UI with TailwindCSS and Shadcn UI Components.

## Setup
1. Clone or download the repository, then open a terminal at the repo root.
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Backend Configuration
Create `backend/.env` (or export the variables in your shell) and provide the required values:

```
PORT=4040
MONGODB_URI=mongodb://localhost:27017/AERCHAIN
OPEN_AI_API_KEY=sk-...
EMAIL_ID=your-inbox@example.com
EMAIL_PSSWD=app-specific-password
```

- `PORT` is optional; defaults to `4040`.
- `MONGODB_URI` must point to a writable MongoDB instance.
- `OPEN_AI_API_KEY` enable proposal parsing via LLMs.
- `EMAIL_ID` / `EMAIL_PSSWD` (IMAP credentials) start the background email monitor; leave unset to disable it.

Start the backend from the `backend` directory:

```bash
node server.js
```

The API will listen on `http://localhost:4040` (or the port you set) with health check at `/health` and main routes under `/api`.

## Frontend Configuration
Create `frontend/.env` and point it at the backend API:

```
VITE_API_URL=http://localhost:4040/api
```

Run the frontend (inside `frontend/`):

```bash
npm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). The app proxies requests to the backend using `VITE_API_URL`.

## Tech Stack

- **Frontend** - React Js, Shadcn UI, Tailwindcss, Vite
- **Backend** - Nodejs, Expressjs, openai
- **Mail Service** - Gmail, SMTP
- **AI Provider** - Open AI - gpt-mini-40
- **Key Libraries** - pdf-parser, imapflow, mamooth
- **Database** - MongoDB


## API Endpoints
- `GET /health` – simple heartbeat that returns `{ ok: true }`.
- `POST /api/rfps` – create an RFP from a natural-language `text` brief and store the structured record.
- `GET /api/rfps` – list every RFP with their basic metadata.
- `GET /api/rfps/:id` – fetch a single RFP by MongoDB ID.
- `GET /api/rfps/:id/proposals` – return an RFP plus all proposals associated with it.
- `GET /api/rfps/:id/analyze` – run stored proposals through the AI analyzer and receive a summary/comparison.
- `POST /api/rfps/:id/send` – email the selected RFP to vendor addresses provided in the body.
- `POST /api/rfps/:id/close` – mark the RFP as closed, persist the winning `proposalId`, and capture optional notes.
- `DELETE /api/rfps/:id` – permanently remove the targeted RFP.

## API Status Codes & Validation
- **201 Created** – Successful resource creation (e.g., `POST /api/rfps`) returns 201 with the newly created RFP in `data`.
- **200 OK** – Read actions (`GET /health`, `/api/rfps`, `/api/rfps/:id`, `/api/rfps/:id/proposals`, `/api/rfps/:id/analyze`) and mutate actions (`POST /api/rfps/:id/send`, `POST /api/rfps/:id/close`, `DELETE /api/rfps/:id`) return 200 when they complete and include either `{ data: ... }` or `{ ok: true }`.
- **400 Bad Request** – Validation failures surface as 400 with an `error` message (missing `text`, no vendor emails, missing `proposalId`, trying to analyze without proposals).
- **404 Not Found** – Whenever the supplied `:id` does not match an RFP, the controller responds with 404 (`error: "RFP not found"`).
- **500 Internal Server Error** – Uncaught errors are wrapped by each controller’s `try/catch` and sent back as 500 plus the error message for troubleshooting.

### Data Validation Rules
- **Create RFP** (`POST /api/rfps`): requires a non-empty string `text` body; the controller rejects missing/invalid payloads before calling the service.
- **Send RFP** (`POST /api/rfps/:id/send`): accepts `vendorEmails`, removes duplicates/empties, and returns 400 if no valid recipient remains; optional `subject`/`body` fall back to defaults.
- **Analyze Proposals** (`GET /api/rfps/:id/analyze`): ensures the target RFP exists and has at least one stored proposal; otherwise responds with 400 to avoid unnecessary LLM calls.
- **Close Deal** (`POST /api/rfps/:id/close`): requires `proposalId` in the body; optional `notes` saved as `closureNotes` along with `selectedProposalId`, `status: "closed"`, and `closedAt`.
- **General retrieval**: every handler fetches the RFP first (`rfpServices.getById`) and immediately returns 404 if absent, preventing downstream operations with invalid IDs.

## Decisions && Assumptions
   - I assumed all the procurement manager always ask the model regarding the procurement decisions and he will enter a valid natural text.
   - The vendors always send a valid proposal.
   - The scoring will be based on the budget and the how well the  proposal is aligned with the rfp. 

## AI Tool Usage

- I used Openai codex and Anthropic claude for generating boiler plate code and it helped to improve prompts in generating structured rp and propsal analyzing prompts.
- It helped in developing the document parser which parses the pdf, txt and xlsx formats.
- The frontend UI was redesigned with the help of Claude.
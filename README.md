# ReconFlow Ethiopia 🇪🇹

**ReconFlow Ethiopia** is an enterprise-grade multi-bank and mobile-money financial reconciliation platform engineered for Ethiopian FMCG distributors, retail chains, telecommunication sales agents (DSAs), and multi-branch enterprises.

It bridges transaction gaps across financial institutions (CBE, Dashen, Awash, Bank of Abyssinia), mobile money providers (Telebirr, CBE Birr), and ERP platforms (Odoo ERP) with automated rules-based matching, maker-checker authorization, exception management, and bilingual support (English & Amharic).

---

## 🌟 Key Capabilities

- **Automated Matching Engine**:
  - **Exact Matching**: Instant 1:1 auto-confirmation based on transaction references, float source, and exact amounts.
  - **Strong Rule Matching**: Automated proposal of candidates based on shop/DSA IDs, exact amount matching, and configurable 0–7 day date tolerances.
  - **Fuzzy Partial Reference & Variance Matching**: Configurable amount variance tolerances ($\pm$0 to $\pm$500 ETB) and string distance reference matching.
- **Multi-Source Financial Statement Parser**:
  - Built-in CSV, Excel (`.xlsx`), and text format importers for Telebirr Agent Float, CBE Birr, Commercial Bank of Ethiopia (CBE), Dashen Bank, and Awash Bank statements.
- **4-Step Guided Manual Matching**:
  - Interactive multi-select drawer for complex $1:N$, $N:1$, and $N:M$ manual reconciliation with live discrepancy tracking and approval workflow.
- **Odoo ERP Integration**:
  - Bi-directional synchronization for Chart of Accounts, Journals, and automated journal entry exports with idempotency keys and Maker-Checker approval checks.
- **Enterprise Governance & Maker-Checker**:
  - Role-Based Access Control (Super Admin, Financial Controller, Regional Manager, Shop Supervisor, Auditor).
  - Period Lock engine preventing retrospective edits on closed financial periods with mandatory unlock audit logging.
- **AI-Powered Exception Queue**:
  - Automated variance explanations and AI-driven match suggestions powered by Gemini AI (`@google/genai`).
- **Bilingual Interface**:
  - Complete English and Amharic (አማርኛ) localization.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion API), Lucide Icons
- **Data & File Processing**: PapaParse (CSV parsing), SheetJS (`xlsx`)
- **Backend / Integration Services**: Node.js / Express, `@google/genai` (Gemini API)
- **Testing & Verification**: Vitest, TypeScript Type Checking (`tsc --noEmit`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd reconflow-ethiopia
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure your local credentials:
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 📜 Available Scripts

- `npm run dev` - Starts the Vite development server on port 3000 (`0.0.0.0`).
- `npm run build` - Builds production bundle into `dist/`.
- `npm run preview` - Previews the built production assets locally.
- `npm run test` - Runs unit and integration test suites with Vitest.
- `npm run lint` - Runs TypeScript compiler checks (`tsc --noEmit`).

---

## 🔑 Default Credentials (Demo / Seed Data)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@reconflow.demo` | `ReconFlow!2026` |
| **Financial Controller** | `controller@reconflow.demo` | `ReconFlow!2026` |
| **Regional Manager** | `manager.addis@reconflow.demo` | `ReconFlow!2026` |
| **Shop Supervisor** | `supervisor.merkato@reconflow.demo` | `ReconFlow!2026` |

---

## 🛡️ Security & Environment Setup

Refer to `.env.example` for required configuration options:

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
BOOTSTRAP_ADMIN_EMAIL="admin@reconflow.demo"
BOOTSTRAP_ADMIN_PASSWORD="ReconFlow!2026"
JWT_SECRET="super-secret-reconflow-session-key-2026"
```

> **Note**: Secrets must never be committed to git repositories. In AI Studio and Cloud Run container environments, secrets are managed securely via the system configuration menu.

---

## 📄 License

This project is proprietary software configured for enterprise financial reconciliation.

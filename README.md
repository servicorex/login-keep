<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/key-round.svg" width="64" height="64" alt="KeyLocker Logo" />
  
  <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.25rem; color: #6366f1;">
    KeyLocker
  </h1>
  
  <p style="font-size: 1.1rem; color: #94a3b8; max-width: 650px; line-height: 1.6;">
    A lightweight, personal password vault built for simplicity, speed, and dependable security. Instant Google & Email sign-in, real-time Firestore sync, and client-side AES-256-GCM encryption.
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19.3-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-8.3-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-v11-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-10b981?style=for-the-badge" alt="AES-256-GCM" />
  </p>

  <br />
</div>

<hr style="border: 0; border-top: 1px solid #1e293b; margin: 2rem 0;" />

## 🌟 Highlights

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🚀 Frictionless Flow</h3>
      <p style="color: #94a3b8; font-size: 0.95rem;">
        No separate master password or complicated recovery sheets. Sign in with your Google or Email account and access your vault immediately.
      </p>
    </td>
    <td width="50%" valign="top">
      <h3>🔒 AES-256-GCM Encryption</h3>
      <p style="color: #94a3b8; font-size: 0.95rem;">
        Passwords are encrypted client-side in the browser before being written to Firestore, using unique 96-bit random IVs for every save.
      </p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>⚡ Sub-Second Load Time</h3>
      <p style="color: #94a3b8; font-size: 0.95rem;">
        In-memory key caching eliminates PBKDF2 re-derivation loops, rendering your saved credentials almost instantly.
      </p>
    </td>
    <td width="50%" valign="top">
      <h3>🎨 Automatic Favicons</h3>
      <p style="color: #94a3b8; font-size: 0.95rem;">
        High-resolution official logos are fetched automatically in real-time as you type website names, formatted with full-bleed container styling.
      </p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📋 1-Click Copy with 30s Purge</h3>
      <p style="color: #94a3b8; font-size: 0.95rem;">
        Fast one-click username and password copying with automatic clipboard wiping after 30 seconds for peace of mind.
      </p>
    </td>
    <td width="50%" valign="top">
      <h3>🛡️ Strict User Isolation</h3>
      <p style="color: #94a3b8; font-size: 0.95rem;">
        Firestore Security Rules enforce that each user can only read, write, and delete their own private <code>users/{userId}/vault</code> subcollection.
      </p>
    </td>
  </tr>
</table>

<br />

## 📁 Repository Structure

```text
password-locker/
├── public/                 # Static assets & favicons
├── src/
│   ├── assets/             # Brand logos & graphics
│   ├── tests/              # Performance benchmarks & unit tests
│   │   ├── crypto.test.js
│   │   ├── perf.benchmark.js
│   │   ├── perf.test.js
│   │   └── security.audit.test.js
│   ├── App.jsx             # Main interactive vault dashboard & modals
│   ├── crypto.js           # Web Crypto API engine (AES-GCM-256 + PBKDF2)
│   ├── firebase.js         # Firebase Auth & Cloud Firestore modular client
│   ├── index.css           # Tailwind CSS v4 directives & dark theme
│   └── main.jsx            # React root entry point
├── .firebaserc             # Firebase active project context
├── firebase.json           # Firebase CLI service definitions
├── firestore.rules         # Live deployed server-side security rules
├── package.json            # Scripts & project dependencies
└── vite.config.js          # Vite build pipeline & Tailwind plugin
```

<br />

## 🛠️ Tech Stack & Architecture

<div align="center">

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Fast, responsive Single Page Application (SPA) |
| **Styling** | Tailwind CSS v4 | High-performance dark-theme UI with fluid responsiveness |
| **Icons** | Lucide React | Clean, modern iconography |
| **Auth** | Firebase Authentication | Google OAuth 2.0 & Email/Password session management |
| **Database** | Cloud Firestore | Real-time, multi-device cloud synchronization |
| **Cryptography** | Web Crypto API | Client-side AES-256-GCM encryption with 96-bit random IVs |

</div>

<br />

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or later)
* **npm** (v9.0.0 or later)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/servicorex/password-locker.git
   cd password-locker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run Automated Tests:**
   ```bash
   node --test src/tests/perf.test.js
   ```

<br />

## 🔒 Security Architecture

```
[Client Browser]                                  [Cloud Firestore]
      │                                                   │
  (Password)                                              │
      │                                                   │
      ▼ AES-256-GCM (Fresh 96-bit random IV)             │
  (enc::Base64...) ─── HTTPS / TLS Transport ───────────► │ Saved to users/{uid}/vault
                                                          │ (Guarded by Firestore Rules)
```

* **No Plaintext Passwords in Cloud:** Passwords are encrypted before network dispatch.
* **Server-Level Isolation:** Access is strictly verified by Firebase Security Rules:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/vault/{docId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

<br />

<div align="center">
  <p style="color: #64748b; font-size: 0.85rem;">
    KeyLocker &bull; 100% Free & Open-Source &bull; Built with React & Firebase
  </p>
</div>

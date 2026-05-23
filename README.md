# 🤖 FARAZ MASTER — Personal AI Agent

A fully-featured, single-owner personal AI agent website. Runs 100% free on GitHub Pages with no backend server.

## 🆓 Total Monthly Cost: ₨0 / $0

---

## 📋 WHAT YOU NEED (All Free)

### 1. Google Gemini API Key (AI Brain — FREE)
1. Go to: **https://aistudio.google.com**
2. Click **"Get API Key"**
3. Click **"Create API key"**
4. Copy the key (starts with `AIza...`)
- Free tier: 15 requests/minute, 1 million tokens/day

### 2. Firebase (Database + Storage — FREE)
1. Go to: **https://console.firebase.google.com**
2. Click **"Add project"** → Name: `faraz-master` → Continue
3. In left panel: **Firestore Database** → Create Database → "Start in test mode"
4. In left panel: **Storage** → Get Started
5. Click the gear icon → **Project Settings** → scroll to "Your apps"
6. Click the web icon `</>` → Register app → Copy the config object:
```
const firebaseConfig = {
  apiKey: "...",        ← this is your Firebase API Key
  authDomain: "...",   ← this is your Auth Domain  
  projectId: "...",    ← this is your Project ID
  ...
};
```

### 3. GitHub Account (Free Hosting)
1. Create account at: **https://github.com**
2. Create new repository named: `faraz-master` (set to **Public**)
3. Upload all files from the `faraz-master/` folder into this repo
4. Go to repo **Settings** → **Pages** → Source: **GitHub Actions**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/faraz-master`

### Optional: ElevenLabs (Better Voice — has free tier)
- Sign up at **https://elevenlabs.io** (free: 10,000 chars/month)
- Get your API key from Profile → API Keys
- Enter in Settings → Voice after setup

### Optional: News API (Better News — FREE)
- Sign up at **https://newsapi.org** (free: 100 requests/day)
- Works perfectly for personal use

---

## 🚀 SETUP STEPS

1. Create a GitHub repository named `faraz-master`
2. Upload ALL files from the `faraz-master/` folder
3. Go to repository Settings → Pages → Source: **GitHub Actions**
4. Your site deploys automatically!
5. Visit `https://YOUR_USERNAME.github.io/faraz-master`
6. The Setup Wizard will guide you through:
   - Entering your API keys
   - Setting your name and agent name
   - Creating your 6-word PIN
   - Setting up recovery questions
   - Saving your emergency recovery card

---

## 🎯 FEATURES (550+)

### Authentication
- ✅ 6-word PIN login
- ✅ 3 recovery methods: phrase, questions, emergency code
- ✅ Lockout after 5 failed attempts (30 min)
- ✅ Audit log of all logins
- ✅ Session management

### AI Agent
- ✅ Google Gemini 1.5 Flash (free, very capable)
- ✅ Persistent conversation memory
- ✅ Multilingual: Urdu/English/Punjabi
- ✅ Long-term memory stored in Firebase

### Voice
- ✅ Always-listening voice mode
- ✅ Wake word detection ("Hey Faraz")
- ✅ Male/Female voice switching
- ✅ ElevenLabs ultra-realistic voice (optional)
- ✅ Browser TTS fallback (always free)

### Emotional Intelligence
- ✅ Agent has real emotions (happy/upset/playful)
- ✅ Defends itself when insulted
- ✅ Gradual reconciliation after conflict
- ✅ Reacts to your facial emotions via camera

### Camera
- ✅ Presence detection (greets when you appear)
- ✅ Emotion detection via face-api.js
- ✅ Privacy alert (multiple faces detected)
- ✅ Privacy blur mode

### News
- ✅ Auto news by country (Pakistan, UAE, US, UK, etc.)
- ✅ RSS feeds (always free, no key needed)
- ✅ NewsAPI integration (100/day free)
- ✅ Breaking/Important/Interesting categories

### Tasks
- ✅ Kanban board (Queued/Running/Done)
- ✅ Priority levels (Low/Medium/High/Critical)
- ✅ Scheduled tasks with alerts
- ✅ AI-powered task guidance

### Files
- ✅ Upload files to Firebase Storage (5GB free)
- ✅ Local fallback (browser storage)
- ✅ File analysis by AI

### Proactive Conversations
- ✅ Agent speaks first after idle time
- ✅ Morning briefing (configurable time)
- ✅ Evening wrap-up summary

---

## 🛡️ PRIVACY & SECURITY

- All API keys stored **only in your browser** (localStorage, encrypted)
- No data sent to any third party except:
  - Google (Gemini API calls — your prompts)
  - Firebase (your chats/tasks/files — your own database)
- PIN never stored in plaintext — SHA-256 hashed
- Works offline (basic UI, no AI)
- PIN lockout protection against brute force

---

## 📱 BROWSER SUPPORT

| Browser | Chat | Voice | Camera |
|---------|------|-------|--------|
| Chrome  | ✅   | ✅    | ✅     |
| Edge    | ✅   | ✅    | ✅     |
| Firefox | ✅   | ⚠️    | ✅     |
| Safari  | ✅   | ⚠️    | ✅     |
| Mobile Chrome | ✅ | ✅ | ✅  |

⚠️ Speech Recognition works best in Chrome/Edge

---

## 💡 TIPS

- **Voice commands**: "اردو بولو" (switch to Urdu), "speak english", "female voice", "male voice"
- **Agent name change**: "apna naam Jarvis rakh lo" → agent renames itself
- **Offline mode**: The UI works offline, AI needs internet
- **Multiple devices**: Log in from any device — same Firebase database

---

*Faraz Master v3.0 — Built with ❤️ for personal productivity*

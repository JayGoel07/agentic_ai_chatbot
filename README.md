# 🤖 Agentic AI Chat (MAPRA-node)

A clean, minimal **Agentic AI web application** built using **Node.js** and a custom agent framework. The project demonstrates how to design an AI research assistant with tool usage, multi-step reasoning cycles, and a modern chat-style UI.

---

## ✨ Features

* 🧠 **Agent-based architecture** with configurable reasoning cycles
* 🔧 **Tool calling support** (web search, summarization, etc.)
* 🌙 **Modern dark-themed UI** inspired by AI developer tools
* ⚡ **Asynchronous chat interface** with loading states
* 🔒 Internal agent metadata (cycles, tools) hidden from users

---

## 🛠️ Tech Stack

**Frontend**

* HTML, CSS (custom dark UI)
* Vanilla JavaScript (Fetch API)

**Backend**

* Node.js
* Express.js
* Custom Agent class (single-agent prototype)
* dotenv for environment configuration

**AI Models**

* Gemini / OpenAI (configurable via environment variables)

---

## 📂 Project Structure

```
├── public/
│   └── index.html        # Frontend UI
├── tools/
│   ├── webSearchTool.js
│   └── summarizeTool.js
├── agent.js              # Core agent logic
├── server.js             # Express server
├── .env                  # API keys & model config
└── README.md
```

---

## 🚀 How to Run

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file

```env
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
GEMINI_MODEL=your_model_name
```

3. Start the server

```bash
node server.js
```

4. Open in browser

```
http://localhost:3000
```

---

## 📌 Use Case

* AI research assistant
* Agentic AI learning project
* Resume-ready full-stack AI demo
* Base for multi-agent extensions

---

## 🔮 Future Enhancements

* Chat history & memory
* Streaming responses
* Multi-agent coordination
* Markdown rendering
* Authentication & sessions

---

Built with **Node.js**, **Agents**, and ❤️

# vagabond-bot

Ein lokaler RAG-Chatbot (Retrieval-Augmented Generation) über den Vagabond-Manga und Miyamoto Musashi.
Entwickelt im Rahmen eines Schulprojekts mit dem Ziel, die Funktionsweise von Large Language Models und Vektordatenbanken zu verstehen.

## Vorschau

> *"問え — Was willst du wissen, Wanderer?"*
Der Bot beantwortet Fragen über Miyamoto Musashi, den Vagabond-Manga von Takehiko Inoue, das Buch der Fünf Ringe, zentrale Charaktere und die Philosophie des Schwertes – ausschließlich auf Basis lokaler Ressourcen, ohne Cloud-APIs.

## Tech Stack

| Bereich | Technologie |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Python + FastAPI |
| KI-Engine | Ollama (lokal) |
| Sprachmodell | gemma3:4b |
| Embedding-Modell | nomic-embed-text |
| Vektordatenbank | ChromaDB |
| RAG-Framework | LangChain |

## Architektur
User
│
▼
React Frontend (Port 5173)
│  HTTP POST /ask
▼
FastAPI Backend (Port 8000)
│
├── PDF laden (PyPDFLoader)
├── Text in Chunks splitten (RecursiveCharacterTextSplitter)
├── Chunks embedden (nomic-embed-text via Ollama)
├── In ChromaDB speichern
│
└── Bei Anfrage:
├── Relevante Chunks suchen (Similarity Search)
├── Kontext + Frage an LLM senden (gemma3:4b via Ollama)
└── Antwort + Quellenangabe zurückgeben

## Voraussetzungen

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.11+
- [Ollama](https://ollama.com/) installiert und gestartet

## Installation & Setup

### 1. Repository klonen

```bash
git clone https://github.com/DEIN-USERNAME/vagabond-bot.git
cd vagabond-bot
```

### 2. Ollama Modelle laden

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

### 3. Backend einrichten

```bash
cd vagabond-backend

# Virtual Environment erstellen
python -m venv .venv

# Aktivieren (Mac/Linux)
source .venv/bin/activate

# Aktivieren (Windows)
.venv\Scripts\activate

# Abhängigkeiten installieren
pip install -r requirements.txt

# PDF-Wissensdatenbank ablegen
# → eigene PDF(s) in vagabond-backend/pdfs/ kopieren

# Server starten
uvicorn main:app --reload
```

### 4. Frontend einrichten

```bash
# Neues Terminal öffnen
cd vagabond-frontend

npm install
npm run dev
```

### 5. Anwendung öffnen
http://localhost:5173

## Projektstruktur
vagabond-bot/
│
├── vagabond-backend/
│   ├── main.py              # FastAPI Server + RAG Pipeline
│   ├── requirements.txt     # Python Abhängigkeiten
│   └── pdfs/                # Wissensdatenbank als PDF(s)
│
├── vagabond-frontend/
│   ├── src/
│   │   ├── App.tsx          # Hauptkomponente + Chat-Logik
│   │   ├── App.css          # Japanisches Tuschemalerei-Design
│   │   └── assets/          # Vagabond-Bilder
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md

## API Endpoints

| Method | Endpoint | Beschreibung |
|---|---|---|
| `GET` | `/health` | Server- und Pipeline-Status |
| `POST` | `/ask` | Frage stellen, Antwort + Quellen erhalten |
| `POST` | `/reload` | PDFs neu einlesen und Vector DB neu aufbauen |

### Beispiel `/ask`

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Wer ist Sasaki Kojiro?"}'
```

```json
{
  "answer": "Sasaki Kojiro ist Musashis größter Rivale...",
  "sources": ["vagabond_knowledge_v2.pdf (S. 6)"]
}
```

## Lizenz

Dieses Projekt wurde als Schulprojekt entwickelt und dient ausschließlich Lernzwecken.

*剣 — Der Weg des Schwertes beginnt mit einem einzigen Schritt.*
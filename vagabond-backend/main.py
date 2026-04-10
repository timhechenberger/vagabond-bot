from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

app = FastAPI(title="Vagabond Knowledge Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PDF_DIR    = Path("./pdfs")
CHROMA_DIR = Path("./chroma_db")
MODEL_NAME = "gemma3:4b"   # exakt so wie in: ollama list
EMBED_MODEL = "nomic-embed-text"

qa_chain = None

# ── Schemas ────────────────────────────────────────────────
class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: list[str] = []

# ── RAG Helpers ────────────────────────────────────────────
def load_pdfs():
    docs = []
    PDF_DIR.mkdir(exist_ok=True)
    for pdf_path in PDF_DIR.glob("*.pdf"):
        print(f"  Loading: {pdf_path.name}")
        loader = PyPDFLoader(str(pdf_path))
        docs.extend(loader.load())
    print(f"  → {len(docs)} Seiten geladen")
    return docs

def build_vectorstore(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=80,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_documents(docs)
    print(f"  → {len(chunks)} Chunks erstellt")

    embeddings = OllamaEmbeddings(model=EMBED_MODEL)
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
    )
    return vectorstore

def load_vectorstore():
    embeddings = OllamaEmbeddings(model=EMBED_MODEL)
    return Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings,
    )

def build_chain(vectorstore):
    llm = OllamaLLM(model=MODEL_NAME, temperature=0.3)

    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="""Du bist ein Experte über den Vagabond-Manga und Miyamoto Musashi.
Beantworte die Frage NUR auf Basis des folgenden Kontexts.
Antworte immer auf Deutsch. Wenn die Antwort nicht im Kontext steht, sage das ehrlich.

Kontext:
{context}

Frage: {question}
Antwort:"""
    )

    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt},
    )

# ── Startup ────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global qa_chain
    print("Starte RAG Pipeline...")

    if CHROMA_DIR.exists() and any(CHROMA_DIR.iterdir()):
        print("Lade bestehende Vector DB...")
        vectorstore = load_vectorstore()
    else:
        print("Baue neue Vector DB aus PDFs...")
        docs = load_pdfs()
        if not docs:
            print("WARNUNG: Keine PDFs in /pdfs gefunden!")
            return
        vectorstore = build_vectorstore(docs)

    qa_chain = build_chain(vectorstore)
    print("✓ Pipeline bereit!")

# ── Endpoints ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "pipeline_ready": qa_chain is not None}

@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    if not qa_chain:
        raise HTTPException(503, "Pipeline nicht bereit — PDFs in /pdfs ablegen und neu starten.")
    if not req.question.strip():
        raise HTTPException(400, "Frage darf nicht leer sein.")

    try:
        result = await asyncio.to_thread(qa_chain.invoke, {"query": req.question})
        sources = []
        for doc in result.get("source_documents", []):
            src  = doc.metadata.get("source", "")
            page = doc.metadata.get("page", "")
            if src:
                label = Path(src).name + (f" (S. {int(page)+1})" if page != "" else "")
                if label not in sources:
                    sources.append(label)
        return AskResponse(answer=result["result"], sources=sources)
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/reload")
async def reload():
    global qa_chain
    docs = load_pdfs()
    if not docs:
        raise HTTPException(404, "Keine PDFs gefunden.")
    vectorstore = build_vectorstore(docs)
    qa_chain = build_chain(vectorstore)
    return {"status": "neu geladen"}
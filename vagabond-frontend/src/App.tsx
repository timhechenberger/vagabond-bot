import { useState, useRef, useEffect } from "react";
import musashiInk from "./assets/vagabond_ink.jpg";
import musashiColor from "./assets/vagabond_peace.jpg";
import musashiDark from "./assets/vagabond_water.jpg";
import "./App.css";

const FAKE_RESPONSES = [
  "Miyamoto Musashi war ein legendärer Schwertkämpfer des frühen 17. Jahrhunderts. Er wurde 1584 in der Provinz Harima geboren und ist bekannt für seine Zwei-Schwerter-Technik, dem *Niten Ichi-ryū* Stil.",
  "Im Vagabond-Manga von Takehiko Inoue begleiten wir Musashi auf seinem Weg zur Erleuchtung – nicht nur als Kämpfer, sondern als Mensch. Seine Rivalität mit Sasaki Kojirō ist dabei von zentraler Bedeutung.",
  "Das Buch der Fünf Ringe (*Go Rin No Sho*) wurde von Musashi kurz vor seinem Tod im Jahr 1645 verfasst. Es ist eine Abhandlung über Strategie, Taktik und Philosophie.",
  "Sasaki Kojirō, auch bekannt als 'der Dämon des westlichen Landes', war Musashis größter Rivale. Im Manga wird er als gehörloser Genius dargestellt – eine künstlerische Freiheit Inoues.",
  "Die Yoshioka-Schule war eine der renommiertesten Schwertkampfschulen Kyotos. Musashi besiegte ihre Meister nacheinander – ein Ereignis, das ihn zur Legende machte.",
];

let fakeIndex = 0;

interface TypingMessageProps {
  text: string;
  onDone?: () => void;
}

interface Message {
  role: "bot" | "user";
  text: string;
  typing?: boolean;
}

function TypingMessage({ text, onDone }: TypingMessageProps) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(interval); onDone && onDone(); }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}<span className="cursor">|</span></span>;
}

function KanjiBackground() {
  const kanji = ["剣","道","武","士","心","無","敵","天","地","流","水","風","空","一","刀","断"];
  return (
    <div className="kanji-bg" aria-hidden="true">
      {kanji.map((k, i) => (
        <span key={i} className="kanji-char" style={{
          left: `${(i * 6.5) % 95}%`,
          top: `${(i * 11 + 5) % 90}%`,
          animationDelay: `${i * 0.4}s`,
          fontSize: `${1.5 + (i % 4) * 0.8}rem`,
          opacity: 0.04 + (i % 3) * 0.02,
        }}>{k}</span>
      ))}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "問え — Was willst du wissen, Wanderer? Ich kenne die Wege von Musashi Miyamoto und die Geheimnisse des Vagabond." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const images = [musashiInk, musashiColor, musashiDark];
  const captions = ["天下無双", "流浪の剣士", "無心の境地"];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    const timer = setInterval(() => setActiveImg(i => (i + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    const botText = FAKE_RESPONSES[fakeIndex % FAKE_RESPONSES.length];
    fakeIndex++;
    setLoading(false);
    setTyping(true);
    setMessages(prev => [...prev, { role: "bot", text: botText, typing: true }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTypingDone = () => {
    setTyping(false);
    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, typing: false } : m));
  };

  return (
    <div className="app">
      <KanjiBackground />

      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="logo-area">
            <div className="logo-jp">流浪人</div>
            <div className="logo-sub">VAGABOND</div>
            <svg className="brush-stroke" viewBox="0 0 200 8" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,4 Q30,1 60,4 Q90,7 120,3 Q150,0 180,4 Q190,5 200,4"
                stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>

          <div className="portrait-gallery">
            {images.map((img, i) => (
              <div key={i} className={`portrait-wrap ${i === activeImg ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                <img src={img} alt={`Musashi ${i}`} className="portrait-img" />
                <div className="portrait-caption">{captions[i]}</div>
              </div>
            ))}
          </div>

          <div className="sidebar-quote">
            <p>"Geh weiter,<br/>bis du dein Ziel erreichst."</p>
            <span>— Miyamoto Musashi</span>
          </div>

          <div className="sidebar-info">
            <div className="info-item"><span className="info-dot" /><span>Takehiko Inoue Manga</span></div>
            <div className="info-item"><span className="info-dot" /><span>Historisches Japan, Edo-Zeit</span></div>
            <div className="info-item"><span className="info-dot" /><span>RAG-gestützt mit Ollama</span></div>
          </div>
        </div>
      </aside>

      <main className="chat-area">
        <header className="chat-header">
          <div className="header-left">
            <span className="header-kanji">武蔵</span>
            <div>
              <div className="header-title">Musashi Knowledge Bot</div>
              <div className="header-sub">Wanderer auf dem Weg des Schwertes</div>
            </div>
          </div>
          <div className="header-status">
            <span className="status-dot" /><span>Bereit</span>
          </div>
        </header>

        <div className="messages-container">
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                {msg.role === "bot" && <div className="avatar bot-avatar">武</div>}
                <div className={`bubble ${msg.role}`}>
                  {msg.typing
                    ? <TypingMessage text={msg.text} onDone={handleTypingDone} />
                    : msg.text}
                  {msg.role === "bot" && !msg.typing && (
                    <div className="source-tag">📜 Vagabond Wissen</div>
                  )}
                </div>
                {msg.role === "user" && <div className="avatar user-avatar">問</div>}
              </div>
            ))}
            {loading && (
              <div className="message-row bot">
                <div className="avatar bot-avatar">武</div>
                <div className="bubble bot loading-bubble">
                  <span className="dot"/><span className="dot"/><span className="dot"/>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stelle deine Frage über Musashi, Vagabond oder den Weg des Schwertes..."
              rows={1}
              disabled={loading || typing}
              className="chat-input"
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading || typing} className="send-btn">
              <span>剣</span>
            </button>
          </div>
          <div className="input-hint">Enter zum Senden · Shift+Enter für neue Zeile</div>
        </div>
      </main>
    </div>
  );
}
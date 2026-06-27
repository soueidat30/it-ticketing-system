import { useState, useEffect, useRef } from "react";
import "./AIChatbot.css";

const BASE = "http://127.0.0.1:8000/api";

const SUGGESTIONS = [
  "How do I connect to VPN?",
  "My email isn't working",
  "I need access to a shared drive",
  "How to reset my password?",
  "Laptop running slow — what do I do?",
];

function TypingDots() {
  return (
    <div className="ai-typing">
      <span /><span /><span />
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`ai-msg ${isUser ? "ai-msg--user" : "ai-msg--bot"}`}>
      {!isUser && (
        <div className="ai-msg__avatar">
          <i className="ti ti-cpu" />
        </div>
      )}
      <div className="ai-msg__bubble">
        {msg.typing ? <TypingDots /> : (
          <div
            className="ai-msg__text"
            dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br/>") }}
          />
        )}
        {msg.timestamp && (
          <span className="ai-msg__time">{msg.timestamp}</span>
        )}
      </div>
    </div>
  );
}

export default function AIChatbot() {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your IT Assistant 👋\n\nI can help you troubleshoot issues, suggest ticket priorities, or answer common IT questions.\n\nWhat can I help you with today?",
      timestamp: getTime(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(true);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const tokenRef  = useRef(localStorage.getItem("token"));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setShowSugg(false);

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userText,
      timestamp: getTime(),
    };

    setMessages(prev => [...prev, userMsg]);

    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, role: "assistant", typing: true }]);
    setLoading(true);

    try {
      // Build history (exclude the typing placeholder)
      const history = messages
        .filter(m => !m.typing)
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      // Call YOUR Laravel backend → which calls Ollama
      const res = await fetch(`${BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: userText,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Server error");
      }

      const reply = data.reply || "I couldn't generate a response. Please try again.";

      setMessages(prev =>
        prev.map(m =>
          m.id === typingId
            ? { id: typingId, role: "assistant", content: reply, timestamp: getTime() }
            : m
        )
      );
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages(prev =>
        prev.map(m =>
          m.id === typingId
            ? {
                id: typingId,
                role: "assistant",
                content: "The AI service is temporarily unavailable. Make sure Ollama is running (`ollama serve`) and try again.\n\n🎫 I recommend creating a ticket for this.",
                timestamp: getTime(),
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: "assistant",
      content: "Chat cleared! How can I help you? 👋",
      timestamp: getTime(),
    }]);
    setShowSugg(true);
  };

  return (
    <>
      {/* ── Trigger box in sidebar ── */}
      <div className="ai-help-box" onClick={() => setOpen(true)}>
        <div className="ai-help-box__icon">
          <i className="ti ti-cpu" />
          <span className="ai-help-box__pulse" />
        </div>
        <div className="ai-help-box__text">
          <span className="ai-help-box__title">IT Assistant</span>
          <span className="ai-help-box__sub">Ask me anything • Ollama AI</span>
        </div>
        <button className="ai-help-box__btn" onClick={() => setOpen(true)}>
          <i className="ti ti-message-circle" />
          Chat
        </button>
      </div>

      {/* ── Chat panel ── */}
      {open && (
        <div className="ai-panel-overlay" onClick={() => setOpen(false)}>
          <div className="ai-panel" onClick={e => e.stopPropagation()}>

            {/* header */}
            <div className="ai-panel__header">
              <div className="ai-panel__header-left">
                <div className="ai-panel__avatar">
                  <i className="ti ti-cpu" />
                  <span className="ai-panel__online" />
                </div>
                <div>
                  <p className="ai-panel__name">IT Assistant</p>
                  <p className="ai-panel__status">
                    <span className="ai-panel__status-dot" />
                    Powered by Ollama (local AI)
                  </p>
                </div>
              </div>
              <div className="ai-panel__header-right">
                <button className="ai-panel__icon-btn" onClick={clearChat} title="Clear chat">
                  <i className="ti ti-eraser" />
                </button>
                <button className="ai-panel__icon-btn" onClick={() => setOpen(false)} title="Close">
                  <i className="ti ti-x" />
                </button>
              </div>
            </div>

            {/* messages */}
            <div className="ai-panel__body">
              {messages.map(msg => (
                <Message key={msg.id} msg={msg} />
              ))}

              {showSugg && (
                <div className="ai-suggestions">
                  <p className="ai-suggestions__label">Try asking:</p>
                  <div className="ai-suggestions__chips">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        className="ai-suggestion-chip"
                        onClick={() => sendMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="ai-panel__footer">
              <div className="ai-panel__input-wrap">
                <textarea
                  ref={inputRef}
                  className="ai-panel__input"
                  placeholder="Describe your IT issue…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  disabled={loading}
                />
                <button
                  className="ai-panel__send"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  title="Send (Enter)"
                >
                  {loading
                    ? <i className="ti ti-loader ai-spin" />
                    : <i className="ti ti-send" />
                  }
                </button>
              </div>
              <p className="ai-panel__hint">Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
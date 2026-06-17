import { Bot, Send, X } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { apiRequest } from "../services/api.js";

const quickPrompts = [
  "Suggest snacks under Rs 150",
  "How do I track my order?",
  "How do I raise a ticket?"
];

export default function ChatBot() {
  const { token } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I can help with products, cart, payments, order tracking, and support tickets."
    }
  ]);

  const sendMessage = async (content) => {
    const text = content.trim();
    if (!text || isSending) return;

    setMessages((current) => [...current, { role: "user", content: text }]);
    setMessage("");
    setError("");
    setIsSending(true);

    try {
      const data = await apiRequest("/chat", {
        method: "POST",
        token,
        body: JSON.stringify({ message: text })
      });
      setMessages((current) => [...current, { role: "assistant", content: data.reply || "I could not prepare a response right now." }]);
    } catch (requestError) {
      setError(requestError.message || "Chat service unavailable");
      setMessages((current) => [...current, { role: "assistant", content: "Chat is temporarily unavailable. You can still raise a support ticket from My console." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chatBot">
      {isOpen && (
        <section className="chatPanel" aria-label="VDelivery chat assistant">
          <div className="chatHeader">
            <div>
              <span>VDelivery assistant</span>
              <strong>Quick help</strong>
            </div>
            <button className="iconButton" type="button" aria-label="Close chat" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chatMessages">
            {messages.map((item, index) => (
              <div className={item.role === "user" ? "chatBubble user" : "chatBubble assistant"} key={`${item.role}-${index}`}>
                {item.content}
              </div>
            ))}
            {isSending && <div className="chatBubble assistant">Typing...</div>}
          </div>

          <div className="quickPrompts">
            {quickPrompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => sendMessage(prompt)} disabled={isSending}>
                {prompt}
              </button>
            ))}
          </div>

          {error && <p className="chatError">{error}</p>}

          <form
            className="chatForm"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(message);
            }}
          >
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about products or orders" />
            <button className="primaryButton" type="submit" disabled={isSending || !message.trim()} aria-label="Send chat message">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}
      <button className="chatToggle" type="button" aria-label="Open chat assistant" onClick={() => setIsOpen((current) => !current)}>
        <Bot size={22} />
      </button>
    </div>
  );
}

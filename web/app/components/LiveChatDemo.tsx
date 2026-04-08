"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  isTyping?: boolean;
}

const DEMO_STEPS = [
  { delay: 1000, type: "user" as const, content: "Explain 'serendipity'" },
  { delay: 2000, type: "typing" as const, duration: 2500 },
  {
    delay: 0,
    type: "bot" as const,
    content: `🎯 **serendipity** — *noun*

**Meaning**: Finding something good without looking for it.

💡 *Memory tip*: Think "serene dip" into luck — calm, unexpected treasure.

📝 *Example*: "Finding my favorite coffee shop while lost was pure serendipity."

🔗 *Synonyms*: luck, coincidence, fortune
📊 *IELTS Level*: Band 7+`,
  },
];

export function LiveChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      let accumulatedDelay = 500;

      DEMO_STEPS.forEach((step) => {
        const timeout = setTimeout(() => {
          if (step.type === "typing") {
            setMessages((prev) => [
              ...prev,
              { id: `typing-${Date.now()}`, type: "bot", content: "", isTyping: true },
            ]);
            setTimeout(() => {
              setMessages((prev) => prev.filter((m) => !m.isTyping));
            }, step.duration || 2000);
          } else {
            setMessages((prev) => [
              ...prev,
              { id: `${step.type}-${Date.now()}`, type: step.type, content: step.content },
            ]);
          }
        }, accumulatedDelay);

        accumulatedDelay += step.delay;
        return () => clearTimeout(timeout);
      });
    }
  }, [hasStarted]);

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const boldMatch = line.match(/\*\*(.*?)\*\*/g);
      if (boldMatch) {
        let formatted = line;
        boldMatch.forEach((match) => {
          formatted = formatted.replace(match, `<strong>${match.slice(2, -2)}</strong>`);
        });
        return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return (
        <p key={i} className={`mb-1 ${line.startsWith("  ") ? "pl-2 text-slate-300" : ""}`}>
          {line}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative w-full max-w-md"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-cyan-500/30 rounded-2xl blur-xl" />

      {/* Phone frame */}
      <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 bg-slate-900/80">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Lexify Bot</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.type === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === "user"
                        ? "bg-slate-700"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="w-4 h-4 text-slate-300" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm ${
                      message.type === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-slate-800 text-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center gap-1 py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span className="text-slate-400">typing...</span>
                      </div>
                    ) : (
                      formatContent(message.content)
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-900/80">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2 border border-slate-700/50">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none"
              readOnly
            />
            <button className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

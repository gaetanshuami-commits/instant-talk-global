"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Plus, X, Loader2, MessageSquare } from "lucide-react";

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
};

type Room = { id: string; name: string; color: string; messages: { text: string; createdAt: string }[] };
type Message = { id: string; author: string; text: string; lang?: string | null; mine: boolean; createdAt: string };

const COLORS = ["#6366f1","#06b6d4","#a855f7","#10b981","#f59e0b","#ec4899"];

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRooms = async () => {
    const r = await fetch("/api/chat/rooms");
    if (r.ok) {
      const d = await r.json();
      setRooms(d.rooms);
      if (!activeRoomId && d.rooms.length > 0) setActiveRoomId(d.rooms[0].id);
    }
    setLoadingRooms(false);
  };

  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (r.ok) setMessages((await r.json()).messages);
    } finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    // Poll every 3s for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(activeRoomId), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRoomId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoomId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    // Optimistic update
    const tmp: Message = { id: `tmp-${Date.now()}`, author: "Moi", text, mine: true, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tmp]);
    try {
      await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: "Moi", text, mine: true }),
      });
    } finally { setSending(false); }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const color = COLORS[rooms.length % COLORS.length];
    const r = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoomName, color }),
    });
    if (r.ok) {
      const d = await r.json();
      await loadRooms();
      setActiveRoomId(d.room.id);
      setShowNewRoom(false);
      setNewRoomName("");
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", height: "calc(100vh - 120px)", display: "flex", gap: "16px" }}>
      {/* Sidebar */}
      <div style={{ ...CARD, width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: "15px" }}>Messagerie</div>
            <button onClick={() => setShowNewRoom(true)} style={{ width: 28, height: 28, borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loadingRooms ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px", opacity: 0.4 }}><Loader2 size={20} /></div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 16px", opacity: 0.45, fontSize: "13px" }}>
              Aucune conversation.<br />Cliquez sur + pour en créer une.
            </div>
          ) : rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              style={{ width: "100%", borderRadius: "12px", padding: "11px 12px", border: "1px solid transparent", background: activeRoomId === room.id ? "rgba(99,102,241,0.12)" : "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px", borderColor: activeRoomId === room.id ? "rgba(99,102,241,0.25)" : "transparent" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${room.color}22`, border: `1px solid ${room.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: room.color }}>
                <MessageSquare size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</div>
                <div style={{ fontSize: "11px", opacity: 0.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                  {room.messages[0]?.text ?? "Aucun message"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div style={{ ...CARD, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!activeRoom ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, flexDirection: "column", gap: "12px" }}>
            <MessageSquare size={40} strokeWidth={1.2} />
            <div style={{ fontSize: "15px", fontWeight: 600 }}>Sélectionnez ou créez une conversation</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${activeRoom.color}22`, border: `1px solid ${activeRoom.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: activeRoom.color }}>
                <MessageSquare size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px" }}>{activeRoom.name}</div>
                <div style={{ fontSize: "11px", opacity: 0.45 }}>Traduction instantanée activée</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {loadingMsgs && messages.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", opacity: 0.4 }}><Loader2 size={20} /></div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", opacity: 0.4, fontSize: "14px", marginTop: "40px" }}>Aucun message. Démarrez la conversation.</div>
              ) : messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.mine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%" }}>
                    {!msg.mine && (
                      <div style={{ fontSize: "11px", opacity: 0.5, marginBottom: "4px", paddingLeft: "4px" }}>{msg.author} {msg.lang ? `· ${msg.lang}` : ""}</div>
                    )}
                    <div style={{ padding: "10px 14px", borderRadius: msg.mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.mine ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "rgba(255,255,255,0.07)", border: msg.mine ? "none" : "1px solid rgba(255,255,255,0.08)", fontSize: "14px", lineHeight: 1.5, color: "white" }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: "10px", opacity: 0.4, marginTop: "4px", textAlign: msg.mine ? "right" : "left", paddingLeft: msg.mine ? 0 : "4px" }}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "10px", flexShrink: 0 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Votre message..."
                style={{ flex: 1, height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 14px", fontSize: "14px", outline: "none" }}
              />
              <button type="submit" disabled={!input.trim() || sending} style={{ width: 44, height: 44, borderRadius: "12px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", cursor: input.trim() ? "pointer" : "not-allowed", opacity: input.trim() ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>

      {/* New room modal */}
      {showNewRoom && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ ...CARD, width: "100%", maxWidth: "380px", margin: "0 20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "20px" }}>Nouvelle conversation</h2>
              <button onClick={() => setShowNewRoom(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={createRoom} style={{ display: "grid", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "5px", fontWeight: 600 }}>Nom du canal *</div>
                <input required value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="ex: Equipe Marketing" style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 12px", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button type="submit" style={{ height: "42px", borderRadius: "11px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginTop: "4px" }}>
                Créer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

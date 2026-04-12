"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Video, MessageSquare, Star, X, Loader2, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
};

type Contact = {
  id: string; name: string; email: string;
  company?: string | null; role?: string | null; lang?: string | null;
  color: string; starred: boolean; online: boolean;
};

const COLORS = ["#6366f1","#06b6d4","#a855f7","#10b981","#f59e0b","#ec4899","#14b8a6","#8b5cf6"];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
}

function Avatar({ c, size = 48 }: { c: Contact; size?: number }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.35, background: `linear-gradient(135deg, ${c.color}, ${c.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.38, color: "white", boxShadow: `0 4px 16px ${c.color}44` }}>
        {initials(c.name)}
      </div>
      {c.online && (
        <div style={{ position: "absolute", bottom: 1, right: 1, width: size * 0.25, height: size * 0.25, borderRadius: "50%", background: "#22c55e", border: "2px solid #04070f", boxShadow: "0 0 6px #22c55e" }} />
      )}
    </div>
  );
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", lang: "" });

  const DEMO: Contact[] = [
    { id: "d1", name: "Marie Dubois",     email: "marie@acme.fr",         company: "Acme Corp",       role: "Directrice",  lang: "fr", color: "#6366f1", starred: true,  online: true  },
    { id: "d2", name: "Kenji Tanaka",     email: "kenji@global-jp.co",    company: "Global JP",       role: "CEO",         lang: "ja", color: "#06b6d4", starred: true,  online: false },
    { id: "d3", name: "Amara Osei",       email: "amara@nairobi-hub.ke",  company: "Nairobi Hub",     role: "Partenaire",  lang: "sw", color: "#10b981", starred: false, online: true  },
    { id: "d4", name: "Laura Schmidt",    email: "laura@techberlin.de",   company: "Tech Berlin",     role: "Ingénieure",  lang: "de", color: "#a855f7", starred: false, online: false },
    { id: "d5", name: "Ahmed Al-Rashid",  email: "ahmed@mena-invest.ae",  company: "MENA Invest",     role: "Investisseur",lang: "ar", color: "#f59e0b", starred: false, online: true  },
    { id: "d6", name: "Sofia Rossi",      email: "sofia@milano-design.it",company: "Milano Design",   role: "Designer",    lang: "it", color: "#ec4899", starred: false, online: false },
  ];

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/contacts");
      if (r.ok) {
        const data = await r.json();
        setContacts(data.contacts?.length ? data.contacts : DEMO);
      } else {
        setContacts(DEMO);
      }
    } catch { setContacts(DEMO); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = contacts.filter(c =>
    !search || [c.name, c.email, c.company ?? ""].some(s => s.toLowerCase().includes(search.toLowerCase()))
  );
  const starred = filtered.filter(c => c.starred);
  const others  = filtered.filter(c => !c.starred);

  const toggleStar = async (c: Contact) => {
    setContacts(prev => prev.map(x => x.id === c.id ? { ...x, starred: !x.starred } : x));
    await fetch(`/api/contacts/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: !c.starred }) });
  };

  const remove = async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const color = COLORS[contacts.length % COLORS.length];
      const r = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, color }) });
      if (r.ok) { await load(); setShowAdd(false); setForm({ name: "", email: "", company: "", role: "", lang: "" }); }
    } finally { setSaving(false); }
  };

  function ContactCard({ c }: { c: Contact }) {
    return (
      <div style={{ ...CARD, padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
        <Avatar c={c} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            {c.name}
            {c.online && <span style={{ fontSize: "10px", background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "2px 7px", borderRadius: "999px", fontWeight: 700 }}>En ligne</span>}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.55, marginTop: "2px" }}>
            {c.company ? `${c.role ? c.role + " · " : ""}${c.company}` : c.email}
          </div>
          {c.lang && <div style={{ fontSize: "11px", opacity: 0.4, marginTop: "2px" }}>{c.lang}</div>}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => toggleStar(c)} style={{ width: 32, height: 32, borderRadius: "9px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: c.starred ? "#fbbf24" : "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={14} fill={c.starred ? "#fbbf24" : "none"} />
          </button>
          <button onClick={() => router.push(`/room/meeting-${c.id.slice(-6)}?host=1`)} style={{ width: 32, height: 32, borderRadius: "9px", border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Video size={13} />
          </button>
          <button onClick={() => router.push("/dashboard/chat")} style={{ width: 32, height: 32, borderRadius: "9px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={13} />
          </button>
          <button onClick={() => remove(c.id)} style={{ width: 32, height: 32, borderRadius: "9px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "rgba(239,68,68,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "7px", fontWeight: 600 }}>CONTACTS</div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ height: "38px", display: "flex", alignItems: "center", gap: "9px", padding: "0 14px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search size={14} opacity={0.45} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: "none", border: "none", outline: "none", color: "white", fontSize: "13.5px", width: "180px" }} />
          </div>
          <button onClick={() => setShowAdd(true)} style={{ height: "38px", padding: "0 16px", borderRadius: "10px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}><Loader2 size={28} /></div>
      ) : contacts.length === 0 && !search ? (
        <div style={{ ...CARD, padding: "60px", textAlign: "center", opacity: 0.5 }}>
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}><Users2 size={36} opacity={0.4} /></div>
          <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "6px" }}>Aucun contact</div>
          <div style={{ fontSize: "14px" }}>Ajoutez votre premier contact pour commencer.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {starred.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.4, letterSpacing: "0.12em", marginBottom: "10px" }}>FAVORIS</div>
              <div style={{ display: "grid", gap: "8px" }}>{starred.map(c => <ContactCard key={c.id} c={c} />)}</div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              {starred.length > 0 && <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.4, letterSpacing: "0.12em", marginBottom: "10px", marginTop: "8px" }}>TOUS LES CONTACTS</div>}
              <div style={{ display: "grid", gap: "8px" }}>{others.map(c => <ContactCard key={c.id} c={c} />)}</div>
            </div>
          )}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px", opacity: 0.4 }}>Aucun résultat pour "{search}"</div>}
        </div>
      )}

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ ...CARD, width: "100%", maxWidth: "440px", margin: "0 20px", padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px" }}>Nouveau contact</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={addContact} style={{ display: "grid", gap: "12px" }}>
              {([["name","Nom complet",true],["email","Email",true],["company","Entreprise",false],["role","Poste",false],["lang","Langue (ex: Francais)"]] as const).map(([k, lbl, req]) => (
                <div key={k}>
                  <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "5px", fontWeight: 600 }}>{lbl}{req && " *"}</div>
                  <input required={req} value={form[k as keyof typeof form]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 12px", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button type="submit" disabled={saving} style={{ marginTop: "8px", height: "44px", borderRadius: "12px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {saving && <Loader2 size={16} />}
                {saving ? "Enregistrement..." : "Ajouter le contact"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

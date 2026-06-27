import { useState } from "react";

// ── Design tokens ───────────────────────────────────────────────────
// Palette: deep space black + electric violet + ghost white
// Signature: pulsing "AI consensus" status ring on job cards
// Type: mono for addresses/IDs, clean sans for copy
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
const STUDIO_URL = "https://studio.genlayer.com";

const STATUS_META = {
  open:      { label: "Open",      color: "#6C63FF", bg: "rgba(108,99,255,0.12)" },
  submitted: { label: "Evaluating", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", pulse: true },
  approved:  { label: "Approved",  color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  disputed:  { label: "Disputed",  color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  refunded:  { label: "Refunded",  color: "#8B8FA8", bg: "rgba(139,143,168,0.12)" },
};

// ── Mock data for demo (replace with real GenLayer JS calls) ────────
const MOCK_JOBS = [
  {
    job_id: "0",
    client:  "0x86B2...366a",
    agent:   "0xAb5C...9F3d",
    amount_gwei: "1000000000000000000",
    brief: "Build a React landing page for a DeFi product. Must include a hero section, feature grid, and working wallet connect button. Deploy to Vercel and submit the live URL.",
    deliverable_url: "https://my-defi-app.vercel.app",
    status: "approved",
    verdict: "APPROVED",
    reasoning: "The submitted URL contains a complete React landing page with hero, feature grid, and MetaMask wallet connect functionality as specified.",
  },
  {
    job_id: "1",
    client:  "0x86B2...366a",
    agent:   "0xCd3E...1A2f",
    amount_gwei: "500000000000000000",
    brief: "Write a technical article (min 1000 words) explaining how GenLayer's Optimistic Democracy consensus works. Submit on Mirror.xyz or a public blog.",
    deliverable_url: "",
    status: "open",
    verdict: "",
    reasoning: "",
  },
  {
    job_id: "2",
    client:  "0x31F7...aB2c",
    agent:   "0x86B2...366a",
    amount_gwei: "2000000000000000000",
    brief: "Develop a Python data scraper that collects pricing data from 3 e-commerce sites and outputs a clean CSV. Must include error handling and README.",
    deliverable_url: "https://github.com/agent/price-scraper",
    status: "submitted",
    verdict: "",
    reasoning: "",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────
function formatGEN(gwei) {
  if (!gwei) return "0";
  return (Number(gwei) / 1e18).toFixed(2) + " GEN";
}
function shortAddr(addr) {
  if (!addr) return "";
  return addr.length > 12 ? addr.slice(0, 6) + "…" + addr.slice(-4) : addr;
}

// ── Components ──────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.open;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 20,
      background: m.bg, color: m.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
    }}>
      {m.pulse && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: m.color, display: "inline-block",
          animation: "pulse 1.4s ease-in-out infinite",
        }} />
      )}
      {m.label}
    </span>
  );
}

function JobCard({ job, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const amount = formatGEN(job.amount_gwei);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "20px 22px",
      cursor: "pointer",
      transition: "border-color 0.15s",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
    onClick={() => setExpanded(v => !v)}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#6C63FF" }}>#{job.job_id}</span>
            <StatusBadge status={job.status} />
          </div>
          <p style={{
            color: "#E8E8F0", fontSize: 14, lineHeight: 1.5, margin: 0,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: expanded ? 100 : 2,
            WebkitBoxOrient: "vertical",
          }}>{job.brief}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: "#6C63FF", fontSize: 18, fontWeight: 700 }}>{amount}</div>
          <div style={{ color: "#8B8FA8", fontSize: 11, marginTop: 2 }}>escrowed</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 14 }}>
            <InfoRow label="Client" value={shortAddr(job.client)} mono />
            <InfoRow label="Agent" value={shortAddr(job.agent)} mono />
            {job.deliverable_url && (
              <InfoRow label="Deliverable" value={
                <a href={job.deliverable_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#6C63FF", textDecoration: "none" }}
                  onClick={e => e.stopPropagation()}>
                  View link ↗
                </a>
              } />
            )}
            {job.verdict && <InfoRow label="AI verdict" value={job.verdict} />}
          </div>

          {job.reasoning && (
            <div style={{
              background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: 10, padding: "10px 14px",
            }}>
              <div style={{ color: "#8B8FA8", fontSize: 11, marginBottom: 4 }}>AI reasoning</div>
              <p style={{ color: "#C8C8D8", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{job.reasoning}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }} onClick={e => e.stopPropagation()}>
            {job.status === "disputed" && (
              <ActionBtn color="#10B981" onClick={() => onAction("approve", job.job_id)}>
                Approve & pay agent
              </ActionBtn>
            )}
            {job.status === "open" && (
              <ActionBtn color="#EF4444" onClick={() => onAction("refund", job.job_id)}>
                Cancel & refund
              </ActionBtn>
            )}
            {job.status === "submitted" && (
              <div style={{ color: "#F59E0B", fontSize: 13 }}>
                ⏳ AI validators are reviewing the deliverable…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div>
      <div style={{ color: "#8B8FA8", fontSize: 11, marginBottom: 3 }}>{label}</div>
      <div style={{ color: "#E8E8F0", fontSize: 13, fontFamily: mono ? "monospace" : "inherit" }}>
        {value}
      </div>
    </div>
  );
}

function ActionBtn({ color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: `1px solid ${color}`,
      color: color, borderRadius: 8, padding: "7px 16px",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      transition: "background 0.15s",
      fontFamily: "inherit",
    }}
    onMouseEnter={e => e.currentTarget.style.background = color + "22"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {children}
    </button>
  );
}

function PostJobModal({ onClose, onPost }) {
  const [agent, setAgent] = useState("");
  const [brief, setBrief] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!agent || !brief || !amount) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate tx
    onPost({ agent, brief, amount });
    setLoading(false);
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 20,
    }}>
      <div style={{
        background: "#0E0E1A", border: "1px solid rgba(108,99,255,0.3)",
        borderRadius: 20, padding: "28px 28px", width: "100%", maxWidth: 500,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ color: "#E8E8F0", fontWeight: 600, fontSize: 18, margin: 0 }}>Post a job</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B8FA8", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <Field label="Agent wallet address">
          <input value={agent} onChange={e => setAgent(e.target.value)}
            placeholder="0x..."
            style={inputStyle} />
        </Field>

        <Field label={`Job brief (${brief.length}/2000)`}>
          <textarea value={brief} onChange={e => setBrief(e.target.value)}
            placeholder="Describe exactly what needs to be delivered. Be specific — the AI validators will evaluate the deliverable against this brief."
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        <Field label="Payment amount (GEN)">
          <input value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 1.5"
            type="number" step="0.01"
            style={inputStyle} />
        </Field>

        <div style={{
          background: "rgba(108,99,255,0.08)", borderRadius: 10,
          padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#8B8FA8", lineHeight: 1.6,
        }}>
          💡 When the agent submits their work, 5 GenLayer AI validators will fetch the deliverable URL and vote on whether it meets your brief. Payment releases automatically on consensus approval.
        </div>

        <button onClick={handleSubmit} disabled={loading || !agent || !brief || !amount}
          style={{
            width: "100%", padding: "12px", borderRadius: 10,
            background: loading ? "rgba(108,99,255,0.4)" : "#6C63FF",
            color: "#fff", border: "none", fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            transition: "background 0.15s",
          }}>
          {loading ? "Sending transaction…" : "Lock payment & post job"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#8B8FA8", fontSize: 12, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  color: "#E8E8F0", padding: "10px 12px", fontSize: 14,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [showPost, setShowPost] = useState(false);
  const [tab, setTab] = useState("all");
  const [toast, setToast] = useState(null);

  function showToast(msg, color = "#10B981") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  }

  function handleAction(action, jobId) {
    setJobs(prev => prev.map(j => {
      if (j.job_id !== jobId) return j;
      if (action === "approve") {
        showToast("Payment released to agent ✓");
        return { ...j, status: "approved", verdict: "APPROVED", reasoning: "Manually approved by client" };
      }
      if (action === "refund") {
        showToast("Refund sent to your wallet ✓");
        return { ...j, status: "refunded" };
      }
      return j;
    }));
  }

  function handlePost({ agent, brief, amount }) {
    const newJob = {
      job_id: String(jobs.length),
      client: "0x86B2...366a",
      agent,
      amount_gwei: String(Math.round(parseFloat(amount) * 1e18)),
      brief,
      deliverable_url: "",
      status: "open",
      verdict: "",
      reasoning: "",
    };
    setJobs(prev => [newJob, ...prev]);
    showToast("Job posted & payment locked ✓");
  }

  const filtered = tab === "all" ? jobs : jobs.filter(j => j.status === tab);
  const totalEscrowed = jobs.filter(j => ["open","submitted"].includes(j.status))
    .reduce((s, j) => s + Number(j.amount_gwei), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; color: #E8E8F0; font-family: 'Inter', sans-serif; min-height: 100vh; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: "rgba(8,8,16,0.9)",
        backdropFilter: "blur(12px)", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #6C63FF, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AgentEscrow</div>
            <div style={{ fontSize: 10, color: "#8B8FA8" }}>Powered by GenLayer AI Consensus</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer"
            style={{ color: "#8B8FA8", fontSize: 12, textDecoration: "none" }}>
            Studio ↗
          </a>
          <div style={{
            background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)",
            borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#A78BFA",
          }}>
            0x86B2…366a
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total jobs", value: jobs.length },
            { label: "Active escrow", value: (totalEscrowed / 1e18).toFixed(2) + " GEN" },
            { label: "Completed", value: jobs.filter(j => j.status === "approved").length },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ color: "#8B8FA8", fontSize: 11, marginBottom: 6 }}>{s.label}</div>
              <div style={{ color: "#E8E8F0", fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab bar + post button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["all","open","submitted","approved","disputed"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? "rgba(108,99,255,0.2)" : "transparent",
                border: tab === t ? "1px solid rgba(108,99,255,0.4)" : "1px solid transparent",
                color: tab === t ? "#A78BFA" : "#8B8FA8",
                borderRadius: 8, padding: "5px 12px", fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
                textTransform: "capitalize",
              }}>{t}</button>
            ))}
          </div>
          <button onClick={() => setShowPost(true)} style={{
            background: "#6C63FF", border: "none",
            color: "#fff", borderRadius: 10, padding: "8px 18px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            + Post job
          </button>
        </div>

        {/* Job list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 20px",
              color: "#8B8FA8", fontSize: 14,
            }}>
              No jobs here yet. Post one to get started.
            </div>
          ) : filtered.map(job => (
            <JobCard key={job.job_id} job={job} onAction={handleAction} />
          ))}
        </div>

        {/* How it works */}
        <div style={{
          marginTop: 40, padding: "20px 22px",
          background: "rgba(108,99,255,0.06)",
          border: "1px solid rgba(108,99,255,0.15)",
          borderRadius: 16,
        }}>
          <div style={{ color: "#A78BFA", fontWeight: 600, fontSize: 13, marginBottom: 14 }}>
            How AI consensus escrow works
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["1. Client posts a job", "Writes a natural-language brief and locks GEN payment on-chain."],
              ["2. Agent submits work", "Shares a public URL — GitHub repo, doc, site, anything accessible."],
              ["3. Validators fetch & reason", "5 GenLayer AI nodes fetch the URL live and vote on whether it meets the brief."],
              ["4. Payment releases", "APPROVED → agent is paid instantly. DISPUTED → client can manually resolve."],
            ].map(([title, desc]) => (
              <div key={title}>
                <div style={{ color: "#E8E8F0", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{title}</div>
                <div style={{ color: "#8B8FA8", fontSize: 12, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showPost && <PostJobModal onClose={() => setShowPost(false)} onPost={handlePost} />}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "#0E0E1A", border: `1px solid ${toast.color}`,
          color: toast.color, borderRadius: 12, padding: "12px 18px",
          fontSize: 13, fontWeight: 500, zIndex: 200,
          boxShadow: `0 0 20px ${toast.color}33`,
        }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef } from "react";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #07080D; --bg2: #0E0F17; --bg3: #161825;
    --border: rgba(201,168,76,0.15); --gold: #C9A84C; --gold2: #F0D080;
    --cream: #F5EDD6; --muted: rgba(245,237,214,0.45); --danger: #E05C5C;
  }
  html, body { background: var(--bg); color: var(--cream); font-family: 'Outfit', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }
  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.35;
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade-up { animation: fadeUp 0.6s ease forwards; }
  .fade-up-2 { animation: fadeUp 0.6s 0.15s ease both; }
  .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
  .fade-up-4 { animation: fadeUp 0.6s 0.45s ease both; }
  textarea { resize: vertical; }
  .gold-text {
    background: linear-gradient(135deg, var(--gold), var(--gold2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
`;

async function callClaude(systemPrompt, userPrompt, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

const Spinner = () => (
  <div style={{ width: 22, height: 22, border: "2px solid rgba(201,168,76,0.3)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
);

const GoldButton = ({ onClick, disabled, children, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "rgba(201,168,76,0.2)" : "linear-gradient(135deg, #C9A84C, #F0D080)",
    color: disabled ? "rgba(245,237,214,0.4)" : "#07080D",
    border: "none", borderRadius: 10, padding: "12px 28px",
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s", ...style
  }}>{children}</button>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, ...style }}>{children}</div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {label && <label style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--cream)", fontFamily: "'Outfit', sans-serif", fontSize: 15, padding: "14px 16px", outline: "none", lineHeight: 1.6, transition: "border-color 0.2s" }}
      onFocus={e => e.target.style.borderColor = "#C9A84C"}
      onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.15)"} />
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {label && <label style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--cream)", fontFamily: "'Outfit', sans-serif", fontSize: 15, padding: "14px 16px", outline: "none", transition: "border-color 0.2s" }}
      onFocus={e => e.target.style.borderColor = "#C9A84C"}
      onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.15)"} />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {label && <label style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--cream)", fontFamily: "'Outfit', sans-serif", fontSize: 15, padding: "14px 16px", outline: "none", cursor: "pointer" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const OutputBox = ({ text, loading }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  if (!text && !loading) return null;
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Generated Output</span>
        {text && <button onClick={copy} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "5px 14px", color: copied ? "#C9A84C" : "var(--muted)", fontFamily: "'Outfit', sans-serif", fontSize: 12, cursor: "pointer" }}>{copied ? "✓ Copied" : "Copy"}</button>}
      </div>
      {loading ? <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)", fontSize: 14 }}><Spinner /> Generating with AI...</div>
        : <p style={{ color: "var(--cream)", lineHeight: 1.75, fontSize: 15, whiteSpace: "pre-wrap" }}>{text}</p>}
    </div>
  );
};

const SYSTEM_LISTING = `You are an expert real estate copywriter. Write compelling, professional property listings that highlight unique features, lifestyle benefits, and emotional appeal. Use vivid but accurate language. Format cleanly with a headline, body paragraphs, and key highlights. Do not use markdown headers or asterisks.`;
const SYSTEM_SOCIAL = `You are a social media expert for real estate agents. Write engaging, scroll-stopping social media posts that drive engagement and inquiries. Include relevant emojis, a hook, key property highlights, and a clear call to action. Tailor tone to the platform specified.`;
const SYSTEM_EMAIL = `You are a real estate marketing expert. Write professional, compelling email campaigns for real estate agents. Include a subject line, personalized greeting, engaging body, property highlights, and a clear call to action. Keep it concise and high-converting.`;
const SYSTEM_FOLLOWUP = `You are a real estate sales coach. Write a multi-touch follow-up email sequence for real estate agents. Create 3 emails: Day 1 (immediate follow-up), Day 4 (value add), Day 10 (final nudge). Each email should be brief, personalized, and move the lead forward. Label each clearly.`;
const SYSTEM_OPENHOME = `You are a real estate presentation coach. Write a professional open house script for a real estate agent. Include a warm welcome, key property highlights to mention, questions to ask visitors, objection handling, and a closing pitch to capture their contact info. Keep it natural and conversational.`;

function ListingTool({ apiKey }) {
  const [beds, setBeds] = useState(""); const [baths, setBaths] = useState(""); const [sqft, setSqft] = useState("");
  const [type, setType] = useState("house"); const [features, setFeatures] = useState(""); const [tone, setTone] = useState("luxury");
  const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setOutput("");
    try { setOutput(await callClaude(SYSTEM_LISTING, `Property: ${beds} bed, ${baths} bath ${type}, ${sqft} sqft. Key features: ${features}. Tone: ${tone}. Write a compelling listing description.`, apiKey)); }
    catch (e) { setOutput("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Input label="Bedrooms" value={beds} onChange={setBeds} placeholder="e.g. 4" />
        <Input label="Bathrooms" value={baths} onChange={setBaths} placeholder="e.g. 2.5" />
        <Input label="Square Feet" value={sqft} onChange={setSqft} placeholder="e.g. 2,400" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Select label="Property Type" value={type} onChange={setType} options={[{value:"house",label:"House"},{value:"apartment",label:"Apartment"},{value:"condo",label:"Condo"},{value:"townhouse",label:"Townhouse"},{value:"villa",label:"Villa"},{value:"penthouse",label:"Penthouse"}]} />
        <Select label="Tone" value={tone} onChange={setTone} options={[{value:"luxury",label:"Luxury / Premium"},{value:"warm",label:"Warm & Inviting"},{value:"modern",label:"Modern & Minimalist"},{value:"family",label:"Family-Friendly"}]} />
      </div>
      <Textarea label="Key Features & Highlights" value={features} onChange={setFeatures} placeholder="e.g. Ocean views, chef's kitchen with marble countertops, private pool, open plan living, double garage..." rows={3} />
      <GoldButton onClick={generate} disabled={loading || !beds || !features}>{loading ? <Spinner /> : "✦"} Generate Listing</GoldButton>
      <OutputBox text={output} loading={loading} />
    </div>
  );
}

function SocialTool({ apiKey }) {
  const [property, setProperty] = useState(""); const [platform, setPlatform] = useState("instagram");
  const [goal, setGoal] = useState("engagement"); const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setOutput("");
    try { setOutput(await callClaude(SYSTEM_SOCIAL, `Property: ${property}. Platform: ${platform}. Goal: ${goal}. Write a compelling social media post.`, apiKey)); }
    catch (e) { setOutput("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Textarea label="Property Description" value={property} onChange={setProperty} placeholder="Briefly describe the property — type, location, standout features, price point..." rows={3} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Select label="Platform" value={platform} onChange={setPlatform} options={[{value:"instagram",label:"Instagram"},{value:"facebook",label:"Facebook"},{value:"linkedin",label:"LinkedIn"},{value:"twitter",label:"Twitter / X"}]} />
        <Select label="Goal" value={goal} onChange={setGoal} options={[{value:"engagement",label:"Drive Engagement"},{value:"inquiries",label:"Generate Inquiries"},{value:"open_home",label:"Promote Open Home"},{value:"just_listed",label:"Just Listed Announcement"}]} />
      </div>
      <GoldButton onClick={generate} disabled={loading || !property}>{loading ? <Spinner /> : "✦"} Generate Post</GoldButton>
      <OutputBox text={output} loading={loading} />
    </div>
  );
}

function EmailTool({ apiKey }) {
  const [property, setProperty] = useState(""); const [audience, setAudience] = useState("buyers");
  const [cta, setCta] = useState(""); const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setOutput("");
    try { setOutput(await callClaude(SYSTEM_EMAIL, `Property: ${property}. Audience: ${audience}. Call to action: ${cta}. Write a compelling email campaign.`, apiKey)); }
    catch (e) { setOutput("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Textarea label="Property Details" value={property} onChange={setProperty} placeholder="Describe the property, location, key selling points, price..." rows={3} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Select label="Target Audience" value={audience} onChange={setAudience} options={[{value:"buyers",label:"Potential Buyers"},{value:"investors",label:"Investors"},{value:"renters",label:"Renters"},{value:"past_clients",label:"Past Clients"}]} />
        <Input label="Call to Action" value={cta} onChange={setCta} placeholder="e.g. Book a viewing this Saturday" />
      </div>
      <GoldButton onClick={generate} disabled={loading || !property}>{loading ? <Spinner /> : "✦"} Generate Email</GoldButton>
      <OutputBox text={output} loading={loading} />
    </div>
  );
}

function FollowupTool({ apiKey }) {
  const [lead, setLead] = useState(""); const [property, setProperty] = useState("");
  const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setOutput("");
    try { setOutput(await callClaude(SYSTEM_FOLLOWUP, `Lead context: ${lead}. Property they viewed: ${property}. Write a 3-email follow-up sequence (Day 1, Day 4, Day 10).`, apiKey)); }
    catch (e) { setOutput("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Textarea label="Lead Context" value={lead} onChange={setLead} placeholder="e.g. Sarah & John, couple, attended open home Saturday, interested but said 'thinking about it', budget around €450k..." rows={3} />
      <Input label="Property They Viewed" value={property} onChange={setProperty} placeholder="e.g. 3 bed townhouse, Ballsbridge, €425,000" />
      <GoldButton onClick={generate} disabled={loading || !lead}>{loading ? <Spinner /> : "✦"} Generate Sequence</GoldButton>
      <OutputBox text={output} loading={loading} />
    </div>
  );
}

function OpenHomeTool({ apiKey }) {
  const [property, setProperty] = useState(""); const [style, setStyle] = useState("confident");
  const [output, setOutput] = useState(""); const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setOutput("");
    try { setOutput(await callClaude(SYSTEM_OPENHOME, `Property: ${property}. Presentation style: ${style}. Write a complete open home script.`, apiKey)); }
    catch (e) { setOutput("Error: " + e.message); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Textarea label="Property Details" value={property} onChange={setProperty} placeholder="e.g. 4 bed family home, quiet cul-de-sac, renovated kitchen, solar panels, large backyard, €620,000..." rows={3} />
      <Select label="Agent Style" value={style} onChange={setStyle} options={[{value:"confident",label:"Confident & Direct"},{value:"warm",label:"Warm & Consultative"},{value:"luxury",label:"Luxury & Exclusive"},{value:"first_home",label:"First Home Buyer Friendly"}]} />
      <GoldButton onClick={generate} disabled={loading || !property}>{loading ? <Spinner /> : "✦"} Generate Script</GoldButton>
      <OutputBox text={output} loading={loading} />
    </div>
  );
}

const TOOLS = [
  { id: "listing", icon: "🏡", label: "Listing Writer", desc: "AI property descriptions" },
  { id: "social", icon: "📱", label: "Social Posts", desc: "Instagram, Facebook, LinkedIn" },
  { id: "email", icon: "✉️", label: "Email Campaign", desc: "Convert leads to viewings" },
  { id: "followup", icon: "🔄", label: "Follow-Up Sequence", desc: "3-email automated nurture" },
  { id: "openhome", icon: "🔑", label: "Open Home Script", desc: "Walk-in ready presentation" },
];

function Dashboard({ apiKey, onLogout }) {
  const [active, setActive] = useState("listing");
  const toolComponents = { listing: <ListingTool apiKey={apiKey} />, social: <SocialTool apiKey={apiKey} />, email: <EmailTool apiKey={apiKey} />, followup: <FollowupTool apiKey={apiKey} />, openhome: <OpenHomeTool apiKey={apiKey} /> };
  const activeTool = TOOLS.find(t => t.id === active);
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 260, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "28px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 24px 28px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600 }}>
            <span className="gold-text">Listing</span><span style={{ color: "var(--cream)" }}>Genius</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>AI for Real Estate</p>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => setActive(tool.id)} style={{ background: active === tool.id ? "rgba(201,168,76,0.1)" : "none", border: active === tool.id ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent", borderRadius: 10, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.2s" }}>
              <span style={{ fontSize: 20 }}>{tool.icon}</span>
              <div>
                <div style={{ color: active === tool.id ? "#C9A84C" : "var(--cream)", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500 }}>{tool.label}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 1 }}>{tool.desc}</div>
              </div>
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <button onClick={onLogout} style={{ background: "none", border: "none", color: "var(--muted)", fontFamily: "'Outfit', sans-serif", fontSize: 13, cursor: "pointer" }}>← Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "40px 48px", overflow: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="fade-up" style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{activeTool.icon}</span>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 500, color: "var(--cream)" }}>{activeTool.label}</h1>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 16 }}>{activeTool.desc} — powered by AI</p>
          </div>
          <Card className="fade-up-2">{toolComponents[active]}</Card>
        </div>
      </main>
    </div>
  );
}

function Landing({ onEnter }) {
  const features = [
    { icon: "🏡", title: "Listing Descriptions", desc: "Compelling property copy that sells the lifestyle, not just the property." },
    { icon: "📱", title: "Social Media Posts", desc: "Platform-optimised content for Instagram, Facebook & LinkedIn." },
    { icon: "✉️", title: "Email Campaigns", desc: "High-converting emails that turn cold leads into booked viewings." },
    { icon: "🔄", title: "Follow-Up Sequences", desc: "3-touch nurture sequences so no lead slips through the cracks." },
    { icon: "🔑", title: "Open Home Scripts", desc: "Walk in prepared. Walk out with contacts." },
  ];
  return (
    <div style={{ minHeight: "100vh" }}>
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="fade-up" style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 28, fontWeight: 500 }}>✦ AI-Powered Real Estate Marketing</div>
        <h1 className="fade-up-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 300, lineHeight: 1.05, marginBottom: 28, maxWidth: 900 }}>
          Write less.<br /><em style={{ fontStyle: "italic" }}>Close more.</em>
        </h1>
        <p className="fade-up-3" style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "var(--muted)", maxWidth: 580, lineHeight: 1.7, marginBottom: 48 }}>
          ListingGenius writes your property descriptions, social posts, email campaigns and follow-up sequences — in seconds.
        </p>
        <div className="fade-up-4" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <GoldButton onClick={onEnter} style={{ padding: "16px 40px", fontSize: 16 }}>Start Free Trial →</GoldButton>
          <button onClick={onEnter} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 40px", color: "var(--cream)", fontFamily: "'Outfit', sans-serif", fontSize: 16, cursor: "pointer" }}>See Demo</button>
        </div>
        <div className="fade-up-4" style={{ display: "flex", gap: 48, marginTop: 80, flexWrap: "wrap", justifyContent: "center" }}>
          {[["5 AI tools", "in one platform"], ["< 10 seconds", "per generation"], ["3x faster", "than writing manually"]].map(([val, label]) => (
            <div key={val} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500 }} className="gold-text">{val}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 400, textAlign: "center", marginBottom: 60 }}>Everything you need to market <em>brilliantly</em></h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {features.map(f => (
            <Card key={f.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.65, fontSize: 15 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 400, marginBottom: 16 }}>Simple pricing</h2>
        <p style={{ color: "var(--muted)", marginBottom: 60 }}>No contracts. Cancel anytime.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { name: "Starter", price: "€49", period: "/month", features: ["50 generations/month", "All 5 AI tools", "Email support"], gold: false },
            { name: "Pro", price: "€99", period: "/month", features: ["Unlimited generations", "All 5 AI tools", "Priority support", "Team collaboration"], gold: true },
            { name: "Agency", price: "€149", period: "/month", features: ["Unlimited generations", "All 5 AI tools", "Dedicated support", "5 team seats", "White-label option"], gold: false },
          ].map(p => (
            <Card key={p.name} style={{ border: p.gold ? "1px solid rgba(201,168,76,0.5)" : "1px solid var(--border)", background: p.gold ? "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(240,208,128,0.04))" : "var(--bg2)", position: "relative" }}>
              {p.gold && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #C9A84C, #F0D080)", color: "#07080D", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>Most Popular</div>}
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 500, marginBottom: 8 }}>{p.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300 }} className={p.gold ? "gold-text" : ""}>{p.price}</span>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{p.period}</span>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {p.features.map(f => <li key={f} style={{ color: "var(--muted)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#C9A84C" }}>✓</span> {f}</li>)}
              </ul>
              <GoldButton onClick={onEnter} style={{ width: "100%", justifyContent: "center", background: p.gold ? undefined : "rgba(201,168,76,0.12)", color: p.gold ? "#07080D" : "#C9A84C" }}>Get Started</GoldButton>
            </Card>
          ))}
        </div>
      </section>
      <section style={{ padding: "80px 24px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 300, marginBottom: 24 }}>Ready to write less<br />and <em>earn more?</em></h2>
        <GoldButton onClick={onEnter} style={{ margin: "0 auto", padding: "18px 48px", fontSize: 17 }}>Start Free Trial →</GoldButton>
      </section>
    </div>
  );
}

function ApiKeyModal({ onSubmit }) {
  const [key, setKey] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(7,8,13,0.92)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
      <Card style={{ maxWidth: 480, width: "100%", animation: "fadeUp 0.4s ease forwards" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
          <span className="gold-text">Enter</span> API Key
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Your Anthropic API key powers the AI. It stays in your browser only and is never stored. Get yours at <span style={{ color: "#C9A84C" }}>console.anthropic.com</span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input value={key} onChange={setKey} placeholder="sk-ant-..." type="password" />
          <GoldButton onClick={() => key && onSubmit(key)} disabled={!key} style={{ justifyContent: "center" }}>Enter Dashboard →</GoldButton>
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [apiKey, setApiKey] = useState("");
  return (
    <>
      <style>{globalStyles}</style>
      <div className="grain" />
      {screen === "landing" && <Landing onEnter={() => setScreen("apikey")} />}
      {screen === "apikey" && (<><Landing onEnter={() => {}} /><ApiKeyModal onSubmit={key => { setApiKey(key); setScreen("dashboard"); }} /></>)}
      {screen === "dashboard" && <Dashboard apiKey={apiKey} onLogout={() => setScreen("landing")} />}
    </>
  );
}
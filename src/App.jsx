import { useEffect, useMemo, useState } from "react";
import {
  Pulse,
  Archive,
  ArrowClockwise,
  Bell,
  BookOpenText,
  Briefcase,
  Bug,
  CaretDown,
  CaretRight,
  ChartBar,
  Check,
  CheckCircle,
  ClipboardText,
  Clock,
  DownloadSimple,
  FileText,
  Flag,
  Gear,
  House,
  Kanban,
  ListBullets,
  MagnifyingGlass,
  Plus,
  Rows,
  SignOut,
  SpinnerGap,
  SquaresFour,
  Target,
  TestTube,
  Trash,
  User,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react";

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
};

const navItems = [
  ["overview", "Overview", House],
  ["backlog", "Backlog", Rows],
  ["board", "Boards", Kanban],
  ["qa", "QA & Tests", TestTube],
  ["requirements", "Requirements", BookOpenText],
  ["reports", "Reports", ChartBar],
  ["settings", "Settings", Gear],
];

const typeIcons = {
  Epic: Briefcase,
  Feature: Flag,
  "User Story": BookOpenText,
  Task: CheckCircle,
  Bug,
};

const typeClass = (type) => `type-${type.toLowerCase().replaceAll(" ", "-")}`;
const statuses = ["New", "Active", "Resolved", "Closed"];

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify(form) });
      onLogin();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-shell">
      <div className="login-brand">
        <div className="brand-mark">A</div>
        <span>Atlas <strong>Delivery Hub</strong></span>
      </div>
      <form className="login-panel" onSubmit={submit}>
        <div className="login-kicker">SHARED PROJECT ACCESS</div>
        <h1>Sign in to Atlas Payroll</h1>
        <p>Use the shared project credential to view progress and manage delivery work.</p>
        <label>Username<input autoFocus value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        {error && <div className="form-error"><Warning size={17} />{error}</div>}
        <button className="primary-button login-button" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : "Sign in"}</button>
        <small>One shared credential gives full project access. Credentials are controlled by the server environment.</small>
      </form>
    </div>
  );
}

function Metric({ label, value, detail, tone = "blue", icon: Icon }) {
  return <div className="metric"><div className={`metric-icon ${tone}`}>{Icon && <Icon size={20} weight="duotone" />}</div><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></div>;
}

function ProgressBar({ value, tone = "blue" }) {
  return <div className="progress-track"><span className={tone} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}

function Empty({ title, text }) {
  return <div className="empty"><Archive size={32} weight="duotone" /><strong>{title}</strong><span>{text}</span></div>;
}

function AppShell({ state, setState, onLogout }) {
  const [page, setPage] = useState("overview");
  const [selectedId, setSelectedId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState({});
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const selected = state.workItems.find((item) => item.id === selectedId);
  const project = state.projects.find((entry) => entry.id === state.activeProjectId) || state.projects[0];
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const refresh = async () => setState(await api("/api/state"));
  const openCreate = (defaults = {}) => { setCreateDefaults(defaults); setCreateOpen(true); };
  const openItem = (id) => { setSelectedId(id); };
  const navigate = (next) => { setPage(next); setMobileNav(false); setSelectedId(null); };
  const searchMatches = query.trim().length > 1 ? state.workItems.filter((item) => `${item.id} ${item.title}`.toLowerCase().includes(query.toLowerCase())).slice(0, 7) : [];

  const updateItem = async (id, updates, message = "Work item updated") => {
    const item = await api(`/api/work-items/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(updates) });
    setState((current) => ({ ...current, workItems: current.workItems.map((existing) => existing.id === id ? item : existing) }));
    showToast(message);
    return item;
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-brand"><div className="brand-mark">A</div><span>Atlas <strong>Delivery Hub</strong></span><button className="icon-button mobile-only" onClick={() => setMobileNav(false)}><X /></button></div>
        <div className="project-switch"><div><small>PROJECT</small><strong>{project.name}</strong></div><CaretDown size={14} /></div>
        <nav>{navItems.map(([key, label, Icon]) => <button key={key} className={page === key ? "active" : ""} onClick={() => navigate(key)}><Icon size={20} weight={page === key ? "fill" : "regular"} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-mini"><User size={17} /><div><strong>Shared User</strong><small>Full access</small></div></div><button className="icon-button inverse" title="Sign out" onClick={onLogout}><SignOut /></button></div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileNav(true)}><ListBullets /></button>
          <div className="search-wrap"><MagnifyingGlass size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search work items, epics, features..." />{query && <button onClick={() => setQuery("")}><X size={15} /></button>}{searchMatches.length > 0 && <div className="search-results">{searchMatches.map((item) => <button key={item.id} onClick={() => { openItem(item.id); setQuery(""); }}><TypeIcon type={item.type} /><span><strong>{item.id}</strong>{item.title}</span></button>)}</div>}</div>
          <button className="primary-button" onClick={() => openCreate()}><Plus size={18} />Create work item</button>
          <button className="icon-button"><Bell /></button>
          <div className="avatar">SU</div>
        </header>
        <div className={`page ${selected ? "with-detail" : ""}`}>
          {page === "overview" && <Overview state={state} project={project} openItem={openItem} navigate={navigate} />}
          {page === "backlog" && <Backlog state={state} openItem={openItem} openCreate={openCreate} />}
          {page === "board" && <Board state={state} openItem={openItem} updateItem={updateItem} openCreate={openCreate} />}
          {page === "qa" && <QA state={state} setState={setState} openItem={openItem} showToast={showToast} />}
          {page === "requirements" && <Requirements state={state} />}
          {page === "reports" && <Reports state={state} project={project} />}
          {page === "settings" && <Settings state={state} setState={setState} showToast={showToast} />}
        </div>
      </main>
      {selected && <DetailPanel item={selected} state={state} close={() => setSelectedId(null)} updateItem={updateItem} refresh={refresh} openItem={openItem} openCreate={openCreate} showToast={showToast} />}
      {createOpen && <CreateModal state={state} defaults={createDefaults} close={() => setCreateOpen(false)} onCreated={async (item) => { await refresh(); setCreateOpen(false); setSelectedId(item.id); showToast(`${item.type} created`); }} />}
      {toast && <div className="toast"><Check size={18} weight="bold" />{toast}</div>}
    </div>
  );
}

function TypeIcon({ type, size = 18 }) {
  const Icon = typeIcons[type] || FileText;
  return <span className={`type-icon ${typeClass(type)}`}><Icon size={size} weight="fill" /></span>;
}

function Overview({ state, project, openItem, navigate }) {
  const features = state.workItems.filter((item) => item.type === "Feature");
  const stories = state.workItems.filter((item) => item.type === "User Story");
  const tasks = state.workItems.filter((item) => item.type === "Task");
  const closed = stories.filter((item) => item.status === "Closed").length;
  const active = stories.filter((item) => item.status === "Active").length;
  const completion = stories.length ? Math.round((closed + active * 0.5) / stories.length * 100) : 0;
  const qaRun = state.tests.filter((test) => test.status !== "Not Run").length;
  const qaPassed = state.tests.filter((test) => test.status === "Passed").length;
  return <div className="content overview-page">
    <div className="page-heading"><div><span className="eyebrow">CLIENT OVERVIEW</span><h1>{project.name}</h1><p>{project.description}</p></div><button className="secondary-button" onClick={() => navigate("reports")}><ChartBar />View full report</button></div>
    <section className="project-summary"><div className="phase"><span>Current phase</span><strong>{project.phase}</strong></div><div><span>Overall completion</span><strong className="big-number">{completion}%</strong><ProgressBar value={completion} /></div><div><span>Target milestone</span><strong>{project.targetMilestone}</strong><small>{project.targetDate || "Date to be confirmed"}</small></div><div><span>Last updated</span><strong>{new Date(state.activities[0]?.at || Date.now()).toLocaleDateString()}</strong><small>by {state.activities[0]?.actor || "Shared User"}</small></div></section>
    <section className="timeline"><TimelineStep label="Discovery" state="done" /><TimelineStep label="BA / Requirements" state="current" /><TimelineStep label="Design" /><TimelineStep label="Development" /><TimelineStep label="System Test" /><TimelineStep label="UAT & Go-Live" /></section>
    <div className="overview-grid">
      <section className="panel module-status"><PanelHeader title="Module status" action="View backlog" onAction={() => navigate("backlog")} /><div className="table-scroll"><table><thead><tr><th>Module</th><th>Progress</th><th>Status</th><th>Scope</th><th>QA readiness</th><th>Target</th></tr></thead><tbody>{features.map((feature) => { const tests = state.tests.filter((test) => test.featureId === feature.id); const ready = tests.length ? Math.round(tests.filter((test) => test.status === "Passed").length / tests.length * 100) : 0; return <tr key={feature.id} onClick={() => openItem(feature.id)}><td><div className="item-title"><TypeIcon type="Feature" /><div><strong>{feature.title}</strong><small>{feature.id}</small></div></div></td><td><strong>{feature.progress}%</strong><ProgressBar value={feature.progress} /></td><td><Status value={feature.status} /></td><td><span className={`scope-status ${feature.scopeStatus === "At Risk" ? "at-risk" : ""}`}>{feature.scopeStatus || "On Track"}</span></td><td>{ready}% ready</td><td>{feature.targetDate ? new Date(`${feature.targetDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}</td></tr>; })}</tbody></table></div></section>
      <section className="panel hierarchy-summary"><PanelHeader title="Work hierarchy" action="Open full hierarchy" onAction={() => navigate("backlog")} /><HierarchySummary state={state} openItem={openItem} /></section>
    </div>
    <div className="health-grid">
      <section className="panel"><PanelHeader title="Delivery health" /><div className="health-list"><HealthRow label="Scope" value="On track" tone="green" detail={`${features.length} features in focused scope`} /><HealthRow label="Schedule" value="Watch" tone="amber" detail="BA clarification items remain" /><HealthRow label="Quality" value={`${qaPassed}/${state.tests.length} passed`} tone="blue" detail={`${qaRun} tests started`} /><HealthRow label="Workload" value={`${tasks.filter((item) => item.status !== "Closed").length} open tasks`} tone="blue" detail={`${stories.length} user stories`} /></div></section>
      <section className="panel"><PanelHeader title="Top risks" action="Source questions" onAction={() => navigate("requirements")} /><div className="risk-list">{state.risks.map((risk, index) => <div className="risk" key={risk.id}><span className={`risk-number ${index === 0 ? "red" : "amber"}`}>{index + 1}</span><div><strong>{risk.title}</strong><small>Impact: {risk.impact} · Likelihood: {risk.likelihood} · {risk.owner}</small></div></div>)}</div></section>
      <section className="panel qa-readiness"><PanelHeader title="QA readiness" action="Open QA" onAction={() => navigate("qa")} /><div className="donut" style={{ "--value": `${state.tests.length ? Math.round(qaRun / state.tests.length * 100) : 0}%` }}><div><strong>{state.tests.length ? Math.round(qaRun / state.tests.length * 100) : 0}%</strong><span>started</span></div></div><div className="legend"><span><i className="green" />Passed {qaPassed}</span><span><i className="blue" />In progress {state.tests.filter((test) => test.status === "In Progress").length}</span><span><i />Not run {state.tests.filter((test) => test.status === "Not Run").length}</span></div></section>
      <section className="panel"><PanelHeader title="Recent activity" /><div className="activity-list">{state.activities.slice(0, 5).map((entry) => <div key={entry.id}><div className="avatar small">{entry.actor.slice(0, 2).toUpperCase()}</div><div><strong>{entry.actor}</strong><span>{entry.action}</span><small>{new Date(entry.at).toLocaleString()}</small></div></div>)}</div></section>
    </div>
  </div>;
}

function TimelineStep({ label, state = "future" }) { return <div className={`timeline-step ${state}`}><div><Check size={12} /></div><span>{label}</span></div>; }
function PanelHeader({ title, action, onAction }) { return <div className="panel-header"><h2>{title}</h2>{action && <button onClick={onAction}>{action}<CaretRight /></button>}</div>; }
function Status({ value }) { return <span className={`status status-${(value || "new").toLowerCase().replaceAll(" ", "-")}`}><i />{value}</span>; }
function HealthRow({ label, value, detail, tone }) { return <div><span className={`health-icon ${tone}`}><Pulse size={18} /></span><div><strong>{label}<em className={tone}>{value}</em></strong><small>{detail}</small></div></div>; }

function HierarchySummary({ state, openItem }) {
  const epic = state.workItems.find((item) => item.type === "Epic");
  const features = state.workItems.filter((item) => item.type === "Feature");
  return <div className="hierarchy-list"><button onClick={() => openItem(epic.id)}><CaretDown /><TypeIcon type="Epic" /><strong>{epic.id}</strong><span>{epic.title}</span></button>{features.map((item) => <button key={item.id} onClick={() => openItem(item.id)}><CaretRight /><TypeIcon type="Feature" /><strong>{item.id}</strong><span>{item.title}</span><em>{item.progress}%</em></button>)}</div>;
}

function Backlog({ state, openItem, openCreate }) {
  const [expanded, setExpanded] = useState(() => new Set(["EPIC-PAYROLL", ...state.workItems.filter((item) => item.type === "Feature").map((item) => item.id)]));
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const children = useMemo(() => { const map = new Map(); state.workItems.forEach((item) => { const list = map.get(item.parentId) || []; list.push(item); map.set(item.parentId, list); }); return map; }, [state.workItems]);
  const toggle = (id) => setExpanded((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const visible = [];
  const walk = (parentId, depth) => (children.get(parentId) || []).forEach((item) => { const match = (typeFilter === "All" || item.type === typeFilter) && (statusFilter === "All" || item.status === statusFilter) && (!search || `${item.id} ${item.title}`.toLowerCase().includes(search.toLowerCase())); if (match || (!search && typeFilter === "All" && statusFilter === "All")) visible.push({ item, depth }); if ((expanded.has(item.id) || search) && (typeFilter === "All" || search)) walk(item.id, depth + 1); });
  walk(null, 0);
  return <div className="content backlog-page"><div className="page-heading"><div><span className="eyebrow">TEAM EXECUTION</span><h1>Backlog</h1><p>Plan and maintain the complete Epic → Feature → User Story → Task hierarchy.</p></div><button className="primary-button" onClick={() => openCreate()}><Plus />New work item</button></div>
    <div className="toolbar"><div className="inline-search"><MagnifyingGlass /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter backlog" /></div><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option>Epic</option><option>Feature</option><option>User Story</option><option>Task</option><option>Bug</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="tertiary-button" onClick={() => setExpanded(new Set(state.workItems.map((item) => item.id)))}>Expand all</button><button className="tertiary-button" onClick={() => setExpanded(new Set())}>Collapse all</button></div>
    <div className="panel backlog-table table-scroll"><table><thead><tr><th className="id-column">ID</th><th>Title</th><th>State</th><th>Assigned to</th><th>Priority</th><th>Sprint</th><th>Points</th><th>Progress</th></tr></thead><tbody>{visible.map(({ item, depth }) => { const hasChildren = (children.get(item.id) || []).length > 0; return <tr key={item.id} onClick={() => openItem(item.id)}><td><div className="backlog-id" style={{ paddingLeft: depth * 20 }} onClick={(event) => { if (hasChildren) { event.stopPropagation(); toggle(item.id); } }}>{hasChildren ? expanded.has(item.id) ? <CaretDown /> : <CaretRight /> : <span className="caret-space" />}<TypeIcon type={item.type} /><strong>{item.id}</strong></div></td><td><div className="title-cell"><strong>{item.title}</strong>{item.type === "User Story" && item.qaFocus?.length > 0 && <small>{item.acceptanceCriteria.length} acceptance · {item.qaFocus.length} QA checks</small>}</div></td><td><Status value={item.status} /></td><td><span className="assignee"><span>{(item.assignee || "U").slice(0, 1)}</span>{item.assignee}</span></td><td><span className={`priority priority-${item.priority?.toLowerCase()}`}>{item.priority}</span></td><td>{item.sprint}</td><td>{item.storyPoints || "—"}</td><td><div className="progress-cell"><ProgressBar value={item.progress} /><span>{item.progress || 0}%</span></div></td></tr>; })}</tbody></table>{visible.length === 0 && <Empty title="No matching work items" text="Adjust the filters or create a new item." />}</div>
  </div>;
}

function Board({ state, openItem, updateItem, openCreate }) {
  const [feature, setFeature] = useState("All");
  const features = state.workItems.filter((item) => item.type === "Feature");
  const stories = state.workItems.filter((item) => item.type === "User Story" && (feature === "All" || item.parentId === feature));
  const drop = async (event, status) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (id) await updateItem(id, { status, progress: status === "Closed" ? 100 : status === "Resolved" ? 80 : status === "Active" ? 50 : 0 }, `Moved ${id} to ${status}`); };
  return <div className="content board-page"><div className="page-heading"><div><span className="eyebrow">KANBAN</span><h1>User stories board</h1><p>Move stories through delivery stages. Changes are saved for all shared users.</p></div><button className="primary-button" onClick={() => openCreate({ type: "User Story" })}><Plus />New user story</button></div><div className="toolbar"><select value={feature} onChange={(event) => setFeature(event.target.value)}><option value="All">All features</option>{features.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><span className="toolbar-count">{stories.length} user stories</span></div><div className="kanban">{statuses.map((status) => { const items = stories.filter((item) => item.status === status); return <section className="kanban-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, status)}><header><h2>{status}</h2><span>{items.length}</span></header><div className="kanban-items">{items.map((item) => <article key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => openItem(item.id)}><div className="card-type"><TypeIcon type="User Story" /><strong>{item.id}</strong><span className={`priority-dot priority-${item.priority.toLowerCase()}`} /></div><h3>{item.title}</h3><p>{item.description}</p><footer><span className="avatar small">{item.assignee.slice(0, 2).toUpperCase()}</span><span>{item.storyPoints} pts</span><span>{item.sprint}</span></footer></article>)}<button className="add-card" onClick={() => openCreate({ type: "User Story", status })}><Plus />New user story</button></div></section>; })}</div></div>;
}

function QA({ state, setState, openItem, showToast }) {
  const [filter, setFilter] = useState("All");
  const tests = state.tests.filter((test) => filter === "All" || test.status === filter);
  const update = async (id, status) => { const test = await api(`/api/tests/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status }) }); setState((current) => ({ ...current, tests: current.tests.map((entry) => entry.id === id ? test : entry) })); showToast(`${id} marked ${status}`); };
  const passed = state.tests.filter((test) => test.status === "Passed").length;
  const started = state.tests.filter((test) => test.status !== "Not Run").length;
  return <div className="content"><div className="page-heading"><div><span className="eyebrow">QUALITY ASSURANCE</span><h1>QA & test center</h1><p>Every QA-focus statement from the Atlas source is traceable to its user story.</p></div></div><div className="metrics-row"><Metric label="Total tests" value={state.tests.length} detail="From 92 QA-focus statements" icon={TestTube} /><Metric label="Execution started" value={`${Math.round(started / state.tests.length * 100)}%`} detail={`${started} tests`} tone="amber" icon={Clock} /><Metric label="Passed" value={passed} detail={`${Math.round(passed / state.tests.length * 100)}% coverage`} tone="green" icon={CheckCircle} /><Metric label="User stories" value={state.workItems.filter((item) => item.type === "User Story").length} detail="All linked" tone="purple" icon={BookOpenText} /></div><div className="toolbar"><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Not Run</option><option>In Progress</option><option>Passed</option><option>Failed</option></select><span className="toolbar-count">{tests.length} test cases</span></div><div className="panel table-scroll qa-table"><table><thead><tr><th>Test case</th><th>Scenario</th><th>User story</th><th>Priority</th><th>Assignee</th><th>Status</th></tr></thead><tbody>{tests.map((test) => <tr key={test.id}><td><strong className="link" onClick={() => openItem(test.storyId)}>{test.id}</strong></td><td><strong>{test.title}</strong></td><td><button className="text-button" onClick={() => openItem(test.storyId)}>{test.storyId}</button></td><td><span className={`priority priority-${test.priority.toLowerCase()}`}>{test.priority}</span></td><td>{test.assignee}</td><td><select className={`test-status test-${test.status.toLowerCase().replaceAll(" ", "-")}`} value={test.status} onChange={(event) => update(test.id, event.target.value)}><option>Not Run</option><option>In Progress</option><option>Passed</option><option>Failed</option></select></td></tr>)}</tbody></table></div></div>;
}

function Requirements({ state }) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All sections");
  const headings = state.source.document.filter((block) => block.kind === "heading" && block.level === 1).map((block) => block.text);
  const blocks = state.source.document.filter((block) => {
    const inSection = section === "All sections" || block.path?.[0] === section;
    const text = block.text || block.rows?.flat().join(" ") || "";
    return inSection && (!query || text.toLowerCase().includes(query.toLowerCase()));
  });
  return <div className="content requirements-page"><div className="page-heading"><div><span className="eyebrow">SOURCE OF TRUTH</span><h1>Atlas requirements</h1><p>Complete searchable content extracted from {state.source.source.filename}.</p></div><div className="source-badge"><FileText size={24} /><div><strong>{state.source.source.paragraphCount} paragraphs</strong><small>{state.source.source.tableCount} source tables</small></div></div></div><div className="toolbar"><div className="inline-search wide"><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requirements, rules, formulas, questions..." /></div><select value={section} onChange={(event) => setSection(event.target.value)}><option>All sections</option>{headings.map((heading) => <option key={heading}>{heading}</option>)}</select></div><div className="document-layout"><aside className="document-toc"><strong>Document map</strong>{headings.map((heading) => <button key={heading} className={section === heading ? "active" : ""} onClick={() => setSection(heading)}>{heading}</button>)}</aside><article className="document-viewer">{blocks.length === 0 ? <Empty title="No matching source content" text="Try a broader search." /> : blocks.slice(0, 180).map((block, index) => <DocumentBlock block={block} key={`${block.kind}-${index}`} />)}{blocks.length > 180 && <div className="document-limit">Showing the first 180 matching blocks. Narrow the section or search to focus the source.</div>}</article></div></div>;
}

function DocumentBlock({ block }) {
  if (block.kind === "heading") { const Tag = `h${Math.min(block.level + 1, 6)}`; return <Tag>{block.text}</Tag>; }
  if (block.kind === "table") return <div className="source-table table-scroll"><table><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => index === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
  if (block.style === "List Bullet") return <div className="source-bullet"><span />{block.text}</div>;
  if (block.style === "Intense Quote") return <h5>{block.text}</h5>;
  return <p>{block.text}</p>;
}

function Reports({ state, project }) {
  const features = state.workItems.filter((item) => item.type === "Feature");
  const stories = state.workItems.filter((item) => item.type === "User Story");
  const byStatus = Object.fromEntries(statuses.map((status) => [status, stories.filter((item) => item.status === status).length]));
  return <div className="content reports-page"><div className="page-heading"><div><span className="eyebrow">REPORTING</span><h1>Project status report</h1><p>A client-ready summary with live delivery and QA data.</p></div><a className="primary-button" href="/api/export.csv"><DownloadSimple />Export work items</a></div><section className="report-cover"><div><span>ATLAS DELIVERY STATUS</span><h2>{project.name}</h2><p>{project.phase} · Updated {new Date().toLocaleDateString()}</p></div><div className="report-mark">A</div></section><div className="metrics-row"><Metric label="Epics" value={state.workItems.filter((item) => item.type === "Epic").length} icon={Briefcase} /><Metric label="Features" value={features.length} tone="purple" icon={Flag} /><Metric label="User stories" value={stories.length} tone="green" icon={BookOpenText} /><Metric label="Tasks" value={state.workItems.filter((item) => item.type === "Task").length} tone="amber" icon={CheckCircle} /></div><div className="report-grid"><section className="panel"><PanelHeader title="Story status" /><div className="status-chart">{statuses.map((status) => <div key={status}><span>{status}</span><div><i className={`chart-${status.toLowerCase()}`} style={{ width: `${stories.length ? byStatus[status] / stories.length * 100 : 0}%` }} /></div><strong>{byStatus[status]}</strong></div>)}</div></section><section className="panel"><PanelHeader title="Feature delivery" /><div className="feature-progress-list">{features.map((feature) => <div key={feature.id}><div><strong>{feature.title}</strong><span>{feature.progress}%</span></div><ProgressBar value={feature.progress} /></div>)}</div></section><section className="panel"><PanelHeader title="Current risk posture" /><div className="risk-list">{state.risks.map((risk, index) => <div className="risk" key={risk.id}><span className={`risk-number ${index === 0 ? "red" : "amber"}`}>{index + 1}</span><div><strong>{risk.title}</strong><small>{risk.status} · {risk.owner}</small></div></div>)}</div></section><section className="panel"><PanelHeader title="Readiness coverage" /><div className="coverage-list"><div><span>Acceptance criteria</span><strong>{state.source.stories.reduce((total, story) => total + story.acceptanceCriteria.length, 0)}</strong></div><div><span>Dev / QA tasks</span><strong>{state.source.stories.reduce((total, story) => total + story.tasks.length, 0)}</strong></div><div><span>QA scenarios</span><strong>{state.tests.length}</strong></div><div><span>Source blocks retained</span><strong>{state.source.document.length}</strong></div></div></section></div></div>;
}

function Settings({ state, setState, showToast }) {
  const [form, setForm] = useState({ name: "", description: "", phase: "Discovery", targetMilestone: "Scope approval", targetDate: "" });
  const [error, setError] = useState("");
  const createProject = async (event) => { event.preventDefault(); setError(""); try { const project = await api("/api/projects", { method: "POST", body: JSON.stringify(form) }); const next = await api("/api/state"); setState(next); setForm({ name: "", description: "", phase: "Discovery", targetMilestone: "Scope approval", targetDate: "" }); showToast(`Project ${project.name} created`); } catch (requestError) { setError(requestError.message); } };
  return <div className="content settings-page"><div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h1>Project settings</h1><p>Manage reusable project workspaces and shared-access configuration.</p></div></div><div className="settings-grid"><section className="panel settings-section"><PanelHeader title="Project workspaces" /><p>Atlas Delivery Hub supports multiple reusable project definitions. Work items can be associated with the active project.</p><div className="project-list">{state.projects.map((project) => <div key={project.id} className={project.id === state.activeProjectId ? "active" : ""}><div className="project-avatar">{project.name.slice(0, 1)}</div><div><strong>{project.name}</strong><small>{project.phase} · {project.targetMilestone}</small></div>{project.id === state.activeProjectId && <span>Active</span>}</div>)}</div></section><section className="panel settings-section"><PanelHeader title="Create project" /><form className="settings-form" onSubmit={createProject}><label>Project name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Customer Portal" /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="form-row"><label>Current phase<select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}><option>Discovery</option><option>BA / Requirements</option><option>Design</option><option>Development</option><option>QA / UAT</option></select></label><label>Target date<input type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></label></div><label>Target milestone<input value={form.targetMilestone} onChange={(event) => setForm({ ...form, targetMilestone: event.target.value })} /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button"><Plus />Create project</button></form></section><section className="panel settings-section access-card"><PanelHeader title="Shared access" /><div className="access-icon"><Users size={28} weight="duotone" /></div><h3>One credential, shared state</h3><p>All users sign in with one server-managed credential. Updates persist centrally and are immediately available to the next user.</p><div className="access-note"><Warning size={18} /><span>Change <code>ATLAS_USERNAME</code> and <code>ATLAS_PASSWORD</code> before exposing this service beyond a trusted internal network.</span></div></section></div></div>;
}

function DetailPanel({ item, state, close, updateItem, refresh, openItem, openCreate, showToast }) {
  const [tab, setTab] = useState("details");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [error, setError] = useState("");
  useEffect(() => { setDraft(item); setEditing(false); setTab("details"); }, [item.id]);
  const children = state.workItems.filter((child) => child.parentId === item.id);
  const tests = state.tests.filter((test) => test.storyId === item.id);
  const activities = state.activities.filter((entry) => entry.itemId === item.id);
  const save = async () => { try { await updateItem(item.id, draft); setEditing(false); } catch (requestError) { setError(requestError.message); } };
  const remove = async () => { if (!window.confirm(`Delete ${item.id}? This cannot be undone.`)) return; try { await api(`/api/work-items/${encodeURIComponent(item.id)}`, { method: "DELETE" }); close(); await refresh(); showToast(`${item.id} deleted`); } catch (requestError) { setError(requestError.message); } };
  return <aside className="detail-panel"><header><div><TypeIcon type={item.type} /><span>{item.type.toUpperCase()}</span><strong>{item.id}</strong></div><button className="icon-button" onClick={close}><X /></button></header><div className="detail-scroll"><h2>{item.title}</h2><div className="detail-meta"><Status value={item.status} /><span><User />{item.assignee}</span><span><Flag />{item.priority}</span></div><div className="detail-tabs">{["details", "criteria", "children", "tests", "history"].map((value) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value === "criteria" ? `Acceptance (${item.acceptanceCriteria?.length || 0})` : value === "children" ? `Children (${children.length})` : value === "tests" ? `Tests (${tests.length})` : value[0].toUpperCase() + value.slice(1)}</button>)}</div>{error && <div className="form-error">{error}</div>}
    {tab === "details" && (editing ? <div className="detail-form"><label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Description<textarea rows="5" value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><div className="form-row"><label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value, progress: event.target.value === "Closed" ? 100 : draft.progress })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label></div><div className="form-row"><label>Assignee<input value={draft.assignee || ""} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} /></label><label>Sprint<input value={draft.sprint || ""} onChange={(event) => setDraft({ ...draft, sprint: event.target.value })} /></label></div><div className="form-row"><label>Story points<input type="number" value={draft.storyPoints || 0} onChange={(event) => setDraft({ ...draft, storyPoints: Number(event.target.value) })} /></label><label>Progress<input type="number" min="0" max="100" value={draft.progress || 0} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} /></label></div><label>Source trace<textarea rows="3" value={draft.sourceTrace || ""} onChange={(event) => setDraft({ ...draft, sourceTrace: event.target.value })} /></label></div> : <div className="detail-content"><Section title="Description"><p>{item.description || "No description supplied."}</p></Section>{item.persona && <Section title="User story"><p><strong>{item.persona}</strong> {item.need} {item.benefit}</p></Section>}<Section title="Planning"><dl><div><dt>Story points</dt><dd>{item.storyPoints || "—"}</dd></div><div><dt>Sprint</dt><dd>{item.sprint}</dd></div><div><dt>Complexity</dt><dd>{item.complexity || "—"}</dd></div><div><dt>Progress</dt><dd>{item.progress || 0}%</dd></div></dl><ProgressBar value={item.progress} /></Section><Section title="Dependencies">{item.dependencies?.length ? <div className="tags">{item.dependencies.map((dependency) => <span key={dependency}>{dependency}</span>)}</div> : <p>No dependencies recorded.</p>}</Section><Section title="Source trace"><p>{item.sourceTrace || "Created in Atlas Delivery Hub"}</p></Section></div>)}
    {tab === "criteria" && <div className="check-list">{item.acceptanceCriteria?.length ? item.acceptanceCriteria.map((criterion, index) => <div key={index}><CheckCircle size={20} weight="fill" /><p>{criterion}</p></div>) : <Empty title="No acceptance criteria" text="Edit this item to add delivery conditions." />}{item.qaFocus?.length > 0 && <><h3>QA focus</h3>{item.qaFocus.map((focus, index) => <div key={index}><TestTube size={20} /><p>{focus}</p></div>)}</>}</div>}
    {tab === "children" && <div className="child-list">{children.map((child) => <button key={child.id} onClick={() => openItem(child.id)}><TypeIcon type={child.type} /><div><strong>{child.id}</strong><span>{child.title}</span></div><Status value={child.status} /></button>)}{children.length === 0 && <Empty title="No child items" text="Add a child work item to break down the scope." />}<button className="secondary-button full" onClick={() => openCreate({ parentId: item.id, type: item.type === "Epic" ? "Feature" : item.type === "Feature" ? "User Story" : "Task" })}><Plus />Add child work item</button></div>}
    {tab === "tests" && <div className="child-list">{tests.map((test) => <div className="test-row" key={test.id}><TestTube /><div><strong>{test.id}</strong><span>{test.title}</span></div><span className={`test-pill test-${test.status.toLowerCase().replaceAll(" ", "-")}`}>{test.status}</span></div>)}{tests.length === 0 && <Empty title="No linked tests" text="QA scenarios are linked to imported Atlas user stories." />}</div>}
    {tab === "history" && <div className="history-list">{activities.length ? activities.map((entry) => <div key={entry.id}><span /><div><strong>{entry.action}</strong><p>{entry.actor} · {new Date(entry.at).toLocaleString()}</p></div></div>) : <Empty title="No recorded changes" text="Updates to this item appear here." />}</div>}
  </div><footer>{editing ? <><button className="secondary-button" onClick={() => { setDraft(item); setEditing(false); }}>Cancel</button><button className="primary-button" onClick={save}><Check />Save changes</button></> : <><button className="danger-button" onClick={remove}><Trash />Delete</button><button className="primary-button" onClick={() => setEditing(true)}>Edit work item</button></>}</footer></aside>;
}

function Section({ title, children }) { return <section><h3>{title}</h3>{children}</section>; }

function CreateModal({ state, defaults, close, onCreated }) {
  const [form, setForm] = useState({ type: defaults.type || "User Story", parentId: defaults.parentId || "", title: "", description: "", status: defaults.status || "New", priority: "Medium", assignee: "Unassigned", sprint: "Backlog", storyPoints: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const validParents = state.workItems.filter((item) => form.type === "Epic" ? false : form.type === "Feature" ? item.type === "Epic" : form.type === "User Story" || form.type === "Bug" ? item.type === "Feature" : item.type === "User Story");
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const item = await api("/api/work-items", { method: "POST", body: JSON.stringify({ ...form, acceptanceCriteria: [], qaFocus: [], dependencies: [] }) }); onCreated(item); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } };
  return <div className="modal-backdrop" onMouseDown={close}><form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">NEW WORK ITEM</span><h2>Create work item</h2></div><button type="button" className="icon-button" onClick={close}><X /></button></header><div className="form-row"><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, parentId: "" })}><option>Epic</option><option>Feature</option><option>User Story</option><option>Task</option><option>Bug</option></select></label><label>Parent<select disabled={form.type === "Epic"} value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><option value="">No parent</option>{validParents.map((item) => <option value={item.id} key={item.id}>{item.id} — {item.title}</option>)}</select></label></div><label>Title<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be delivered?" /></label><label>Description<textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the outcome, context, or user need." /></label><div className="form-row"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label></div><div className="form-row"><label>Assignee<input value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })} /></label><label>Sprint<input value={form.sprint} onChange={(event) => setForm({ ...form, sprint: event.target.value })} /></label></div>{error && <div className="form-error"><Warning />{error}</div>}<footer><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : <Plus />}Create {form.type.toLowerCase()}</button></footer></form></div>;
}

export function App() {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const load = async () => { try { const sessionData = await api("/api/session"); setSession(sessionData); if (sessionData.authenticated) setState(await api("/api/state")); } catch (requestError) { setError(requestError.message); } };
  useEffect(() => { load(); }, []);
  const logout = async () => { await api("/api/logout", { method: "POST" }); setSession({ authenticated: false }); setState(null); };
  if (error) return <div className="fatal"><Warning size={32} /><h1>Atlas Delivery Hub could not start</h1><p>{error}</p><button className="primary-button" onClick={() => window.location.reload()}><ArrowClockwise />Retry</button></div>;
  if (!session) return <div className="loading"><SpinnerGap className="spin" size={32} /><span>Loading Atlas Delivery Hub…</span></div>;
  if (!session.authenticated) return <Login onLogin={load} />;
  if (!state) return <div className="loading"><SpinnerGap className="spin" size={32} /><span>Loading project data…</span></div>;
  return <AppShell state={state} setState={setState} onLogout={logout} />;
}

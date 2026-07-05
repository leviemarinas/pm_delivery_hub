import { useEffect, useMemo, useState } from "react";
import {
  Pulse,
  Archive,
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowsOutSimple,
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
  FileXls,
  Flag,
  FloppyDisk,
  Gear,
  House,
  Kanban,
  LinkSimple,
  ListBullets,
  MagnifyingGlass,
  NotePencil,
  PencilSimple,
  Play,
  Plus,
  PresentationChart,
  Printer,
  Rows,
  SignOut,
  SpinnerGap,
  SquaresFour,
  Target,
  TestTube,
  TrendUp,
  Trash,
  UploadSimple,
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
  ["presentation", "Sprint Presentation", PresentationChart],
  ["backlog", "Backlog", Rows],
  ["board", "Boards", Kanban],
  ["qa", "QA & Tests", TestTube],
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
      <aside className="login-side">
        <div className="login-brand">
          <div className="brand-mark">A</div>
          <span>Atlas <strong>Delivery Hub</strong></span>
        </div>
        <div className="login-hero">
          <h2>Delivery clarity for every stakeholder.</h2>
          <p>Track the Atlas Payroll rollout from requirements to go-live — backlog, boards, QA readiness, and client-ready sprint presentations in one shared workspace.</p>
          <ul>
            <li><Kanban weight="duotone" /><span>Live backlog, Kanban boards, and full work-item traceability</span></li>
            <li><PresentationChart weight="duotone" /><span>Sprint presentations generated from real delivery data</span></li>
            <li><TestTube weight="duotone" /><span>QA scenarios linked to every imported user story</span></li>
          </ul>
        </div>
        <div className="login-side-foot">Atlas Payroll · Delivery to go-live</div>
      </aside>
      <div className="login-main">
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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "/" || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
      event.preventDefault();
      document.getElementById("global-search")?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          <div className="search-wrap"><MagnifyingGlass size={18} /><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search work items, epics, features..." />{query ? <button onClick={() => setQuery("")}><X size={15} /></button> : <kbd>/</kbd>}{searchMatches.length > 0 && <div className="search-results">{searchMatches.map((item) => <button key={item.id} onClick={() => { openItem(item.id); setQuery(""); }}><TypeIcon type={item.type} /><span><strong>{item.id}</strong>{item.title}</span></button>)}</div>}</div>
          <button className="primary-button" onClick={() => openCreate()}><Plus size={18} />Create work item</button>
          <button className="icon-button"><Bell /></button>
          <div className="avatar">SU</div>
        </header>
        <div className={`page ${selected ? "with-detail" : ""}`}>
          {page === "overview" && <Overview state={state} project={project} openItem={openItem} navigate={navigate} />}
          {page === "presentation" && <SprintPresentation state={state} setState={setState} project={project} showToast={showToast} />}
          {page === "backlog" && <Backlog state={state} openItem={openItem} openCreate={openCreate} />}
          {page === "board" && <Board state={state} openItem={openItem} updateItem={updateItem} openCreate={openCreate} />}
          {page === "qa" && <QA state={state} setState={setState} openItem={openItem} showToast={showToast} />}
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
  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
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
    <section className="timeline"><TimelineStep label="Phase 1 · Discovery" state="done" /><TimelineStep label="Phase 2 · Payroll Delivery" state="current" /><TimelineStep label="Phase 3 · Integration & UAT" /><TimelineStep label="Go-Live" /></section>
    <div className="overview-grid">
      <section className="panel module-status"><PanelHeader title="Module status" action="View backlog" onAction={() => navigate("backlog")} /><div className="table-scroll"><table><thead><tr><th>Module</th><th>Progress</th><th>Status</th><th>Scope</th><th>QA readiness</th><th>Target</th></tr></thead><tbody>{features.map((feature) => { const tests = state.tests.filter((test) => test.featureId === feature.id); const ready = tests.length ? Math.round(tests.filter((test) => test.status === "Passed").length / tests.length * 100) : 0; return <tr key={feature.id} onClick={() => openItem(feature.id)}><td><div className="item-title"><TypeIcon type="Feature" /><div><strong>{feature.title}</strong><small>{feature.id}</small></div></div></td><td><strong>{feature.progress}%</strong><ProgressBar value={feature.progress} /></td><td><Status value={feature.status} /></td><td><span className={`scope-status ${feature.scopeStatus === "At Risk" ? "at-risk" : ""}`}>{feature.scopeStatus || "On Track"}</span></td><td>{ready}% ready</td><td>{feature.targetDate ? new Date(`${feature.targetDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}</td></tr>; })}</tbody></table></div></section>
      <section className="panel hierarchy-summary"><PanelHeader title="Work hierarchy" action="Open full hierarchy" onAction={() => navigate("backlog")} /><HierarchySummary state={state} openItem={openItem} /></section>
    </div>
    <div className="health-grid">
      <section className="panel"><PanelHeader title="Delivery health" /><div className="health-list"><HealthRow label="Scope" value="On track" tone="green" detail={`${features.length} features in focused scope`} /><HealthRow label="Schedule" value="Watch" tone="amber" detail="Business-rule clarification items remain" /><HealthRow label="Quality" value={`${qaPassed}/${state.tests.length} passed`} tone="blue" detail={`${qaRun} tests started`} /><HealthRow label="Workload" value={`${tasks.filter((item) => item.status !== "Closed").length} open tasks`} tone="blue" detail={`${stories.length} user stories`} /></div></section>
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
  const features = state.workItems.filter((item) => item.type === "Feature" && item.parentId === epic.id);
  return <div className="hierarchy-list"><button onClick={() => openItem(epic.id)}><CaretDown /><TypeIcon type="Epic" /><strong>{epic.id}</strong><span>{epic.title}</span></button>{features.map((item) => <button key={item.id} onClick={() => openItem(item.id)}><CaretRight /><TypeIcon type="Feature" /><strong>{item.id}</strong><span>{item.title}</span><em>{item.progress}%</em></button>)}</div>;
}

function Backlog({ state, openItem, openCreate }) {
  const [expanded, setExpanded] = useState(() => new Set(["EPIC-PAYROLL", ...state.workItems.filter((item) => item.type === "Feature").map((item) => item.id)]));
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [phaseFilter, setPhaseFilter] = useState("All phases");
  const [moscowFilter, setMoscowFilter] = useState("All MoSCoW");
  const [dependencyFilter, setDependencyFilter] = useState("");
  const [search, setSearch] = useState("");
  const phases = [...new Set(state.workItems.map((item) => item.phase).filter(Boolean))];
  const children = useMemo(() => { const map = new Map(); state.workItems.forEach((item) => { const list = map.get(item.parentId) || []; list.push(item); map.set(item.parentId, list); }); return map; }, [state.workItems]);
  const toggle = (id) => setExpanded((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const visible = [];
  const filtering = search || typeFilter !== "All" || statusFilter !== "All" || phaseFilter !== "All phases" || moscowFilter !== "All MoSCoW" || dependencyFilter;
  const walk = (parentId, depth) => (children.get(parentId) || []).forEach((item) => {
    const dependencies = item.dependencies || [];
    const match = (typeFilter === "All" || item.type === typeFilter)
      && (statusFilter === "All" || item.status === statusFilter)
      && (phaseFilter === "All phases" || item.phase === phaseFilter)
      && (moscowFilter === "All MoSCoW" || item.moscow === moscowFilter)
      && (!dependencyFilter || dependencies.some((dependency) => dependency.toLowerCase().includes(dependencyFilter.toLowerCase())))
      && (!search || `${item.id} ${item.title}`.toLowerCase().includes(search.toLowerCase()));
    if (match || !filtering) visible.push({ item, depth });
    if ((expanded.has(item.id) || filtering) && (typeFilter === "All" || filtering)) walk(item.id, depth + 1);
  });
  walk(null, 0);
  return <div className="content backlog-page"><div className="page-heading"><div><span className="eyebrow">TEAM EXECUTION</span><h1>Backlog</h1><p>Plan and maintain the complete Epic → Feature → User Story → Task hierarchy.</p></div><button className="primary-button" onClick={() => openCreate()}><Plus />New work item</button></div>
    <div className="toolbar backlog-filters"><div className="inline-search"><MagnifyingGlass /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter backlog" /></div><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option>Epic</option><option>Feature</option><option>User Story</option><option>Task</option><option>Bug</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}><option>All phases</option>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select><select value={moscowFilter} onChange={(event) => setMoscowFilter(event.target.value)}><option>All MoSCoW</option><option>Must Have</option><option>Should Have</option><option>Could Have</option><option>Won't Have</option></select><div className="dependency-search"><LinkSimple /><input value={dependencyFilter} onChange={(event) => setDependencyFilter(event.target.value)} placeholder="Dependency ID" /></div><button className="tertiary-button" onClick={() => setExpanded(new Set(state.workItems.map((item) => item.id)))}>Expand all</button><button className="tertiary-button" onClick={() => setExpanded(new Set())}>Collapse all</button></div>
    <div className="panel backlog-table table-scroll"><table><thead><tr><th className="id-column">ID</th><th>Title</th><th>State</th><th>Phase</th><th>MoSCoW</th><th>Assigned to</th><th>Sprint</th><th>Dependencies</th><th>Progress</th></tr></thead><tbody>{visible.map(({ item, depth }) => { const hasChildren = (children.get(item.id) || []).length > 0; return <tr key={item.id} onClick={() => openItem(item.id)}><td><div className="backlog-id" style={{ paddingLeft: depth * 20 }} onClick={(event) => { if (hasChildren) { event.stopPropagation(); toggle(item.id); } }}>{hasChildren ? expanded.has(item.id) ? <CaretDown /> : <CaretRight /> : <span className="caret-space" />}<TypeIcon type={item.type} /><strong>{item.id}</strong></div></td><td><div className="title-cell"><strong>{item.title}</strong>{item.type === "User Story" && item.qaFocus?.length > 0 && <small>{item.acceptanceCriteria.length} acceptance · {item.qaFocus.length} QA checks</small>}</div></td><td><Status value={item.status} /></td><td><span className={`phase-pill phase-${(item.phase || "none").toLowerCase().replaceAll(" ", "-")}`}>{item.phase || "—"}</span></td><td>{item.moscow ? <span className={`moscow-pill moscow-${item.moscow.toLowerCase().replaceAll(" ", "-").replace("'", "")}`}>{item.moscow}</span> : "—"}</td><td><span className="assignee"><span>{(item.assignee || "U").slice(0, 1)}</span>{item.assignee}</span></td><td>{item.sprint}</td><td>{item.dependencies?.length ? <span className="dependency-count"><LinkSimple />{item.dependencies.length}</span> : "—"}</td><td><div className="progress-cell"><ProgressBar value={item.progress} /><span>{item.progress || 0}%</span></div></td></tr>; })}</tbody></table>{visible.length === 0 && <Empty title="No matching work items" text="Adjust the filters or create a new item." />}</div>
  </div>;
}

function Board({ state, openItem, updateItem, openCreate }) {
  const [feature, setFeature] = useState("All");
  const [sprint, setSprint] = useState("All sprints");
  const [phase, setPhase] = useState("All phases");
  const [dependency, setDependency] = useState("");
  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
  const sprints = [...new Set(state.workItems.filter((item) => item.type === "User Story").map((item) => item.sprint).filter((value) => value && value !== "Backlog"))];
  const phases = [...new Set(state.workItems.map((item) => item.phase).filter(Boolean))];
  const allStories = state.workItems.filter((item) => item.type === "User Story" && (feature === "All" || item.parentId === feature) && (phase === "All phases" || item.phase === phase) && (!dependency || item.dependencies?.some((value) => value.toLowerCase().includes(dependency.toLowerCase()))));
  const unplanned = allStories.filter((item) => !item.sprint || item.sprint === "Backlog");
  const stories = allStories.filter((item) => item.sprint && item.sprint !== "Backlog" && (sprint === "All sprints" || item.sprint === sprint));
  const drop = async (event, status) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (id) await updateItem(id, { status, progress: status === "Closed" ? 100 : status === "Resolved" ? 80 : status === "Active" ? 50 : 0 }, `Moved ${id} to ${status}`); };
  const card = (item) => <article key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => openItem(item.id)}><div className="card-type"><TypeIcon type="User Story" /><strong>{item.id}</strong><span className={`moscow-mini ${item.moscow?.toLowerCase().replaceAll(" ", "-").replace("'", "")}`}>{item.moscow}</span><span className={`priority-dot priority-${item.priority.toLowerCase()}`} /></div><h3>{item.title}</h3><p>{item.description}</p>{item.dependencies?.length > 0 && <div className="card-dependencies"><LinkSimple />{item.dependencies.join(", ")}</div>}<footer><span className="avatar small">{item.assignee.slice(0, 2).toUpperCase()}</span><span>{item.storyPoints} pts</span><span>{item.sprint || "Backlog"}</span></footer></article>;
  return <div className="content board-page"><div className="page-heading"><div><span className="eyebrow">KANBAN</span><h1>User stories board</h1><p>Filter delivery by sprint and phase, while keeping unplanned work visible outside committed sprint columns.</p></div><button className="primary-button" onClick={() => openCreate({ type: "User Story" })}><Plus />New user story</button></div><div className="toolbar board-filters"><select value={feature} onChange={(event) => setFeature(event.target.value)}><option value="All">All features</option>{features.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><select value={sprint} onChange={(event) => setSprint(event.target.value)}><option>All sprints</option>{sprints.map((value) => <option key={value}>{value}</option>)}</select><select value={phase} onChange={(event) => setPhase(event.target.value)}><option>All phases</option>{phases.map((value) => <option key={value}>{value}</option>)}</select><div className="dependency-search"><LinkSimple /><input value={dependency} onChange={(event) => setDependency(event.target.value)} placeholder="Dependency ID" /></div><span className="toolbar-count">{stories.length} planned · {unplanned.length} unplanned</span></div>{unplanned.length > 0 ? <section className="unplanned-board"><header><div><Briefcase /><span><strong>Unplanned user stories</strong><small>Not assigned to a sprint</small></span></div><button onClick={() => openCreate({ type: "User Story", parentId: "FEAT-UNPLANNED", sprint: "Backlog", phase: "Unplanned" })}><Plus />Add unplanned story</button></header><div>{unplanned.map(card)}</div></section> : <section className="unplanned-empty"><div><Briefcase /><span><strong>No unplanned stories</strong><small>New uncommitted work will appear here.</small></span></div><button onClick={() => openCreate({ type: "User Story", parentId: "FEAT-UNPLANNED", sprint: "Backlog", phase: "Unplanned" })}><Plus />Add unplanned story</button></section>}<div className="kanban">{statuses.map((status) => { const items = stories.filter((item) => item.status === status); return <section className="kanban-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, status)}><header><h2>{status}</h2><span>{items.length}</span></header><div className="kanban-items">{items.map(card)}<button className="add-card" onClick={() => openCreate({ type: "User Story", status, sprint: sprint === "All sprints" ? "Backlog" : sprint, phase: phase === "All phases" ? "Phase 2" : phase })}><Plus />New user story</button></div></section>; })}</div></div>;
}

const testCaseColumns = ["Test Case ID", "User Story ID", "Test Case Title", "Preconditions", "Test Steps", "Expected Result", "Priority", "Status", "Assignee", "Sprint", "Tags"];

function downloadTestTemplate() { window.location.assign("/templates/Atlas_Test_Case_Import_Template.xlsx"); }

async function exportTestCases(tests) {
  const XLSX = await import("xlsx");
  const rows = tests.map((test) => ({
    "Test Case ID": test.id,
    "User Story ID": test.storyId,
    "Test Case Title": test.title,
    Preconditions: test.preconditions || "",
    "Test Steps": (test.steps || []).join(" | "),
    "Expected Result": test.expectedResult || "",
    Priority: test.priority,
    Status: test.status,
    Assignee: test.assignee,
    Sprint: test.sprint || "Backlog",
    Tags: (test.tags || []).join(", "),
  }));
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: testCaseColumns });
  sheet["!cols"] = testCaseColumns.map((column) => ({ wch: Math.min(45, Math.max(14, column.length + 4)) }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Test Cases");
  XLSX.writeFile(workbook, "Atlas_Test_Cases.xlsx");
}

function QA({ state, setState, openItem, showToast }) {
  const [filter, setFilter] = useState("All");
  const [importOpen, setImportOpen] = useState(false);
  const tests = state.tests.filter((test) => filter === "All" || test.status === filter);
  const update = async (id, status) => { const test = await api(`/api/tests/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status }) }); setState((current) => ({ ...current, tests: current.tests.map((entry) => entry.id === id ? test : entry) })); showToast(`${id} marked ${status}`); };
  const passed = state.tests.filter((test) => test.status === "Passed").length;
  const started = state.tests.filter((test) => test.status !== "Not Run").length;
  return <div className="content"><div className="page-heading"><div><span className="eyebrow">QUALITY ASSURANCE</span><h1>QA & test center</h1><p>Import Excel test cases against a User Story, update execution, and export the complete QA pack.</p></div><div className="page-actions"><button className="secondary-button" onClick={downloadTestTemplate}><FileXls />Excel template</button><button className="secondary-button" onClick={() => exportTestCases(state.tests)}><DownloadSimple />Export Excel</button><button className="primary-button" onClick={() => setImportOpen(true)}><UploadSimple />Import test cases</button></div></div><div className="metrics-row"><Metric label="Total tests" value={state.tests.length} detail="Source and imported cases" icon={TestTube} /><Metric label="Execution started" value={`${Math.round(started / state.tests.length * 100)}%`} detail={`${started} tests`} tone="amber" icon={Clock} /><Metric label="Passed" value={passed} detail={`${Math.round(passed / state.tests.length * 100)}% coverage`} tone="green" icon={CheckCircle} /><Metric label="User stories" value={state.workItems.filter((item) => item.type === "User Story").length} detail="Import target coverage" tone="purple" icon={BookOpenText} /></div><div className="toolbar"><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Not Run</option><option>In Progress</option><option>Passed</option><option>Failed</option></select><span className="toolbar-count">{tests.length} test cases</span></div><div className="panel table-scroll qa-table"><table><thead><tr><th>Test case</th><th>Scenario</th><th>User story</th><th>Sprint</th><th>Priority</th><th>Assignee</th><th>Status</th></tr></thead><tbody>{tests.map((test) => <tr key={test.id}><td><strong className="link" onClick={() => openItem(test.storyId)}>{test.id}</strong></td><td><strong>{test.title}</strong>{test.expectedResult && <small className="test-expected">Expected: {test.expectedResult}</small>}</td><td><button className="text-button" onClick={() => openItem(test.storyId)}>{test.storyId}</button></td><td>{test.sprint || "Backlog"}</td><td><span className={`priority priority-${test.priority.toLowerCase()}`}>{test.priority}</span></td><td>{test.assignee}</td><td><select className={`test-status test-${test.status.toLowerCase().replaceAll(" ", "-")}`} value={test.status} onChange={(event) => update(test.id, event.target.value)}><option>Not Run</option><option>In Progress</option><option>Passed</option><option>Failed</option></select></td></tr>)}</tbody></table></div>{importOpen && <TestCaseImportModal state={state} setState={setState} close={() => setImportOpen(false)} showToast={showToast} />}</div>;
}

function TestCaseImportModal({ state, setState, close, showToast }) {
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const validStories = new Set(state.workItems.filter((item) => item.type === "User Story").map((item) => item.id));
  const normalize = (row) => {
    const byKey = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]));
    return {
      id: String(byKey.testcaseid || byKey.id || "").trim(),
      storyId: String(byKey.userstoryid || byKey.storyid || byKey.usid || "").trim(),
      title: String(byKey.testcasetitle || byKey.title || byKey.scenario || "").trim(),
      preconditions: String(byKey.preconditions || byKey.precondition || "").trim(),
      steps: String(byKey.teststeps || byKey.steps || "").trim(),
      expectedResult: String(byKey.expectedresult || byKey.expected || "").trim(),
      priority: String(byKey.priority || "Medium").trim(),
      status: String(byKey.status || "Not Run").trim(),
      assignee: String(byKey.assignee || byKey.owner || "QA Team").trim(),
      sprint: String(byKey.sprint || "Backlog").trim(),
      tags: String(byKey.tags || "").trim(),
    };
  };
  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFilename(file.name); setErrors([]);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }).map(normalize).filter((row) => row.storyId || row.title);
      const validation = parsed.flatMap((row, index) => [
        ...(!row.storyId ? [{ row: index + 2, message: "User Story ID is required." }] : !validStories.has(row.storyId) ? [{ row: index + 2, message: `${row.storyId} is not a valid User Story.` }] : []),
        ...(!row.title ? [{ row: index + 2, message: "Test Case Title is required." }] : []),
      ]);
      setRows(parsed); setErrors(validation);
    } catch (parseError) {
      setRows([]); setErrors([{ row: "File", message: parseError.message }]);
    }
  };
  const importRows = async () => {
    setBusy(true);
    try {
      const result = await api("/api/tests/import", { method: "POST", body: JSON.stringify({ rows }) });
      setErrors(result.errors || []);
      setState((current) => ({ ...current, tests: result.tests }));
      showToast(`${result.created} test cases imported, ${result.updated} updated`);
      if (!result.errors?.length) close();
    } catch (requestError) { setErrors([{ row: "Import", message: requestError.message }]); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" onMouseDown={close}><section className="modal import-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">EXCEL IMPORT</span><h2>Import test cases to User Stories</h2></div><button className="icon-button" onClick={close}><X /></button></header><div className="import-drop"><FileXls size={32} weight="duotone" /><div><strong>{filename || "Choose Darla's Excel file or the Atlas template"}</strong><span>.xlsx, .xls, or .csv · First worksheet will be imported</span></div><label className="secondary-button">Choose file<input type="file" accept=".xlsx,.xls,.csv" onChange={chooseFile} /></label></div><div className="import-summary"><span><strong>{rows.length}</strong> rows found</span><span className={errors.length ? "red" : "green"}><strong>{errors.length}</strong> validation issues</span></div>{errors.length > 0 && <div className="import-errors">{errors.slice(0, 8).map((error, index) => <div key={index}><Warning size={15} /><span>Row {error.row}: {error.message}</span></div>)}</div>}{rows.length > 0 && <div className="table-scroll import-preview"><table><thead><tr><th>Test Case ID</th><th>User Story</th><th>Title</th><th>Status</th><th>Sprint</th></tr></thead><tbody>{rows.slice(0, 8).map((row, index) => <tr key={`${row.id}-${index}`}><td>{row.id || "Auto"}</td><td>{row.storyId}</td><td>{row.title}</td><td>{row.status}</td><td>{row.sprint}</td></tr>)}</tbody></table>{rows.length > 8 && <small>Previewing 8 of {rows.length} rows.</small>}</div>}<footer><button className="secondary-button" onClick={downloadTestTemplate}><DownloadSimple />Download format</button><button className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={busy || !rows.length || errors.length > 0} onClick={importRows}>{busy ? <SpinnerGap className="spin" /> : <UploadSimple />}Import {rows.length || ""} test cases</button></footer></section></div>;
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

const presentationSlides = [
  ["Client update", "Sprint review"],
  ["Executive readout", "What changed"],
  ["Sprint objective", "What we committed to"],
  ["Delivery status", "Where each module stands"],
  ["Completed work", "What is now done"],
  ["Work in progress", "What the team is advancing"],
  ["Quality snapshot", "How ready the work is"],
  ["Risks and decisions", "What needs attention"],
  ["Next sprint", "Where we go next"],
  ["Client actions", "What we need to keep moving"],
];

function SprintPresentation({ state, setState, project, showToast }) {
  const presentation = state.presentations?.[0];
  const [slideIndex, setSlideIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(presentation);

  useEffect(() => { if (presentation) setDraft(presentation); }, [presentation?.updatedAt]);
  useEffect(() => {
    if (!presenting) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight" || event.key === " ") setSlideIndex((current) => Math.min(presentationSlides.length - 1, current + 1));
      if (event.key === "ArrowLeft") setSlideIndex((current) => Math.max(0, current - 1));
      if (event.key === "Escape") setPresenting(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presenting]);

  if (!presentation || !draft) return <div className="content"><Empty title="No sprint presentation" text="Restart the server once to create the reusable sprint presentation." /></div>;

  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
  const stories = state.workItems.filter((item) => item.type === "User Story");
  const tasks = state.workItems.filter((item) => item.type === "Task");
  const metrics = {
    features,
    stories,
    tasks,
    closedStories: stories.filter((item) => item.status === "Closed"),
    activeStories: stories.filter((item) => item.status === "Active"),
    newStories: stories.filter((item) => item.status === "New"),
    passedTests: state.tests.filter((test) => test.status === "Passed"),
    activeTests: state.tests.filter((test) => test.status === "In Progress"),
    notRunTests: state.tests.filter((test) => test.status === "Not Run"),
  };
  metrics.completion = stories.length ? Math.round((metrics.closedStories.length + metrics.activeStories.length * .5) / stories.length * 100) : 0;
  metrics.qaStarted = state.tests.length ? Math.round((state.tests.length - metrics.notRunTests.length) / state.tests.length * 100) : 0;

  const save = async () => {
    setSaving(true); setError("");
    try {
      const updated = await api(`/api/presentations/${encodeURIComponent(draft.id)}`, { method: "PUT", body: JSON.stringify(draft) });
      setState((current) => ({ ...current, presentations: current.presentations.map((item) => item.id === updated.id ? updated : item) }));
      setEditing(false);
      showToast(`${updated.sprintName} presentation saved`);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const refreshNarrative = () => {
    const leading = [...features].sort((a, b) => b.progress - a.progress)[0];
    const trailing = [...features].sort((a, b) => a.progress - b.progress)[0];
    setDraft((current) => ({
      ...current,
      headline: `${leading?.title || "The leading module"} is setting the pace while the team closes the next set of delivery decisions.`,
      executiveSummary: `${metrics.closedStories.length} of ${stories.length} user stories are closed and ${metrics.activeStories.length} are active. ${leading?.title || "Core requirements"} is furthest along at ${leading?.progress || 0}%, while ${trailing?.title || "cross-module work"} needs the most attention at ${trailing?.progress || 0}%. QA execution has started on ${metrics.qaStarted}% of the linked scenarios.`,
      highlights: metrics.closedStories.slice(0, 3).map((item) => `${item.title} is complete and traceable to acceptance criteria and QA coverage.`),
    }));
    showToast("Narrative refreshed from current project data");
  };

  const slide = <SprintSlide index={slideIndex} presentation={draft} metrics={metrics} state={state} project={project} />;
  return <div className="content presentation-page">
    <div className="page-heading presentation-heading"><div><span className="eyebrow">CLIENT COMMUNICATION</span><h1>Sprint presentation</h1><p>A live, PowerPoint-style client update generated from the current delivery backlog and QA status.</p></div><div className="presentation-actions"><button className="secondary-button" onClick={() => setEditing(!editing)}><PencilSimple />{editing ? "Close editor" : "Edit update"}</button><button className="secondary-button" onClick={() => window.print()}><Printer />Print / PDF</button><button className="primary-button" onClick={() => setPresenting(true)}><Play weight="fill" />Present</button></div></div>
    {error && <div className="form-error"><Warning />{error}</div>}
    <div className={`presentation-workspace ${editing ? "editing" : ""}`}>
      <aside className="slide-rail">{presentationSlides.map(([kicker, title], index) => <button key={title} className={slideIndex === index ? "active" : ""} onClick={() => setSlideIndex(index)}><span>{index + 1}</span><div className="slide-thumb"><small>{kicker}</small><strong>{title}</strong><i /></div></button>)}</aside>
      <section className="slide-stage"><div className="slide-toolbar"><div><button className="icon-button" disabled={slideIndex === 0} onClick={() => setSlideIndex((value) => Math.max(0, value - 1))}><ArrowLeft /></button><span>{slideIndex + 1} / {presentationSlides.length}</span><button className="icon-button" disabled={slideIndex === presentationSlides.length - 1} onClick={() => setSlideIndex((value) => Math.min(presentationSlides.length - 1, value + 1))}><ArrowRight /></button></div><span>Updated {new Date(draft.updatedAt).toLocaleString()}</span><button className="tertiary-button" onClick={() => setPresenting(true)}><ArrowsOutSimple />Full screen</button></div>{slide}<div className="presenter-note"><NotePencil size={18} /><div><strong>Presenter note</strong><span>{draft.presenterNotes}</span></div></div></section>
      {editing && <PresentationEditor draft={draft} setDraft={setDraft} save={save} saving={saving} refreshNarrative={refreshNarrative} />}
    </div>
    {presenting && <div className="present-overlay"><button className="present-close" onClick={() => setPresenting(false)}><X /></button><div className="present-canvas">{slide}</div><div className="present-controls"><button disabled={slideIndex === 0} onClick={() => setSlideIndex((value) => Math.max(0, value - 1))}><ArrowLeft />Previous</button><span>{slideIndex + 1} / {presentationSlides.length}</span><button disabled={slideIndex === presentationSlides.length - 1} onClick={() => setSlideIndex((value) => Math.min(presentationSlides.length - 1, value + 1))}>Next<ArrowRight /></button></div></div>}
    <div className="print-deck">{presentationSlides.map((_, index) => <SprintSlide key={index} index={index} presentation={draft} metrics={metrics} state={state} project={project} />)}</div>
  </div>;
}

function PresentationEditor({ draft, setDraft, save, saving, refreshNarrative }) {
  const setList = (key, value) => setDraft({ ...draft, [key]: value.split("\n").map((item) => item.trim()).filter(Boolean) });
  return <aside className="presentation-editor"><header><div><span className="eyebrow">SPRINT UPDATE</span><h2>Edit client narrative</h2></div><button className="icon-button" onClick={refreshNarrative} title="Refresh narrative from project data"><TrendUp /></button></header><div className="editor-scroll"><div className="form-row"><label>Sprint name<input value={draft.sprintName} onChange={(event) => setDraft({ ...draft, sprintName: event.target.value })} /></label><label>Date range<input value={draft.dateRange} onChange={(event) => setDraft({ ...draft, dateRange: event.target.value })} /></label></div><label>Audience<input value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })} /></label><label>Headline<textarea rows="3" value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} /></label><label>Executive summary<textarea rows="5" value={draft.executiveSummary} onChange={(event) => setDraft({ ...draft, executiveSummary: event.target.value })} /></label><label>Sprint goal<textarea rows="4" value={draft.sprintGoal} onChange={(event) => setDraft({ ...draft, sprintGoal: event.target.value })} /></label><label>Highlights <small>One item per line</small><textarea rows="6" value={draft.highlights.join("\n")} onChange={(event) => setList("highlights", event.target.value)} /></label><label>Decisions needed <small>One item per line</small><textarea rows="6" value={draft.decisionsNeeded.join("\n")} onChange={(event) => setList("decisionsNeeded", event.target.value)} /></label><label>Next sprint goals <small>One item per line</small><textarea rows="6" value={draft.nextSprintGoals.join("\n")} onChange={(event) => setList("nextSprintGoals", event.target.value)} /></label><label>Client asks <small>One item per line</small><textarea rows="6" value={draft.clientAsks.join("\n")} onChange={(event) => setList("clientAsks", event.target.value)} /></label><label>Confidence<select value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: event.target.value })}><option>On Track</option><option>Watch</option><option>At Risk</option></select></label><label>Presenter note<textarea rows="4" value={draft.presenterNotes} onChange={(event) => setDraft({ ...draft, presenterNotes: event.target.value })} /></label></div><footer><button className="secondary-button" onClick={refreshNarrative}><TrendUp />Refresh from ADO</button><button className="primary-button" onClick={save} disabled={saving}>{saving ? <SpinnerGap className="spin" /> : <FloppyDisk />}Save update</button></footer></aside>;
}

function SprintSlide({ index, presentation, metrics, state, project }) {
  const slideNumber = String(index + 1).padStart(2, "0");
  const frame = (children, className = "") => <div className={`sprint-slide ${className}`}><div className="slide-brand"><span>ATLAS DELIVERY HUB</span><strong>{presentation.sprintName}</strong></div>{children}<div className="slide-footer"><span>{project.name} · {presentation.dateRange}</span><strong>{slideNumber}</strong></div></div>;
  if (index === 0) return frame(<div className="cover-content"><div className="slide-kicker">SPRINT REVIEW · CLIENT UPDATE</div><h2>{project.name}</h2><h3>{presentation.sprintName} Delivery Update</h3><p>{presentation.headline}</p><div className="cover-meta"><span>{presentation.dateRange}</span><span>{presentation.audience}</span></div></div>, "slide-cover");
  if (index === 1) return frame(<><SlideTitle kicker="EXECUTIVE READOUT" title={presentation.headline} /><div className="executive-layout"><div className="slide-narrative"><p>{presentation.executiveSummary}</p><div className={`confidence confidence-${presentation.confidence.toLowerCase().replaceAll(" ", "-")}`}><CheckCircle weight="fill" />Delivery confidence <strong>{presentation.confidence}</strong></div></div><div className="slide-metrics"><SlideMetric value={`${metrics.completion}%`} label="Overall progress" /><SlideMetric value={`${metrics.closedStories.length}/${metrics.stories.length}`} label="Stories closed" /><SlideMetric value={`${metrics.qaStarted}%`} label="QA started" /></div></div></>);
  if (index === 2) return frame(<><SlideTitle kicker="SPRINT OBJECTIVE" title="The sprint focuses the team on implementation-ready payroll requirements." /><div className="objective-goal"><span>SPRINT GOAL</span><p>{presentation.sprintGoal}</p></div><div className="objective-stats"><SlideMetric value={metrics.activeStories.length} label="Stories in progress" /><SlideMetric value={metrics.tasks.filter((item) => item.status !== "Closed").length} label="Open delivery tasks" /><SlideMetric value={state.risks.filter((risk) => risk.status !== "Closed").length} label="Open risks" /></div></>);
  if (index === 3) return frame(<><SlideTitle kicker="DELIVERY STATUS" title="Basic Pay and De Minimis lead current module progress." /><div className="slide-feature-table"><div className="slide-table-head"><span>Module</span><span>Progress</span><span>Scope</span><span>Target</span></div>{metrics.features.map((feature) => <div key={feature.id}><div><strong>{feature.title}</strong><small>{feature.id}</small></div><div className="slide-progress"><strong>{feature.progress}%</strong><ProgressBar value={feature.progress} /></div><span className={feature.scopeStatus === "At Risk" ? "slide-risk" : "slide-track"}>{feature.scopeStatus}</span><span>{new Date(`${feature.targetDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>)}</div></>);
  if (index === 4) return frame(<><SlideTitle kicker="COMPLETED THIS SPRINT" title="Completed stories now have delivery and QA traceability." /><div className="completed-layout"><div className="completed-count"><strong>{metrics.closedStories.length}</strong><span>stories closed</span><small>{metrics.tasks.filter((item) => item.status === "Closed").length} supporting tasks completed</small></div><div className="story-proof-list">{metrics.closedStories.slice(0, 5).map((story) => <div key={story.id}><CheckCircle weight="fill" /><div><strong>{story.title}</strong><span>{story.id} · {story.acceptanceCriteria.length} acceptance criteria</span></div></div>)}</div></div></>);
  if (index === 5) return frame(<><SlideTitle kicker="WORK IN PROGRESS" title="Active stories are concentrated in the core payroll setup flows." /><div className="active-story-grid">{metrics.activeStories.slice(0, 6).map((story) => <div key={story.id}><div><span>{story.id}</span><strong>{story.progress}%</strong></div><h4>{story.title}</h4><ProgressBar value={story.progress} /><small>{story.assignee} · {story.sprint}</small></div>)}</div></>);
  if (index === 6) return frame(<><SlideTitle kicker="QUALITY SNAPSHOT" title="Every imported story is linked to QA coverage before development handoff." /><div className="quality-layout"><div className="quality-metrics"><SlideMetric value={state.tests.length} label="Linked test scenarios" /><SlideMetric value={metrics.passedTests.length} label="Passed" /><SlideMetric value={metrics.activeTests.length} label="In progress" /></div><div className="quality-bars"><SlideQualityRow label="Execution started" value={metrics.qaStarted} /><SlideQualityRow label="Passing coverage" value={Math.round(metrics.passedTests.length / state.tests.length * 100)} /><SlideQualityRow label="Story traceability" value={100} /></div></div><div className="quality-callout"><TestTube weight="fill" /><p>The QA center retains {state.source.stories.reduce((total, story) => total + story.qaFocus.length, 0)} source-backed focus statements across Basic Pay, Company Loan, Bonus, De Minimis, and cross-module integration.</p></div></>);
  if (index === 7) return frame(<><SlideTitle kicker="RISKS AND DECISIONS" title="Three decisions protect the next sprint from avoidable rework." /><div className="decision-layout"><div><h4>Delivery risks</h4>{state.risks.slice(0, 3).map((risk, position) => <div className="slide-risk-row" key={risk.id}><span>{position + 1}</span><div><strong>{risk.title}</strong><small>{risk.impact} impact · {risk.owner}</small></div></div>)}</div><div><h4>Decisions needed</h4>{presentation.decisionsNeeded.slice(0, 4).map((decision, position) => <div className="slide-decision" key={decision}><span>{position + 1}</span><p>{decision}</p></div>)}</div></div></>);
  if (index === 8) return frame(<><SlideTitle kicker="NEXT SPRINT" title="The next sprint converts clarified requirements into build-ready work." /><div className="next-layout"><div className="next-goals"><h4>Planned outcomes</h4>{presentation.nextSprintGoals.slice(0, 4).map((goal, position) => <div key={goal}><span>{position + 1}</span><p>{goal}</p></div>)}</div><div className="upcoming-work"><h4>Next stories in the queue</h4>{metrics.newStories.slice(0, 4).map((story) => <div key={story.id}><span>{story.id}</span><strong>{story.title}</strong></div>)}</div></div></>);
  return frame(<><SlideTitle kicker="CLIENT ACTIONS" title="Clear owners and decisions keep the next sprint on track." /><div className="ask-table"><div><strong>Action needed</strong><strong>Owner</strong><strong>When</strong></div>{presentation.clientAsks.slice(0, 4).map((ask) => <div key={ask}><span>{ask}</span><span>Client + Product</span><span>Before next review</span></div>)}</div><div className="closing-line"><span>Delivery confidence</span><strong>{presentation.confidence}</strong><p>Next review · {presentation.dateRange}</p></div></>);
}

function SlideTitle({ kicker, title }) { return <div className="sprint-slide-title"><span>{kicker}</span><h2>{title}</h2></div>; }
function SlideMetric({ value, label }) { return <div className="slide-metric"><strong>{value}</strong><span>{label}</span></div>; }
function SlideQualityRow({ label, value }) { return <div><div><span>{label}</span><strong>{value}%</strong></div><ProgressBar value={value} /></div>; }

function Reports({ state, project }) {
  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
  const stories = state.workItems.filter((item) => item.type === "User Story");
  const byStatus = Object.fromEntries(statuses.map((status) => [status, stories.filter((item) => item.status === status).length]));
  return <div className="content reports-page"><div className="page-heading"><div><span className="eyebrow">REPORTING</span><h1>Project status report</h1><p>A client-ready summary with live delivery and QA data.</p></div><a className="primary-button" href="/api/export.csv"><DownloadSimple />Export work items</a></div><section className="report-cover"><div><span>ATLAS DELIVERY STATUS</span><h2>{project.name}</h2><p>{project.phase} · Updated {new Date().toLocaleDateString()}</p></div><div className="report-mark">A</div></section><div className="metrics-row"><Metric label="Epics" value={state.workItems.filter((item) => item.type === "Epic").length} icon={Briefcase} /><Metric label="Features" value={features.length} tone="purple" icon={Flag} /><Metric label="User stories" value={stories.length} tone="green" icon={BookOpenText} /><Metric label="Tasks" value={state.workItems.filter((item) => item.type === "Task").length} tone="amber" icon={CheckCircle} /></div><div className="report-grid"><section className="panel"><PanelHeader title="Story status" /><div className="status-chart">{statuses.map((status) => <div key={status}><span>{status}</span><div><i className={`chart-${status.toLowerCase()}`} style={{ width: `${stories.length ? byStatus[status] / stories.length * 100 : 0}%` }} /></div><strong>{byStatus[status]}</strong></div>)}</div></section><section className="panel"><PanelHeader title="Feature delivery" /><div className="feature-progress-list">{features.map((feature) => <div key={feature.id}><div><strong>{feature.title}</strong><span>{feature.progress}%</span></div><ProgressBar value={feature.progress} /></div>)}</div></section><section className="panel"><PanelHeader title="Current risk posture" /><div className="risk-list">{state.risks.map((risk, index) => <div className="risk" key={risk.id}><span className={`risk-number ${index === 0 ? "red" : "amber"}`}>{index + 1}</span><div><strong>{risk.title}</strong><small>{risk.status} · {risk.owner}</small></div></div>)}</div></section><section className="panel"><PanelHeader title="Readiness coverage" /><div className="coverage-list"><div><span>Acceptance criteria</span><strong>{state.source.stories.reduce((total, story) => total + story.acceptanceCriteria.length, 0)}</strong></div><div><span>Dev / QA tasks</span><strong>{state.source.stories.reduce((total, story) => total + story.tasks.length, 0)}</strong></div><div><span>QA scenarios</span><strong>{state.tests.length}</strong></div><div><span>Source blocks retained</span><strong>{state.source.document.length}</strong></div></div></section></div></div>;
}

function Settings({ state, setState, showToast }) {
  const [form, setForm] = useState({ name: "", description: "", phase: "Phase 1", targetMilestone: "Scope approval", targetDate: "" });
  const [error, setError] = useState("");
  const createProject = async (event) => { event.preventDefault(); setError(""); try { const project = await api("/api/projects", { method: "POST", body: JSON.stringify(form) }); const next = await api("/api/state"); setState(next); setForm({ name: "", description: "", phase: "Phase 1", targetMilestone: "Scope approval", targetDate: "" }); showToast(`Project ${project.name} created`); } catch (requestError) { setError(requestError.message); } };
  return <div className="content settings-page"><div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h1>Project settings</h1><p>Manage reusable project workspaces and shared-access configuration.</p></div></div><div className="settings-grid"><section className="panel settings-section"><PanelHeader title="Project workspaces" /><p>Atlas Delivery Hub supports multiple reusable project definitions. Work items can be associated with the active project.</p><div className="project-list">{state.projects.map((project) => <div key={project.id} className={project.id === state.activeProjectId ? "active" : ""}><div className="project-avatar">{project.name.slice(0, 1)}</div><div><strong>{project.name}</strong><small>{project.phase} · {project.targetMilestone}</small></div>{project.id === state.activeProjectId && <span>Active</span>}</div>)}</div></section><section className="panel settings-section"><PanelHeader title="Create project" /><form className="settings-form" onSubmit={createProject}><label>Project name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Customer Portal" /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="form-row"><label>Current phase<select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}><option>Phase 1</option><option>Phase 2</option><option>Phase 3</option></select></label><label>Target date<input type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></label></div><label>Target milestone<input value={form.targetMilestone} onChange={(event) => setForm({ ...form, targetMilestone: event.target.value })} /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button"><Plus />Create project</button></form></section><section className="panel settings-section access-card"><PanelHeader title="Shared access" /><div className="access-icon"><Users size={28} weight="duotone" /></div><h3>One credential, shared state</h3><p>All users sign in with one server-managed credential. Updates persist centrally and are immediately available to the next user.</p><div className="access-note"><Warning size={18} /><span>Change <code>ATLAS_USERNAME</code> and <code>ATLAS_PASSWORD</code> before exposing this service beyond a trusted internal network.</span></div></section></div></div>;
}

function DetailPanel({ item, state, close, updateItem, refresh, openItem, openCreate, showToast }) {
  const [tab, setTab] = useState("details");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [editingTestId, setEditingTestId] = useState(null);
  const [testDraft, setTestDraft] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { setDraft(item); setEditing(false); setEditingTestId(null); setTab("details"); }, [item.id]);
  const children = state.workItems.filter((child) => child.parentId === item.id);
  const tests = state.tests.filter((test) => test.storyId === item.id);
  const activities = state.activities.filter((entry) => entry.itemId === item.id);
  const save = async () => { try { await updateItem(item.id, draft); setEditing(false); } catch (requestError) { setError(requestError.message); } };
  const editTest = (test) => { setEditingTestId(test.id); setTestDraft({ ...test }); };
  const saveTest = async () => { try { await api(`/api/tests/${encodeURIComponent(testDraft.id)}`, { method: "PUT", body: JSON.stringify(testDraft) }); await refresh(); setEditingTestId(null); showToast(`${testDraft.id} updated`); } catch (requestError) { setError(requestError.message); } };
  const remove = async () => { if (!window.confirm(`Delete ${item.id}? This cannot be undone.`)) return; try { await api(`/api/work-items/${encodeURIComponent(item.id)}`, { method: "DELETE" }); close(); await refresh(); showToast(`${item.id} deleted`); } catch (requestError) { setError(requestError.message); } };
  return <aside className="detail-panel"><header><div><TypeIcon type={item.type} /><span>{item.type.toUpperCase()}</span><strong>{item.id}</strong></div><button className="icon-button" onClick={close}><X /></button></header><div className="detail-scroll"><h2>{item.title}</h2><div className="detail-meta"><Status value={item.status} /><span><User />{item.assignee}</span><span><Flag />{item.priority}</span></div><div className="detail-tabs">{["details", "criteria", "children", "tests", "history"].map((value) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value === "criteria" ? `Acceptance (${item.acceptanceCriteria?.length || 0})` : value === "children" ? `Children (${children.length})` : value === "tests" ? `Tests (${tests.length})` : value[0].toUpperCase() + value.slice(1)}</button>)}</div>{error && <div className="form-error">{error}</div>}
    {tab === "details" && (editing ? <div className="detail-form"><label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Description<textarea rows="4" value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><div className="form-row"><label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value, progress: event.target.value === "Closed" ? 100 : draft.progress })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label></div><div className="form-row"><label>Phase<select value={draft.phase || "Phase 1"} onChange={(event) => setDraft({ ...draft, phase: event.target.value })}><option>Phase 1</option><option>Phase 2</option><option>Phase 3</option><option>Unplanned</option></select></label>{(item.type === "Feature" || item.type === "User Story") ? <label>MoSCoW<select value={draft.moscow || "Should Have"} onChange={(event) => setDraft({ ...draft, moscow: event.target.value })}><option>Must Have</option><option>Should Have</option><option>Could Have</option><option>Won't Have</option></select></label> : <label>Type<input disabled value={item.type} /></label>}</div><div className="form-row"><label>Assignee<input value={draft.assignee || ""} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} /></label><label>Sprint<input value={draft.sprint || ""} onChange={(event) => setDraft({ ...draft, sprint: event.target.value })} placeholder="Backlog for unplanned" /></label></div><div className="form-row"><label>Story points<input type="number" value={draft.storyPoints || 0} onChange={(event) => setDraft({ ...draft, storyPoints: Number(event.target.value) })} /></label><label>Progress<input type="number" min="0" max="100" value={draft.progress || 0} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} /></label></div><label>Dependencies <small>One Work Item ID per line</small><textarea rows="4" value={(draft.dependencies || []).join("\n")} onChange={(event) => setDraft({ ...draft, dependencies: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} placeholder="US-BASIC-001" /></label><label>Acceptance criteria <small>One criterion per line</small><textarea rows="6" value={(draft.acceptanceCriteria || []).join("\n")} onChange={(event) => setDraft({ ...draft, acceptanceCriteria: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label><label>QA focus <small>One test focus per line</small><textarea rows="6" value={(draft.qaFocus || []).join("\n")} onChange={(event) => setDraft({ ...draft, qaFocus: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label><label>Source trace<textarea rows="3" value={draft.sourceTrace || ""} onChange={(event) => setDraft({ ...draft, sourceTrace: event.target.value })} /></label></div> : <div className="detail-content"><Section title="Description"><p>{item.description || "No description supplied."}</p></Section>{item.persona && <Section title="User story"><p><strong>{item.persona}</strong> {item.need} {item.benefit}</p></Section>}<Section title="Planning"><dl><div><dt>Phase</dt><dd>{item.phase || "—"}</dd></div><div><dt>MoSCoW</dt><dd>{item.moscow || "—"}</dd></div><div><dt>Sprint</dt><dd>{item.sprint || "Backlog"}</dd></div><div><dt>Story points</dt><dd>{item.storyPoints || "—"}</dd></div><div><dt>Complexity</dt><dd>{item.complexity || "—"}</dd></div><div><dt>Progress</dt><dd>{item.progress || 0}%</dd></div></dl><ProgressBar value={item.progress} /></Section><Section title="Dependencies">{item.dependencies?.length ? <div className="tags dependency-tags">{item.dependencies.map((dependency) => { const linked = state.workItems.some((entry) => entry.id === dependency); return linked ? <button key={dependency} onClick={() => openItem(dependency)}><LinkSimple />{dependency}</button> : <span key={dependency}>{dependency}</span>; })}</div> : <p>No dependencies recorded.</p>}</Section><Section title="Source trace"><p>{item.sourceTrace || "Created in Atlas Delivery Hub"}</p></Section></div>)}
    {tab === "criteria" && <div className="check-list">{item.acceptanceCriteria?.length ? item.acceptanceCriteria.map((criterion, index) => <div key={index}><CheckCircle size={20} weight="fill" /><p>{criterion}</p></div>) : <Empty title="No acceptance criteria" text="Edit this item to add delivery conditions." />}{item.qaFocus?.length > 0 && <><h3>QA focus</h3>{item.qaFocus.map((focus, index) => <div key={index}><TestTube size={20} /><p>{focus}</p></div>)}</>}</div>}
    {tab === "children" && <div className="child-list">{children.map((child) => <button key={child.id} onClick={() => openItem(child.id)}><TypeIcon type={child.type} /><div><strong>{child.id}</strong><span>{child.title}</span></div><Status value={child.status} /></button>)}{children.length === 0 && <Empty title="No child items" text="Add a child work item to break down the scope." />}<button className="secondary-button full" onClick={() => openCreate({ parentId: item.id, type: item.type === "Epic" ? "Feature" : item.type === "Feature" ? "User Story" : "Task" })}><Plus />Add child work item</button></div>}
    {tab === "tests" && <div className="child-list">{tests.map((test) => editingTestId === test.id ? <div className="inline-test-editor" key={test.id}><label>Test title<input value={testDraft.title} onChange={(event) => setTestDraft({ ...testDraft, title: event.target.value })} /></label><label>Preconditions<textarea rows="2" value={testDraft.preconditions || ""} onChange={(event) => setTestDraft({ ...testDraft, preconditions: event.target.value })} /></label><label>Steps<textarea rows="3" value={(testDraft.steps || []).join("\n")} onChange={(event) => setTestDraft({ ...testDraft, steps: event.target.value.split("\n").filter(Boolean) })} /></label><label>Expected result<textarea rows="2" value={testDraft.expectedResult || ""} onChange={(event) => setTestDraft({ ...testDraft, expectedResult: event.target.value })} /></label><div><button className="secondary-button" onClick={() => setEditingTestId(null)}>Cancel</button><button className="primary-button" onClick={saveTest}><Check />Save test</button></div></div> : <div className="test-row" key={test.id}><TestTube /><div><strong>{test.id}</strong><span>{test.title}</span></div><div className="test-row-actions"><span className={`test-pill test-${test.status.toLowerCase().replaceAll(" ", "-")}`}>{test.status}</span><button className="text-button" onClick={() => editTest(test)}>Edit</button></div></div>)}{tests.length === 0 && <Empty title="No linked tests" text="Import test cases from Excel or add QA focus while editing the User Story." />}</div>}
    {tab === "history" && <div className="history-list">{activities.length ? activities.map((entry) => <div key={entry.id}><span /><div><strong>{entry.action}</strong><p>{entry.actor} · {new Date(entry.at).toLocaleString()}</p></div></div>) : <Empty title="No recorded changes" text="Updates to this item appear here." />}</div>}
  </div><footer>{editing ? <><button className="secondary-button" onClick={() => { setDraft(item); setEditing(false); }}>Cancel</button><button className="primary-button" onClick={save}><Check />Save changes</button></> : <><button className="danger-button" onClick={remove}><Trash />Delete</button><button className="primary-button" onClick={() => { setTab("details"); setEditing(true); }}>Edit work item</button></>}</footer></aside>;
}

function Section({ title, children }) { return <section><h3>{title}</h3>{children}</section>; }

function CreateModal({ state, defaults, close, onCreated }) {
  const [form, setForm] = useState({ type: defaults.type || "User Story", parentId: defaults.parentId || "", title: "", description: "", status: defaults.status || "New", priority: "Medium", moscow: "Should Have", phase: defaults.phase || "Phase 1", assignee: "Unassigned", sprint: defaults.sprint || "Backlog", storyPoints: 0, dependenciesText: "", acceptanceText: "", qaFocusText: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const validParents = state.workItems.filter((item) => form.type === "Epic" ? false : form.type === "Feature" ? item.type === "Epic" : form.type === "User Story" || form.type === "Bug" ? item.type === "Feature" : item.type === "User Story");
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const item = await api("/api/work-items", { method: "POST", body: JSON.stringify({ ...form, acceptanceCriteria: form.acceptanceText.split("\n").map((value) => value.trim()).filter(Boolean), qaFocus: form.qaFocusText.split("\n").map((value) => value.trim()).filter(Boolean), dependencies: form.dependenciesText.split("\n").map((value) => value.trim()).filter(Boolean) }) }); onCreated(item); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } };
  return <div className="modal-backdrop" onMouseDown={close}><form className="modal create-work-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">NEW WORK ITEM</span><h2>Create work item</h2></div><button type="button" className="icon-button" onClick={close}><X /></button></header><div className="form-row"><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, parentId: "" })}><option>Epic</option><option>Feature</option><option>User Story</option><option>Task</option><option>Bug</option></select></label><label>Parent<select disabled={form.type === "Epic"} value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><option value="">No parent</option>{validParents.map((item) => <option value={item.id} key={item.id}>{item.id} — {item.title}</option>)}</select></label></div><label>Title<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be delivered?" /></label><label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the outcome, context, or user need." /></label><div className="form-row"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label></div><div className="form-row"><label>Phase<select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}><option>Phase 1</option><option>Phase 2</option><option>Phase 3</option><option>Unplanned</option></select></label>{(form.type === "Feature" || form.type === "User Story") ? <label>MoSCoW<select value={form.moscow} onChange={(event) => setForm({ ...form, moscow: event.target.value })}><option>Must Have</option><option>Should Have</option><option>Could Have</option><option>Won't Have</option></select></label> : <label>Story points<input type="number" value={form.storyPoints} onChange={(event) => setForm({ ...form, storyPoints: Number(event.target.value) })} /></label>}</div><div className="form-row"><label>Assignee<input value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })} /></label><label>Sprint<input value={form.sprint} onChange={(event) => setForm({ ...form, sprint: event.target.value })} placeholder="Backlog for unplanned" /></label></div><label>Dependencies <small>One Work Item ID per line</small><textarea rows="3" value={form.dependenciesText} onChange={(event) => setForm({ ...form, dependenciesText: event.target.value })} /></label>{form.type === "User Story" && <><label>Acceptance criteria <small>One criterion per line</small><textarea rows="4" value={form.acceptanceText} onChange={(event) => setForm({ ...form, acceptanceText: event.target.value })} /></label><label>QA focus <small>One focus or test per line</small><textarea rows="4" value={form.qaFocusText} onChange={(event) => setForm({ ...form, qaFocusText: event.target.value })} /></label></>}{error && <div className="form-error"><Warning />{error}</div>}<footer><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : <Plus />}Create {form.type.toLowerCase()}</button></footer></form></div>;
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

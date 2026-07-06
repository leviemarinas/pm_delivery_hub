import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Pulse,
  Archive,
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowsOutSimple,
  Bell,
  ArrowsIn,
  ArrowsOut,
  ArrowSquareOut,
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
  Copy,
  DownloadSimple,
  EnvelopeSimple,
  FileDoc,
  FilePdf,
  FileText,
  FileXls,
  Globe,
  Flag,
  FloppyDisk,
  Gear,
  House,
  Kanban,
  Keyboard,
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
  ArrowUp,
  Quotes,
  Table,
  TreeStructure,
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
  ["requirements", "Requirements", BookOpenText],
  ["backlog", "Backlog", Rows],
  ["board", "Boards", Kanban],
  ["qa", "QA & Tests", TestTube],
  ["presentation", "Sprint Presentation", PresentationChart],
  ["reports", "Reports", ChartBar],
  ["links", "Project Links", LinkSimple],
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
  const [page, setPage] = useState(() => {
    const saved = window.localStorage.getItem("atlas-page");
    return navItems.some(([key]) => key === saved) ? saved : "overview";
  });
  const [selectedId, setSelectedId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState({});
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [notifSeen, setNotifSeen] = useState(() => Number(window.localStorage.getItem("atlas-notif-seen") || 0));

  useEffect(() => {
    const onKeyDown = (event) => {
      const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
      if (event.key === "/" && !inField) {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (event.key === "Escape" && !inField) {
        setSelectedId(null);
        setNotifOpen(false);
        setProjectMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const project = state.projects.find((entry) => entry.id === state.activeProjectId) || state.projects[0];
  const projectWorkItems = state.workItems.filter((item) => item.projectId === state.activeProjectId);
  const projectItemIds = new Set(projectWorkItems.map((item) => item.id));
  const projectStoryIds = new Set(projectWorkItems.filter((item) => item.type === "User Story").map((item) => item.id));
  const projectState = {
    ...state,
    workItems: projectWorkItems,
    tests: state.tests.filter((test) => test.projectId === state.activeProjectId || (!test.projectId && projectStoryIds.has(test.storyId))),
    risks: state.risks.filter((risk) => risk.projectId === state.activeProjectId),
    presentations: state.presentations.filter((presentation) => presentation.projectId === state.activeProjectId),
    activities: state.activities.filter((entry) => entry.itemId === state.activeProjectId || projectItemIds.has(entry.itemId)),
  };
  const selected = projectState.workItems.find((item) => item.id === selectedId);
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const refresh = async () => setState(await api("/api/state"));
  const openCreate = (defaults = {}) => { setCreateDefaults(defaults); setCreateOpen(true); };
  const openItem = (id) => { setSelectedId((current) => current === id ? null : id); };
  const switchProject = async (projectId) => {
    if (projectId === state.activeProjectId) { setProjectMenuOpen(false); return; }
    try {
      const next = await api("/api/projects/active", { method: "PUT", body: JSON.stringify({ activeProjectId: projectId }) });
      setState(next);
      setSelectedId(null);
      setProjectMenuOpen(false);
      showToast(`Switched to ${next.projects.find((entry) => entry.id === projectId)?.name || "workspace"}`);
    } catch (error) { showToast(error.message); }
  };
  const navigate = (next) => { setPage(next); setMobileNav(false); setSelectedId(null); setNotifOpen(false); window.localStorage.setItem("atlas-page", next); };
  const unseenCount = state.activities.filter((entry) => new Date(entry.at).getTime() > notifSeen).length;
  const toggleNotifications = () => {
    setNotifOpen((open) => {
      if (!open) { const now = Date.now(); setNotifSeen(now); window.localStorage.setItem("atlas-notif-seen", String(now)); }
      return !open;
    });
  };
  const searchMatches = query.trim().length > 1 ? projectState.workItems.filter((item) => `${item.id} ${item.title}`.toLowerCase().includes(query.toLowerCase())).slice(0, 7) : [];

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
        <div className="project-switch-wrap"><button className={`project-switch ${projectMenuOpen ? "open" : ""}`} onClick={() => setProjectMenuOpen((open) => !open)}><div><small>PROJECT</small><strong>{project.name}</strong></div><CaretDown size={14} /></button>{projectMenuOpen && <div className="project-switch-menu"><span>Switch workspace</span>{state.projects.map((entry) => <button key={entry.id} className={entry.id === state.activeProjectId ? "active" : ""} onClick={() => switchProject(entry.id)}><div className="project-avatar">{entry.name.slice(0, 1)}</div><div><strong>{entry.name}</strong><small>{entry.phase}</small></div>{entry.id === state.activeProjectId && <CheckCircle weight="fill" />}</button>)}</div>}</div>
        <nav>{navItems.map(([key, label, Icon]) => <button key={key} className={page === key ? "active" : ""} onClick={() => navigate(key)}><Icon size={20} weight={page === key ? "fill" : "regular"} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-mini"><User size={17} /><div><strong>Shared User</strong><small>Full access</small></div></div><button className="icon-button inverse" title="Sign out" onClick={onLogout}><SignOut /></button></div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileNav(true)}><ListBullets /></button>
          <div className="search-wrap"><MagnifyingGlass size={18} /><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search work items, epics, features..." />{query ? <button onClick={() => setQuery("")}><X size={15} /></button> : <kbd>/</kbd>}{searchMatches.length > 0 && <div className="search-results">{searchMatches.map((item) => <button key={item.id} onClick={() => { openItem(item.id); setQuery(""); }}><TypeIcon type={item.type} /><span><strong>{item.id}</strong>{item.title}</span></button>)}</div>}</div>
          <button className="primary-button" onClick={() => openCreate()}><Plus size={18} />Create work item</button>
          <div className="notif-wrap">
            <button className="icon-button" title="Recent activity" onClick={toggleNotifications}><Bell />{unseenCount > 0 && <span className="notif-badge">{Math.min(unseenCount, 9)}{unseenCount > 9 ? "+" : ""}</span>}</button>
            {notifOpen && <div className="notif-panel">
              <header><strong>Recent activity</strong><span>{state.activities.length} events</span></header>
              <div>{state.activities.slice(0, 8).map((entry) => {
                const linked = entry.itemId && state.workItems.some((item) => item.id === entry.itemId);
                return <button key={entry.id} onClick={() => { if (linked) openItem(entry.itemId); setNotifOpen(false); }}>
                  <div className="avatar small">{entry.actor.slice(0, 2).toUpperCase()}</div>
                  <div><strong>{entry.action}</strong><small>{entry.actor} · {new Date(entry.at).toLocaleString()}</small></div>
                </button>;
              })}</div>
            </div>}
          </div>
          <div className="avatar">SU</div>
        </header>
        <div className={`page ${selected ? "with-detail" : ""}`}>
          {page === "overview" && <Overview state={projectState} project={project} openItem={openItem} navigate={navigate} setState={setState} showToast={showToast} />}
          {page === "links" && <ProjectLinksPage state={projectState} setState={setState} project={project} showToast={showToast} />}
          {page === "presentation" && <SprintPresentation state={projectState} setState={setState} project={project} showToast={showToast} />}
          {page === "backlog" && <Backlog state={projectState} openItem={openItem} openCreate={openCreate} />}
          {page === "board" && <Board state={projectState} openItem={openItem} updateItem={updateItem} openCreate={openCreate} />}
          {page === "qa" && <QA state={projectState} setState={setState} openItem={openItem} showToast={showToast} />}
          {page === "requirements" && <Requirements state={projectState} setState={setState} showToast={showToast} project={project} />}
          {page === "reports" && <Reports state={projectState} project={project} />}
          {page === "settings" && <Settings state={state} setState={setState} showToast={showToast} />}
        </div>
      </main>
      {selected && <DetailPanel item={selected} state={projectState} close={() => setSelectedId(null)} updateItem={updateItem} refresh={refresh} openItem={openItem} openCreate={openCreate} showToast={showToast} />}
      {createOpen && <CreateModal state={projectState} defaults={createDefaults} close={() => setCreateOpen(false)} onCreated={async (item) => { await refresh(); setCreateOpen(false); setSelectedId(item.id); showToast(`${item.type} created`); }} />}
      {toast && <div className="toast"><Check size={18} weight="bold" />{toast}</div>}
    </div>
  );
}

function TypeIcon({ type, size = 18 }) {
  const Icon = typeIcons[type] || FileText;
  return <span className={`type-icon ${typeClass(type)}`}><Icon size={size} weight="fill" /></span>;
}

const linkKindOf = (url = "") => {
  const value = url.toLowerCase();
  if (value.includes("docs.google.com/spreadsheets") || /\.(xlsx|xls|csv)([?#]|$)/.test(value)) return { label: "Worksheet", tone: "kind-sheet", Icon: FileXls };
  if (value.includes("docs.google.com/presentation") || /\.(pptx|ppt)([?#]|$)/.test(value)) return { label: "Slides", tone: "kind-slides", Icon: PresentationChart };
  if (value.includes("docs.google.com/document") || /\.(docx|doc)([?#]|$)/.test(value)) return { label: "Document", tone: "kind-doc", Icon: FileDoc };
  if (value.includes("docs.google.com/forms")) return { label: "Form", tone: "kind-form", Icon: ClipboardText };
  if (/\.pdf([?#]|$)/.test(value)) return { label: "PDF", tone: "kind-pdf", Icon: FilePdf };
  if (value.includes("drive.google.com")) return { label: "Drive", tone: "kind-doc", Icon: FileText };
  if (value.includes("figma.com")) return { label: "Figma", tone: "kind-figma", Icon: SquaresFour };
  return { label: "Website", tone: "kind-site", Icon: Globe };
};

const domainOf = (url = "") => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

function LinkKindIcon({ url, size = 15 }) {
  const { tone, Icon, label } = linkKindOf(url);
  if (label === "Figma") {
    // scale figma logo proportional to the size argument (ratio 2:3)
    const w = Math.round(size * 0.7);
    const h = Math.round(w * 1.5);
    return (
      <span className={`link-kind-icon ${tone}`} title="Figma">
        <svg width={w} height={h} viewBox="0 0 18 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          <path d="M12 6C12 2.68629 9.31371 0 6 0C2.68629 0 0 2.68629 0 6C0 9.31371 2.68629 12 6 12H12V6Z" fill="#F24E1E"/>
          <path d="M12 18C12 14.6863 9.31371 12 6 12C2.68629 12 0 14.6863 0 18C0 21.3137 2.68629 24 6 24H12V18Z" fill="#A259FF"/>
          <path d="M0 30C0 26.6863 2.68629 24 6 24C9.31371 24 12 26.6863 12 30C12 33.3137 9.31371 36 6 36C2.68629 36 0 33.3137 0 30Z" fill="#0ACF83"/>
          <path d="M12 12C15.3137 12 18 9.31371 18 6C18 2.68629 15.3137 0 12 0V12Z" fill="#FF7262"/>
          <path d="M12 24C15.3137 24 18 21.3137 18 18C18 14.6863 15.3137 12 12 12V24Z" fill="#1ABC9C"/>
        </svg>
      </span>
    );
  }
  return <span className={`link-kind-icon ${tone}`}><Icon size={size} weight="duotone" /></span>;
}

function ProjectLinksPage({ state, project, setState, showToast }) {
  const links = project.links || [];
  const groups = project.linkGroups || ["General"];

  const [activeGroup, setActiveGroup] = useState(groups[0] || "General");
  const [selectedLinkId, setSelectedLinkId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", url: "", group: "General" });
  const [adding, setAdding] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [newGroupForm, setNewGroupForm] = useState("");
  const [renamingGroup, setRenamingGroup] = useState(false);
  const [renameGroupForm, setRenameGroupForm] = useState("");

  const [frameKey, setFrameKey] = useState(0);
  const [frameLoading, setFrameLoading] = useState(true);
  const [hintDismissed, setHintDismissed] = useState(() => window.localStorage.getItem("atlas-links-hint") === "1");

  useEffect(() => {
    if (!isMaximized) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") setIsMaximized(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMaximized]);

  useEffect(() => { setFrameLoading(true); }, [selectedLinkId, frameKey]);

  const groupCounts = links.reduce((map, link) => { const key = link.group || "General"; map[key] = (map[key] || 0) + 1; return map; }, {});
  const filteredLinks = links.filter((l) => (l.group || "General") === activeGroup);
  
  useEffect(() => {
    if (filteredLinks.length > 0) {
      const stillValid = filteredLinks.some((l) => l.id === selectedLinkId);
      if (!stillValid) {
        setSelectedLinkId(filteredLinks[0].id);
      }
    } else {
      setSelectedLinkId(null);
    }
  }, [activeGroup, links, selectedLinkId]);

  const selectedLink = links.find((l) => l.id === selectedLinkId);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.url) return;
    try {
      const targetGroup = form.group || activeGroup || "General";
      const newLink = { 
        id: `link-${Date.now()}`, 
        name: form.name.trim(), 
        url: form.url.trim(),
        group: targetGroup
      };
      const nextLinks = [...links, newLink];
      await updateProjectData(nextLinks, groups);
      setForm({ name: "", url: "", group: activeGroup });
      setAdding(false);
      setSelectedLinkId(newLink.id);
      showToast("Link added successfully");
    } catch (err) {
      showToast(`Error adding link: ${err.message}`);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.url) return;
    try {
      const nextLinks = links.map((l) => 
        l.id === editingId 
          ? { ...l, name: form.name.trim(), url: form.url.trim(), group: form.group || l.group || "General" } 
          : l
      );
      await updateProjectData(nextLinks, groups);
      setForm({ name: "", url: "", group: activeGroup });
      setEditingId(null);
      showToast("Link updated");
    } catch (err) {
      showToast(`Error updating link: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this link?")) return;
    try {
      const nextLinks = links.filter((l) => l.id !== id);
      await updateProjectData(nextLinks, groups);
      if (selectedLinkId === id) {
        const remainingFiltered = nextLinks.filter((l) => (l.group || "General") === activeGroup);
        setSelectedLinkId(remainingFiltered[0]?.id || null);
      }
      showToast("Link deleted");
    } catch (err) {
      showToast(`Error deleting link: ${err.message}`);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const groupName = newGroupForm.trim();
    if (!groupName) return;
    if (groups.includes(groupName)) {
      showToast("Group tab already exists.");
      return;
    }
    try {
      const nextGroups = [...groups, groupName];
      await updateProjectData(links, nextGroups);
      setNewGroupForm("");
      setAddingGroup(false);
      setActiveGroup(groupName);
      showToast("Tab group created");
    } catch (err) {
      showToast(`Error creating tab group: ${err.message}`);
    }
  };

  const handleRenameGroup = async (e) => {
    e.preventDefault();
    const newName = renameGroupForm.trim();
    if (!newName || newName === activeGroup) {
      setRenamingGroup(false);
      return;
    }
    if (groups.includes(newName)) {
      showToast("A tab group with this name already exists.");
      return;
    }
    try {
      const nextGroups = groups.map((g) => (g === activeGroup ? newName : g));
      const nextLinks = links.map((l) => ((l.group || "General") === activeGroup ? { ...l, group: newName } : l));
      
      await updateProjectData(nextLinks, nextGroups);
      setActiveGroup(newName);
      setRenamingGroup(false);
      showToast("Tab group renamed");
    } catch (err) {
      showToast(`Error renaming tab group: ${err.message}`);
    }
  };

  const handleDeleteGroup = async () => {
    if (activeGroup === "General") return;
    if (!window.confirm(`Delete the tab group "${activeGroup}"? All links in this group will be moved to General.`)) return;
    try {
      const nextGroups = groups.filter((g) => g !== activeGroup);
      const nextLinks = links.map((l) => ((l.group || "General") === activeGroup ? { ...l, group: "General" } : l));
      
      await updateProjectData(nextLinks, nextGroups);
      setActiveGroup("General");
      showToast("Tab group deleted");
    } catch (err) {
      showToast(`Error deleting tab group: ${err.message}`);
    }
  };

  const updateProjectData = async (nextLinks, nextGroups) => {
    const updated = await api(`/api/projects/${project.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...project, links: nextLinks, linkGroups: nextGroups }),
    });
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) => (p.id === project.id ? updated : p)),
    }));
  };

  const isEmbeddable = (url = "") => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (host.includes("docs.google.com") || host.includes("drive.google.com")) return true;
      if (host.includes("figma.com")) return true;
      if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) return true;
      const pathname = parsed.pathname.toLowerCase();
      if (
        pathname.endsWith(".pdf") || 
        pathname.endsWith(".xlsx") || 
        pathname.endsWith(".xls") || 
        pathname.endsWith(".docx") || 
        pathname.endsWith(".doc") || 
        pathname.endsWith(".pptx") || 
        pathname.endsWith(".ppt")
      ) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      if (host.includes("docs.google.com")) {
        if (parsed.pathname.includes("/edit")) {
          return url.replace(/\/edit(\?.*)?$/, "/preview");
        }
        if (parsed.pathname.includes("/d/")) {
          return url.split("/edit")[0] + "/preview";
        }
      }
      if (host.includes("figma.com")) {
        return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
      }
      if (host.includes("youtube.com") || host.includes("youtu.be")) {
        let videoId = "";
        if (host.includes("youtu.be")) {
          videoId = parsed.pathname.slice(1);
        } else {
          videoId = parsed.searchParams.get("v");
        }
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      const pathname = parsed.pathname.toLowerCase();
      if (
        pathname.endsWith(".pdf") || 
        pathname.endsWith(".xlsx") || 
        pathname.endsWith(".xls") || 
        pathname.endsWith(".docx") || 
        pathname.endsWith(".doc") || 
        pathname.endsWith(".pptx") || 
        pathname.endsWith(".ppt")
      ) {
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      }
    } catch (e) {
      // ignore
    }
    return url;
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard");
    } catch {
      showToast("Could not copy — clipboard unavailable");
    }
  };

  const startAdd = () => { setEditingId(null); setAdding(true); setForm({ name: "", url: "", group: activeGroup }); };
  const startEdit = (link) => { setAdding(false); setEditingId(link.id); setForm({ name: link.name, url: link.url, group: link.group || "General" }); };
  const dismissHint = () => { setHintDismissed(true); window.localStorage.setItem("atlas-links-hint", "1"); };

  const linkForm = (onSubmit, title, submitLabel, onCancel) => (
    <form onSubmit={onSubmit} className="link-form-card">
      <h3>{title}</h3>
      <label>Name / label
        <input autoFocus placeholder="e.g. Bug Inventory Summary" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </label>
      <label>Resource URL
        <input placeholder="https://docs.google.com/..." type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
      </label>
      <label>Tab group
        <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
      {form.url && <div className="link-form-preview"><LinkKindIcon url={form.url} /><span>Detected as <strong>{linkKindOf(form.url).label}</strong> · {domainOf(form.url)}</span></div>}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-button">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div className={`content links-page-container ${isMaximized ? "maximized" : ""}`}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE RESOURCE HUB</span>
          <h1>Project links & attachments</h1>
          <p>Attach worksheets, documents, decks, and reference sites. Preview them inline, organize them into tab groups, and open them in a click.</p>
        </div>
        <button className="primary-button" onClick={startAdd}><Plus />Add project link</button>
      </div>

      <div className="links-tab-bar">
        {groups.map((g) => (
          renamingGroup && activeGroup === g ? (
            <form key={g} onSubmit={handleRenameGroup} className="tab-inline-form">
              <input autoFocus value={renameGroupForm} onChange={(e) => setRenameGroupForm(e.target.value)} required />
              <button type="submit" className="confirm" title="Save name"><Check size={13} /></button>
              <button type="button" className="cancel" title="Cancel" onClick={() => setRenamingGroup(false)}><X size={13} /></button>
            </form>
          ) : (
            <button key={g} className={`links-tab-pill ${activeGroup === g ? "active" : ""}`} onClick={() => setActiveGroup(g)}>
              <span>{g}</span>
              <em>{groupCounts[g] || 0}</em>
              {activeGroup === g && g !== "General" && <span className="tab-pill-tools">
                <span role="button" tabIndex={0} title="Rename tab group" onClick={(e) => { e.stopPropagation(); setRenamingGroup(true); setRenameGroupForm(g); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setRenamingGroup(true); setRenameGroupForm(g); } }}><PencilSimple size={12} /></span>
                <span role="button" tabIndex={0} title="Delete tab group" className="danger" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleDeleteGroup(); } }}><Trash size={12} /></span>
              </span>}
            </button>
          )
        ))}
        {addingGroup ? (
          <form onSubmit={handleCreateGroup} className="tab-inline-form">
            <input autoFocus placeholder="New tab name…" value={newGroupForm} onChange={(e) => setNewGroupForm(e.target.value)} required />
            <button type="submit" className="confirm" title="Create tab"><Check size={13} /></button>
            <button type="button" className="cancel" title="Cancel" onClick={() => setAddingGroup(false)}><X size={13} /></button>
          </form>
        ) : (
          <button className="links-tab-pill add-tab-btn" onClick={() => { setAddingGroup(true); setNewGroupForm(""); }}>
            <Plus size={13} /><span>New tab</span>
          </button>
        )}
      </div>

      <div className="links-page-layout">
        <aside className="links-sidebar-panel panel">
          <PanelHeader title={`Resources · ${filteredLinks.length}`} action="Add link" onAction={startAdd} />
          <div className="links-sidebar-scroll">
            {adding && linkForm(handleAdd, "New resource link", "Add link", () => setAdding(false))}
            {editingId && linkForm(handleSaveEdit, "Edit resource", "Save changes", () => setEditingId(null))}
            {filteredLinks.length === 0 && !adding ? (
              <div className="links-empty">
                <LinkSimple size={26} weight="duotone" />
                <strong>Nothing in “{activeGroup}” yet</strong>
                <span>Add a worksheet, deck, or reference site to preview it here.</span>
                <button className="secondary-button" onClick={startAdd}><Plus size={15} />Add a link</button>
              </div>
            ) : (
              filteredLinks.map((link) => (
                <div key={link.id} className={`link-row ${selectedLinkId === link.id ? "active" : ""} ${editingId === link.id ? "editing" : ""}`}>
                  <button className="link-row-main" onClick={() => setSelectedLinkId(link.id)}>
                    <LinkKindIcon url={link.url} />
                    <span className="link-row-text"><strong>{link.name}</strong><small>{domainOf(link.url)}</small></span>
                  </button>
                  <div className="link-row-actions">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" title="Open in new tab" onClick={(e) => e.stopPropagation()}><ArrowSquareOut size={14} /></a>
                    <button onClick={() => startEdit(link)} title="Edit link"><PencilSimple size={14} /></button>
                    <button onClick={() => handleDelete(link.id)} className="delete" title="Delete link"><Trash size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="links-viewer-panel panel">
          {selectedLink ? (
            <div className="links-viewer-content">
              <div className="viewer-header">
                <div className="viewer-title">
                  <LinkKindIcon url={selectedLink.url} size={17} />
                  <div>
                    <h2>{selectedLink.name}</h2>
                    <span className="viewer-subtitle">{linkKindOf(selectedLink.url).label} · {domainOf(selectedLink.url)}</span>
                  </div>
                </div>
                <div className="viewer-actions">
                  <button className="icon-button" title="Copy link" onClick={() => copyLink(selectedLink.url)}><Copy size={17} /></button>
                  <button className="icon-button" title="Reload preview" onClick={() => setFrameKey((k) => k + 1)}><ArrowClockwise size={17} /></button>
                  <a href={selectedLink.url} target="_self" className="secondary-button" title="Open in this window, replacing the app">Same tab</a>
                  <a href={selectedLink.url} target="_blank" rel="noopener noreferrer" className="primary-button"><ArrowSquareOut size={16} />Open in new tab</a>
                  <button onClick={() => setIsMaximized(!isMaximized)} className="icon-button viewer-maximize" title={isMaximized ? "Restore view (Esc)" : "Maximize view"}>
                    {isMaximized ? <ArrowsIn size={17} /> : <ArrowsOut size={17} />}
                  </button>
                </div>
              </div>

               <div className="viewer-frame-container">
                {isEmbeddable(selectedLink.url) ? (
                  <>
                    {frameLoading && <div className="frame-loading"><SpinnerGap className="spin" size={26} /><span>Loading preview…</span></div>}
                    <iframe
                      key={`${selectedLink.id}-${frameKey}`}
                      src={getEmbedUrl(selectedLink.url)}
                      title={selectedLink.name}
                      className="embed-iframe"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      onLoad={() => setFrameLoading(false)}
                    />
                  </>
                ) : (
                  <div className="embed-fallback-card">
                    <div className="embed-fallback-icon">
                      <Globe size={26} />
                    </div>
                    <h3>Preview not available</h3>
                    <p>
                      Due to security restrictions on the target website, inline preview is not supported. Use the options below to open the link.
                    </p>
                    <div className="embed-fallback-actions">
                      <a href={selectedLink.url} target="_blank" rel="noopener noreferrer" className="primary-button">
                        <ArrowSquareOut size={16} />Open in new tab
                      </a>
                      <a href={selectedLink.url} target="_self" className="secondary-button">
                        Same tab
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {!hintDismissed && (
                <div className="embed-info-banner">
                  <Warning size={15} />
                  <span>Some apps (Google Sheets, Slides) may require sign-in or block embedding. If the preview stays blank, use <strong>Open in new tab</strong>.</span>
                  <button onClick={dismissHint} title="Dismiss hint"><X size={13} /></button>
                </div>
              )}
            </div>
          ) : (
            <Empty title="No resource selected" text="Pick a link from the list, or add your first resource to preview it inline." />
          )}
        </main>
      </div>
    </div>
  );
}

function Overview({ state, project, openItem, navigate, setState, showToast }) {
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
      <TopRisks risks={state.risks} users={state.users || []} projectId={project.id} setState={setState} showToast={showToast} />
      <section className="panel qa-readiness"><PanelHeader title="QA readiness" action="Open QA" onAction={() => navigate("qa")} /><div className="donut" style={{ "--value": `${state.tests.length ? Math.round(qaRun / state.tests.length * 100) : 0}%` }}><div><strong>{state.tests.length ? Math.round(qaRun / state.tests.length * 100) : 0}%</strong><span>started</span></div></div><div className="legend"><span><i className="green" />Passed {qaPassed}</span><span><i className="blue" />In progress {state.tests.filter((test) => test.status === "In Progress").length}</span><span><i />Not run {state.tests.filter((test) => test.status === "Not Run").length}</span></div></section>
      <section className="panel"><PanelHeader title="Recent activity" /><div className="activity-list">{state.activities.slice(0, 5).map((entry) => <div key={entry.id}><div className="avatar small">{entry.actor.slice(0, 2).toUpperCase()}</div><div><strong>{entry.actor}</strong><span>{entry.action}</span><small>{new Date(entry.at).toLocaleString()}</small></div></div>)}</div></section>
      
      <section className="panel project-links-card">
        <PanelHeader title="Project links" action="Open page" onAction={() => navigate("links")} />
        <div className="project-links-list-mini">
          {(project.links || []).slice(0, 4).map((link) => (
            <button key={link.id} onClick={() => navigate("links")} className="project-link-mini-btn">
              <LinkKindIcon url={link.url} size={13} />
              <strong>{link.name}</strong>
              <small>{domainOf(link.url)}</small>
            </button>
          ))}
          {(!project.links || project.links.length === 0) && <p className="empty-text">No project links attached.</p>}
        </div>
      </section>
    </div>
  </div>;
}

function TimelineStep({ label, state = "future" }) { return <div className={`timeline-step ${state}`}><div><Check size={12} /></div><span>{label}</span></div>; }
function PanelHeader({ title, action, onAction }) { return <div className="panel-header"><h2>{title}</h2>{action && <button onClick={onAction}>{action}<CaretRight /></button>}</div>; }
function Status({ value }) { return <span className={`status status-${(value || "new").toLowerCase().replaceAll(" ", "-")}`}><i />{value}</span>; }
function HealthRow({ label, value, detail, tone }) { return <div><span className={`health-icon ${tone}`}><Pulse size={18} /></span><div><strong>{label}<em className={tone}>{value}</em></strong><small>{detail}</small></div></div>; }

function TopRisks({ risks, users, projectId, setState, showToast }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", impact: "Medium", likelihood: "Medium", owner: "Unassigned" });
  const [busy, setBusy] = useState(false);
  const addRisk = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const risk = await api("/api/risks", { method: "POST", body: JSON.stringify({ ...form, projectId }) });
      setState((current) => ({ ...current, risks: [...current.risks, risk] }));
      setForm({ title: "", impact: "Medium", likelihood: "Medium", owner: "Unassigned" });
      setAdding(false);
      showToast("Risk added to this workspace");
    } catch (error) { showToast(error.message); }
    finally { setBusy(false); }
  };
  const removeRisk = async (risk) => {
    if (!window.confirm(`Remove risk “${risk.title}”?`)) return;
    try {
      await api(`/api/risks/${encodeURIComponent(risk.id)}`, { method: "DELETE" });
      setState((current) => ({ ...current, risks: current.risks.filter((entry) => entry.id !== risk.id) }));
      showToast("Risk removed");
    } catch (error) { showToast(error.message); }
  };
  return <section className="panel top-risks-panel"><PanelHeader title="Top risks" action={adding ? "Cancel" : "Add risk"} onAction={() => setAdding((value) => !value)} />
    {adding && <form className="risk-create-form" onSubmit={addRisk}><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Describe the delivery risk" autoFocus /><select value={form.impact} onChange={(event) => setForm({ ...form, impact: event.target.value })}><option>High</option><option>Medium</option><option>Low</option></select><select value={form.likelihood} onChange={(event) => setForm({ ...form, likelihood: event.target.value })}><option>High</option><option>Medium</option><option>Low</option></select><select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}><option>Unassigned</option>{users.map((user) => <option key={user.id}>{user.name}</option>)}</select><button className="primary-button" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : <Plus />}Add</button></form>}
    <div className="risk-list">{risks.map((risk, index) => <div className="risk" key={risk.id}><span className={`risk-number ${risk.impact === "High" ? "red" : "amber"}`}>{index + 1}</span><div><strong>{risk.title}</strong><small>Impact: {risk.impact} · Likelihood: {risk.likelihood} · {risk.owner}</small></div><button className="icon-button delete" onClick={() => removeRisk(risk)} title="Remove risk"><Trash size={14} /></button></div>)}{risks.length === 0 && <p className="empty-text">No risks recorded for this workspace.</p>}</div>
  </section>;
}

function HierarchySummary({ state, openItem }) {
  const epic = state.workItems.find((item) => item.type === "Epic");
  if (!epic) return <Empty title="No hierarchy yet" text="Create an Epic to start this workspace backlog." />;
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
  const [dragTarget, setDragTarget] = useState(null);
  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
  const sprints = [...new Set(state.workItems.filter((item) => item.type === "User Story").map((item) => item.sprint).filter((value) => value && value !== "Backlog"))];
  const phases = [...new Set(state.workItems.map((item) => item.phase).filter(Boolean))];
  const allStories = state.workItems.filter((item) => item.type === "User Story" && (feature === "All" || item.parentId === feature) && (phase === "All phases" || item.phase === phase) && (!dependency || item.dependencies?.some((value) => value.toLowerCase().includes(dependency.toLowerCase()))));
  const unplanned = allStories.filter((item) => !item.sprint || item.sprint === "Backlog");
  const stories = allStories.filter((item) => item.sprint && item.sprint !== "Backlog" && (sprint === "All sprints" || item.sprint === sprint));
  const drop = async (event, status) => { event.preventDefault(); setDragTarget(null); const id = event.dataTransfer.getData("text/plain"); if (id) await updateItem(id, { status, progress: status === "Closed" ? 100 : status === "Resolved" ? 80 : status === "Active" ? 50 : 0 }, `Moved ${id} to ${status}`); };
  const card = (item) => <article key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => openItem(item.id)}><div className="card-type"><TypeIcon type="User Story" /><strong>{item.id}</strong><span className={`moscow-mini ${item.moscow?.toLowerCase().replaceAll(" ", "-").replace("'", "")}`}>{item.moscow}</span><span className={`priority-dot priority-${item.priority.toLowerCase()}`} /></div><h3>{item.title}</h3><p>{item.description}</p>{item.dependencies?.length > 0 && <div className="card-dependencies"><LinkSimple />{item.dependencies.join(", ")}</div>}<footer><span className="avatar small">{item.assignee.slice(0, 2).toUpperCase()}</span><span>{item.storyPoints} pts</span><span>{item.sprint || "Backlog"}</span></footer></article>;
  return <div className="content board-page"><div className="page-heading"><div><span className="eyebrow">KANBAN</span><h1>User stories board</h1><p>Filter delivery by sprint and phase, while keeping unplanned work visible outside committed sprint columns.</p></div><button className="primary-button" onClick={() => openCreate({ type: "User Story" })}><Plus />New user story</button></div><div className="toolbar board-filters"><select value={feature} onChange={(event) => setFeature(event.target.value)}><option value="All">All features</option>{features.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><select value={sprint} onChange={(event) => setSprint(event.target.value)}><option>All sprints</option>{sprints.map((value) => <option key={value}>{value}</option>)}</select><select value={phase} onChange={(event) => setPhase(event.target.value)}><option>All phases</option>{phases.map((value) => <option key={value}>{value}</option>)}</select><div className="dependency-search"><LinkSimple /><input value={dependency} onChange={(event) => setDependency(event.target.value)} placeholder="Dependency ID" /></div><span className="toolbar-count">{stories.length} planned · {unplanned.length} unplanned</span></div>{unplanned.length > 0 ? <section className="unplanned-board"><header><div><Briefcase /><span><strong>Unplanned user stories</strong><small>Not assigned to a sprint</small></span></div><button onClick={() => openCreate({ type: "User Story", parentId: "FEAT-UNPLANNED", sprint: "Backlog", phase: "Unplanned" })}><Plus />Add unplanned story</button></header><div>{unplanned.map(card)}</div></section> : <section className="unplanned-empty"><div><Briefcase /><span><strong>No unplanned stories</strong><small>New uncommitted work will appear here.</small></span></div><button onClick={() => openCreate({ type: "User Story", parentId: "FEAT-UNPLANNED", sprint: "Backlog", phase: "Unplanned" })}><Plus />Add unplanned story</button></section>}<div className="kanban">{statuses.map((status) => { const items = stories.filter((item) => item.status === status); return <section className={`kanban-column ${dragTarget === status ? "drag-over" : ""}`} key={status} onDragOver={(event) => { event.preventDefault(); setDragTarget(status); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragTarget((current) => current === status ? null : current); }} onDrop={(event) => drop(event, status)}><header><h2>{status}</h2><span>{items.length}</span></header><div className="kanban-items">{items.map(card)}<button className="add-card" onClick={() => openCreate({ type: "User Story", status, sprint: sprint === "All sprints" ? "Backlog" : sprint, phase: phase === "All phases" ? "Phase 2" : phase })}><Plus />New user story</button></div></section>; })}</div></div>;
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [storyFilter, setStoryFilter] = useState("All stories");
  const [sprintFilter, setSprintFilter] = useState("All sprints");
  const [assigneeFilter, setAssigneeFilter] = useState("All assignees");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [importOpen, setImportOpen] = useState(false);
  const stories = state.workItems.filter((item) => item.type === "User Story");
  const storyNames = Object.fromEntries(stories.map((story) => [story.id, story.title]));
  const sprints = [...new Set(state.tests.map((test) => test.sprint || "Backlog"))].sort();
  const assignees = [...new Set(state.tests.map((test) => test.assignee || "Unassigned"))].sort();
  const tests = state.tests.filter((test) => (statusFilter === "All statuses" || test.status === statusFilter)
    && (storyFilter === "All stories" || test.storyId === storyFilter)
    && (sprintFilter === "All sprints" || (test.sprint || "Backlog") === sprintFilter)
    && (assigneeFilter === "All assignees" || (test.assignee || "Unassigned") === assigneeFilter)
    && (priorityFilter === "All priorities" || test.priority === priorityFilter)
    && (!search || `${test.id} ${test.title} ${test.storyId} ${storyNames[test.storyId] || ""}`.toLowerCase().includes(search.toLowerCase())));
  const hasFilters = search || statusFilter !== "All statuses" || storyFilter !== "All stories" || sprintFilter !== "All sprints" || assigneeFilter !== "All assignees" || priorityFilter !== "All priorities";
  const clearFilters = () => { setSearch(""); setStatusFilter("All statuses"); setStoryFilter("All stories"); setSprintFilter("All sprints"); setAssigneeFilter("All assignees"); setPriorityFilter("All priorities"); };
  const update = async (id, status) => { const test = await api(`/api/tests/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status }) }); setState((current) => ({ ...current, tests: current.tests.map((entry) => entry.id === id ? test : entry) })); showToast(`${id} marked ${status}`); };
  const passed = state.tests.filter((test) => test.status === "Passed").length;
  const started = state.tests.filter((test) => test.status !== "Not Run").length;
  const total = state.tests.length;
  return <div className="content qa-page"><div className="page-heading"><div><span className="eyebrow">QUALITY ASSURANCE</span><h1>QA & test center</h1><p>Import Excel test cases against a User Story, update execution, and export the complete QA pack.</p></div><div className="page-actions"><button className="secondary-button" onClick={downloadTestTemplate}><FileXls />Excel template</button><button className="secondary-button" onClick={() => exportTestCases(state.tests)}><DownloadSimple />Export Excel</button><button className="primary-button" onClick={() => setImportOpen(true)}><UploadSimple />Import test cases</button></div></div>
    <div className="metrics-row"><Metric label="Total tests" value={total} detail="This workspace" icon={TestTube} /><Metric label="Execution started" value={`${total ? Math.round(started / total * 100) : 0}%`} detail={`${started} tests`} tone="amber" icon={Clock} /><Metric label="Passed" value={passed} detail={`${total ? Math.round(passed / total * 100) : 0}% coverage`} tone="green" icon={CheckCircle} /><Metric label="User stories" value={stories.length} detail="Import target coverage" tone="purple" icon={BookOpenText} /></div>
    <div className="toolbar qa-filterbar"><div className="inline-search"><MagnifyingGlass /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search test case or story" /></div><select value={storyFilter} onChange={(event) => setStoryFilter(event.target.value)}><option>All stories</option>{stories.map((story) => <option key={story.id} value={story.id}>{story.id} · {story.title}</option>)}</select><select value={sprintFilter} onChange={(event) => setSprintFilter(event.target.value)}><option>All sprints</option>{sprints.map((sprint) => <option key={sprint}>{sprint}</option>)}</select><select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option>All assignees</option>{assignees.map((assignee) => <option key={assignee}>{assignee}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Not Run</option><option>In Progress</option><option>Passed</option><option>Failed</option></select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All priorities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>{hasFilters && <button className="tertiary-button" onClick={clearFilters}><X />Clear</button>}<span className="toolbar-count">{tests.length} of {total} test cases</span></div>
    <div className="panel table-scroll qa-table"><table><thead><tr><th>Test case</th><th>Scenario</th><th>User story</th><th>Sprint</th><th>Priority</th><th>Assignee</th><th>Status</th></tr></thead><tbody>{tests.map((test) => <tr key={test.id}><td><button className="text-button test-case-link" onClick={() => openItem(test.storyId)}>{test.id}</button></td><td><strong>{test.title}</strong>{test.expectedResult && <small className="test-expected">Expected: {test.expectedResult}</small>}</td><td><button className="text-button" onClick={() => openItem(test.storyId)}>{test.storyId}</button><small className="story-name">{storyNames[test.storyId]}</small></td><td>{test.sprint || "Backlog"}</td><td><span className={`priority priority-${(test.priority || "medium").toLowerCase()}`}>{test.priority || "Medium"}</span></td><td>{test.assignee || "Unassigned"}</td><td><select className={`test-status test-${test.status.toLowerCase().replaceAll(" ", "-")}`} value={test.status} onChange={(event) => update(test.id, event.target.value)}><option>Not Run</option><option>In Progress</option><option>Passed</option><option>Failed</option></select></td></tr>)}</tbody></table>{tests.length === 0 && <Empty title="No test cases match" text="Clear filters or import tests for this workspace." />}</div>{importOpen && <TestCaseImportModal state={state} setState={setState} close={() => setImportOpen(false)} showToast={showToast} />}</div>;
}

function TestCaseImportModal({ state, setState, close, showToast }) {
  const fileInputRef = useRef(null);
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
  return <div className="modal-backdrop" onMouseDown={close}><section className="modal import-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">EXCEL IMPORT</span><h2>Import test cases to User Stories</h2></div><button className="icon-button" onClick={close}><X /></button></header><div className="import-drop"><FileXls size={32} weight="duotone" /><div><strong>{filename || "Choose Darla's Excel file or the Atlas template"}</strong><span>.xlsx, .xls, or .csv · First worksheet will be imported</span></div><input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={chooseFile} style={{ display: "none" }} /><button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>Choose file</button></div><div className="import-summary"><span><strong>{rows.length}</strong> rows found</span><span className={errors.length ? "red" : "green"}><strong>{errors.length}</strong> validation issues</span></div>{errors.length > 0 && <div className="import-errors">{errors.slice(0, 8).map((error, index) => <div key={index}><Warning size={15} /><span>Row {error.row}: {error.message}</span></div>)}</div>}{rows.length > 0 && <div className="table-scroll import-preview"><table><thead><tr><th>Test Case ID</th><th>User Story</th><th>Title</th><th>Status</th><th>Sprint</th></tr></thead><tbody>{rows.slice(0, 8).map((row, index) => <tr key={`${row.id}-${index}`}><td>{row.id || "Auto"}</td><td>{row.storyId}</td><td>{row.title}</td><td>{row.status}</td><td>{row.sprint}</td></tr>)}</tbody></table>{rows.length > 8 && <small>Previewing 8 of {rows.length} rows.</small>}</div>}<footer><button className="secondary-button" onClick={downloadTestTemplate}><DownloadSimple />Download format</button><button className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={busy || !rows.length || errors.length > 0} onClick={importRows}>{busy ? <SpinnerGap className="spin" /> : <UploadSimple />}Import {rows.length || ""} test cases</button></footer></section></div>;
}

function parseMarkdownToBlocks(markdown, sectionName) {
  const blocks = [];
  const rawBlocks = markdown.split(/\n\n+/);
  
  for (let raw of rawBlocks) {
    raw = raw.trim();
    if (!raw) continue;
    
    // Check for Heading
    if (raw.startsWith("#")) {
      const match = raw.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        blocks.push({
          kind: "heading",
          level,
          text,
          path: [sectionName]
        });
        continue;
      }
    }
    
    // Check for List Bullet
    if (raw.startsWith("- ") || raw.startsWith("* ") || /^\d+\.\s+/.test(raw)) {
      const lines = raw.split("\n");
      for (const line of lines) {
        const text = line.replace(/^(-\s*|\*\s*|\d+\.\s*)/, "").trim();
        if (text) {
          blocks.push({
            kind: "paragraph",
            style: "List Bullet",
            text,
            path: [sectionName]
          });
        }
      }
      continue;
    }
    
    // Check for Table
    if (raw.includes("|") && raw.split("\n")[1]?.includes("---")) {
      const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
      const rows = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("---")) continue; // skip separator row
        const cells = lines[i].split("|").map(c => c.trim()).filter((c, idx, arr) => {
          if (idx === 0 && c === "") return false;
          if (idx === arr.length - 1 && c === "") return false;
          return true;
        });
        rows.push(cells);
      }
      if (rows.length > 0) {
        blocks.push({
          kind: "table",
          rows,
          path: [sectionName]
        });
        continue;
      }
    }
    
    // Default Paragraph
    blocks.push({
      kind: "paragraph",
      style: "Normal",
      text: raw,
      path: [sectionName]
    });
  }
  return blocks;
}

function parseHtmlToBlocks(html, sectionName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks = [];
  
  const children = doc.body.childNodes;
  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      blocks.push({
        kind: "paragraph",
        style: "Normal",
        text: node.textContent.trim(),
        path: [sectionName]
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      
      if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1], 10);
        blocks.push({
          kind: "heading",
          level,
          text: node.textContent.trim(),
          path: [sectionName]
        });
      } else if (tag === "p") {
        blocks.push({
          kind: "paragraph",
          style: "Normal",
          text: node.textContent.trim(),
          path: [sectionName]
        });
      } else if (tag === "ul" || tag === "ol") {
        const items = node.querySelectorAll("li");
        items.forEach(li => {
          blocks.push({
            kind: "paragraph",
            style: "List Bullet",
            text: li.textContent.trim(),
            path: [sectionName]
          });
        });
      } else if (tag === "blockquote") {
        blocks.push({
          kind: "paragraph",
          style: "Intense Quote",
          text: node.textContent.trim(),
          path: [sectionName]
        });
      } else if (tag === "table") {
        const rows = [];
        const trs = node.querySelectorAll("tr");
        trs.forEach(tr => {
          const cells = [];
          const tds = tr.querySelectorAll("th, td");
          tds.forEach(td => cells.push(td.textContent.trim()));
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) {
          blocks.push({
            kind: "table",
            rows,
            path: [sectionName]
          });
        }
      } else {
        const txt = node.textContent.trim();
        if (txt) {
          blocks.push({
            kind: "paragraph",
            style: "Normal",
            text: txt,
            path: [sectionName]
          });
        }
      }
    }
  }
  return blocks;
}

function convertSectionBlocksToMarkdown(blocks, sectionName) {
  let md = "";
  const sectionBlocks = blocks.filter(b => b.path?.[0] === sectionName && !(b.kind === "heading" && b.level === 1));
  
  for (const block of sectionBlocks) {
    if (block.kind === "heading") {
      md += "#".repeat(block.level) + " " + block.text + "\n\n";
    } else if (block.kind === "table") {
      const rows = block.rows;
      if (rows && rows.length > 0) {
        md += "| " + rows[0].join(" | ") + " |\n";
        md += "| " + rows[0].map(() => "---").join(" | ") + " |\n";
        for (let i = 1; i < rows.length; i++) {
          md += "| " + rows[i].join(" | ") + " |\n";
        }
        md += "\n";
      }
    } else if (block.style === "List Bullet") {
      md += "- " + block.text + "\n";
    } else if (block.style === "Intense Quote") {
      md += "> " + block.text + "\n\n";
    } else {
      md += block.text + "\n\n";
    }
  }
  return md.trim();
}

function exportAllRequirements(documentBlocks) {
  let markdown = "";
  for (const block of documentBlocks) {
    if (block.kind === "heading") {
      markdown += "\n" + "#".repeat(block.level) + " " + block.text + "\n\n";
    } else if (block.kind === "table") {
      const rows = block.rows;
      if (rows && rows.length > 0) {
        markdown += "\n";
        markdown += "| " + rows[0].join(" | ") + " |\n";
        markdown += "| " + rows[0].map(() => "---").join(" | ") + " |\n";
        for (let i = 1; i < rows.length; i++) {
          markdown += "| " + rows[i].join(" | ") + " |\n";
        }
        markdown += "\n";
      }
    } else if (block.style === "List Bullet") {
      markdown += "- " + block.text + "\n";
    } else if (block.style === "Intense Quote") {
      markdown += "> " + block.text + "\n\n";
    } else {
      markdown += block.text + "\n\n";
    }
  }
  
  const blob = new Blob([markdown.trim()], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Atlas_Requirements.md");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function Requirements({ state, setState, showToast, project }) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All sections");
  const [typeFilter, setTypeFilter] = useState("all"); // all | text | table | list
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchRef = useRef(null);
  const viewerRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editSectionName, setEditSectionName] = useState("");
  const [form, setForm] = useState({ name: "", content: "", mode: "paste", format: "markdown" });
  const [fileContent, setFileContent] = useState("");
  const [filename, setFilename] = useState("");

  const headings = state.source.document.filter((block) => block.kind === "heading" && block.level === 1).map((block) => block.text);

  // Get sub-headings per section
  const subHeadingsMap = useMemo(() => {
    const map = {};
    for (const block of state.source.document) {
      if (block.kind === "heading" && block.level === 2 && block.path?.[0]) {
        if (!map[block.path[0]]) map[block.path[0]] = [];
        map[block.path[0]].push(block.text);
      }
    }
    return map;
  }, [state.source.document]);

  // Block counts per section
  const sectionBlockCounts = useMemo(() => {
    const counts = {};
    for (const block of state.source.document) {
      const sec = block.path?.[0];
      if (sec) counts[sec] = (counts[sec] || 0) + 1;
    }
    return counts;
  }, [state.source.document]);

  // Content type counts
  const typeCounts = useMemo(() => {
    const sectionBlocks = state.source.document.filter((block) => {
      return section === "All sections" || block.path?.[0] === section;
    });
    return {
      all: sectionBlocks.length,
      text: sectionBlocks.filter(b => b.kind !== "table" && b.kind !== "heading" && b.style !== "List Bullet").length,
      table: sectionBlocks.filter(b => b.kind === "table").length,
      list: sectionBlocks.filter(b => b.style === "List Bullet").length,
    };
  }, [state.source.document, section]);

  // Filtered blocks
  const blocks = useMemo(() => {
    return state.source.document.filter((block) => {
      const inSection = section === "All sections" || block.path?.[0] === section;
      const text = block.text || block.rows?.flat().join(" ") || "";
      const matchesQuery = !query || text.toLowerCase().includes(query.toLowerCase());
      let matchesType = true;
      if (typeFilter === "text") matchesType = block.kind !== "table" && block.kind !== "heading" && block.style !== "List Bullet";
      else if (typeFilter === "table") matchesType = block.kind === "table";
      else if (typeFilter === "list") matchesType = block.style === "List Bullet";
      return inSection && matchesQuery && matchesType;
    });
  }, [state.source.document, section, query, typeFilter]);

  // Document stats
  const stats = useMemo(() => ({
    sections: headings.length,
    paragraphs: state.source.document.filter(b => b.kind !== "heading" && b.kind !== "table").length,
    tables: state.source.document.filter(b => b.kind === "table").length,
  }), [state.source.document, headings.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToHeading = useCallback((headingText) => {
    const el = viewerRef.current?.querySelector(`[data-heading-id="${CSS.escape(headingText)}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleSectionCollapse = useCallback((headingText) => {
    setCollapsedSections(prev => ({ ...prev, [headingText]: !prev[headingText] }));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
      const ext = file.name.split(".").pop().toLowerCase();
      setForm(prev => ({ 
        ...prev, 
        format: ext === "html" ? "html" : "markdown" 
      }));
    };
    reader.readAsText(file);
  };

  const openAddModal = () => {
    setForm({ name: "", content: "", mode: "paste", format: "markdown" });
    setFileContent("");
    setFilename("");
    setModalMode("add");
    setModalOpen(true);
  };

  const openEditModal = (sectionName) => {
    const mdContent = convertSectionBlocksToMarkdown(state.source.document, sectionName);
    setForm({ name: sectionName, content: mdContent, mode: "paste", format: "markdown" });
    setFileContent("");
    setFilename("");
    setEditSectionName(sectionName);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDeleteSection = async (e, sectionToDelete) => {
    e.stopPropagation();
    if (!window.confirm(`Delete the entire section "${sectionToDelete}" and all its content?`)) return;
    
    const nextDocument = state.source.document.filter(block => {
      const isTargetSectionHeading = block.kind === "heading" && block.level === 1 && block.text === sectionToDelete;
      const isTargetSectionContent = block.path?.[0] === sectionToDelete;
      return !isTargetSectionHeading && !isTargetSectionContent;
    });
    
    try {
      const nextSource = await api("/api/requirements", {
        method: "PUT",
        body: JSON.stringify({ document: nextDocument })
      });
      
      setState((current) => ({
        ...current,
        source: nextSource
      }));
      
      if (section === sectionToDelete) {
        setSection("All sections");
      }
      showToast("Section deleted");
    } catch (err) {
      showToast(`Error deleting section: ${err.message}`);
    }
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showToast("Section title is required.");
      return;
    }
    
    const sourceText = form.mode === "paste" ? form.content : fileContent;
    if (!sourceText && modalMode === "add") {
      showToast("Content is required.");
      return;
    }
    
    let newBlocks = [];
    if (sourceText) {
      if (form.format === "html") {
        newBlocks = parseHtmlToBlocks(sourceText, name);
      } else {
        newBlocks = parseMarkdownToBlocks(sourceText, name);
      }
    }
    
    let nextDocument = [...state.source.document];
    
    if (modalMode === "add") {
      const headingBlock = {
        kind: "heading",
        level: 1,
        text: name,
        path: [name]
      };
      nextDocument = [...nextDocument, headingBlock, ...newBlocks];
    } else {
      nextDocument = nextDocument.map(block => {
        if (block.kind === "heading" && block.level === 1 && block.text === editSectionName) {
          return { ...block, text: name, path: [name] };
        }
        return block;
      });
      
      const headingIndex = nextDocument.findIndex(block => block.kind === "heading" && block.level === 1 && block.text === name);
      
      const before = nextDocument.slice(0, headingIndex);
      const after = nextDocument.slice(headingIndex + 1).filter(block => {
        return block.path?.[0] !== editSectionName && block.path?.[0] !== name;
      });
      
      nextDocument = [...before, nextDocument[headingIndex], ...newBlocks, ...after];
    }
    
    try {
      const nextSource = await api("/api/requirements", {
        method: "PUT",
        body: JSON.stringify({ document: nextDocument })
      });
      setState((current) => ({
        ...current,
        source: nextSource
      }));
      setSection(name);
      setModalOpen(false);
      showToast(modalMode === "add" ? "Section created" : "Section updated");
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleExportAll = () => {
    exportAllRequirements(state.source.document);
    showToast("Requirements exported as Markdown");
  };

  if (project?.id !== "atlas-payroll") return <div className="content requirements-page"><div className="page-heading"><div><span className="eyebrow">SOURCE OF TRUTH</span><h1>{project.name} requirements</h1><p>Requirements are isolated by workspace.</p></div></div><div className="panel"><Empty title="No requirements imported" text="This workspace does not use the Atlas Payroll requirements library." /></div></div>;

  return (
    <div className="content requirements-page">
      {/* Hero banner */}
      <div className="req-hero">
        <div>
          <span className="req-hero-eyebrow">SOURCE OF TRUTH</span>
          <h1>{project?.name || "Atlas"} Payroll Requirements</h1>
          <p className="req-hero-sub">
            {state.source?.source?.filename || "Searchable source document — rules, formulas, acceptance criteria, and open questions"}
          </p>
          <div className="req-hero-stats">
            <div className="req-hero-stat">
              <strong>{stats.sections}</strong>
              <span>Sections</span>
            </div>
            <div className="req-hero-stat">
              <strong>{stats.paragraphs}</strong>
              <span>Paragraphs</span>
            </div>
            <div className="req-hero-stat">
              <strong>{stats.tables}</strong>
              <span>Tables</span>
            </div>
          </div>
        </div>
        <div className="req-hero-actions">
          <button className="secondary-button" onClick={handleExportAll}>
            <DownloadSimple size={15} />Export .md
          </button>
          <button className="primary-button" onClick={openAddModal}>
            <Plus size={15} />Add Section
          </button>
        </div>
      </div>

      {/* Enhanced toolbar */}
      <div className="req-toolbar">
        <div className="inline-search" style={{ position: "relative" }}>
          <MagnifyingGlass />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requirements, rules, formulas, questions..." />
          {!query && <kbd className="req-search-kbd">⌘K</kbd>}
        </div>
        <select value={section} onChange={(event) => { setSection(event.target.value); setTypeFilter("all"); }}>
          <option>All sections</option>
          {headings.map((heading) => <option key={heading}>{heading}</option>)}
        </select>
        <div className="req-type-filters">
          {[
            ["all", "All"],
            ["text", "Text"],
            ["table", "Tables"],
            ["list", "Lists"],
          ].map(([key, label]) => (
            <button key={key} className={`req-type-pill${typeFilter === key ? " active" : ""}`} onClick={() => setTypeFilter(key)}>
              {label}
              <span className="pill-count">{typeCounts[key]}</span>
            </button>
          ))}
        </div>
        {query && (
          <div className="req-match-count">
            <strong>{blocks.length}</strong> results
          </div>
        )}
      </div>

      <div className="document-layout">
        {/* Enhanced TOC sidebar */}
        <aside className="document-toc">
          <div className="document-toc-header">
            <TreeStructure size={15} weight="bold" />
            <strong>Document map</strong>
          </div>
          <button className={`toc-all-btn${section === "All sections" ? " active" : ""}`} onClick={() => setSection("All sections")}>
            All sections
            <span className="toc-block-count">{state.source.document.length}</span>
          </button>
          {headings.map((heading, index) => {
            const subs = subHeadingsMap[heading] || [];
            const isActive = section === heading;
            return (
              <div className="toc-section" key={heading}>
                <div className={`toc-section-header${isActive ? " active" : ""}`}>
                  <span className="toc-section-number">{index + 1}</span>
                  <button className="toc-select-btn" onClick={() => setSection(heading)} title={heading}>
                    {heading}
                  </button>
                  <span className="toc-block-count">{sectionBlockCounts[heading] || 0}</span>
                  <div className="toc-item-actions">
                    <button onClick={() => openEditModal(heading)} title="Edit section content">
                      <PencilSimple size={13} />
                    </button>
                    <button className="delete" onClick={(e) => handleDeleteSection(e, heading)} title="Delete section">
                      <Trash size={13} />
                    </button>
                  </div>
                </div>
                {subs.length > 0 && (
                  <div className={`toc-sub-nav${isActive ? " open" : ""}`}>
                    {subs.map((sub) => (
                      <button
                        key={sub}
                        className="toc-sub-btn"
                        title={sub}
                        onClick={() => {
                          setSection(heading);
                          setTimeout(() => scrollToHeading(sub), 60);
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Enhanced document viewer */}
        <article className="document-viewer" ref={viewerRef}>
          {blocks.length === 0 ? (
            <Empty title="No matching source content" text="Try a broader search or clear the filters." />
          ) : (
            blocks.slice(0, 180).map((block, index) => (
              <DocumentBlock
                block={block}
                key={`${block.kind}-${index}`}
                query={query}
                index={index}
                collapsed={collapsedSections[block.text]}
                onToggleCollapse={toggleSectionCollapse}
              />
            ))
          )}
          {blocks.length > 180 && (
            <div className="document-limit">
              <Warning size={16} />
              Showing the first 180 matching blocks. Narrow the section or search to focus the source.
            </div>
          )}
        </article>
      </div>

      {/* Back to top button */}
      <button className={`req-back-to-top${showBackToTop ? " visible" : ""}`} onClick={scrollToTop} title="Back to top">
        <ArrowUp size={18} weight="bold" />
      </button>

      {modalOpen && (
        <div className="modal-backdrop modal-backdrop-top" onMouseDown={() => setModalOpen(false)}>
          <section className="modal req-import-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <header>
              <div>
                <span className="eyebrow">SOURCE OF TRUTH</span>
                <h2>{modalMode === "add" ? "Add new document section" : `Edit section: ${editSectionName}`}</h2>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)}><X /></button>
            </header>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>Section Title
                <input 
                  placeholder="e.g. Basic Pay Configuration" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                  style={{ padding: "10px", border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)", background: "var(--surface)", fontSize: "14px", width: "100%" }}
                />
              </label>
              
              <div className="input-type-tabs" style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
                <button 
                  type="button" 
                  className={form.mode === "paste" ? "active" : ""} 
                  onClick={() => setForm({ ...form, mode: "paste" })}
                  style={{ background: form.mode === "paste" ? "var(--blue)" : "var(--surface-2)", color: form.mode === "paste" ? "white" : "var(--ink-2)", border: "1px solid var(--line-strong)", borderRadius: "16px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Paste Text
                </button>
                <button 
                  type="button" 
                  className={form.mode === "upload" ? "active" : ""} 
                  onClick={() => setForm({ ...form, mode: "upload" })}
                  style={{ background: form.mode === "upload" ? "var(--blue)" : "var(--surface-2)", color: form.mode === "upload" ? "white" : "var(--ink-2)", border: "1px solid var(--line-strong)", borderRadius: "16px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Upload File
                </button>
              </div>

              {form.mode === "paste" ? (
                <>
                  <div className="format-selector" style={{ display: "flex", gap: "15px", fontSize: "13px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input 
                        type="radio" 
                        name="format" 
                        value="markdown" 
                        checked={form.format === "markdown"} 
                        onChange={() => setForm({ ...form, format: "markdown" })} 
                      />
                      Markdown
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input 
                        type="radio" 
                        name="format" 
                        value="html" 
                        checked={form.format === "html"} 
                        onChange={() => setForm({ ...form, format: "html" })} 
                      />
                      HTML
                    </label>
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>Content
                    <textarea 
                      rows="10" 
                      placeholder={form.format === "markdown" ? "Paste markdown content..." : "Paste HTML content..."} 
                      value={form.content} 
                      onChange={(e) => setForm({ ...form, content: e.target.value })} 
                      required 
                      style={{ padding: "12px", border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)", background: "var(--surface)", fontFamily: "monospace", fontSize: "13px", width: "100%", resize: "vertical" }}
                    />
                  </label>
                </>
              ) : (
                <div className="file-uploader-box" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "30px", border: "2px dashed var(--faint)", borderRadius: "var(--r-md)", background: "var(--surface-2)", cursor: "pointer" }}>
                  <input 
                    type="file" 
                    accept=".txt,.md,.html" 
                    style={{ display: "none" }} 
                    id="req-file-picker" 
                    onChange={handleFileUpload} 
                  />
                  <label htmlFor="req-file-picker" className="file-picker-label-box" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--blue)", fontWeight: "600" }}>
                    <UploadSimple size={32} />
                    <span>{filename ? `Selected: ${filename}` : "Choose a text, markdown, or HTML file"}</span>
                  </label>
                  {filename && (
                    <div className="file-format-info" style={{ fontSize: "12px", color: "var(--muted)" }}>
                      Detected format: <strong>{form.format.toUpperCase()}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <footer>
              <button className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="primary-button" onClick={handleSaveSection}>
                {modalMode === "add" ? "Create Section" : "Save Changes"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

/* Search highlight helper */
function HighlightedText({ text, query }) {
  if (!query || !text) return text || null;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
}

function DocumentBlock({ block, query, index, collapsed, onToggleCollapse }) {
  const animDelay = Math.min(index * 20, 300);

  if (block.kind === "heading") {
    const Tag = `h${Math.min(block.level + 1, 6)}`;
    const isCollapsible = block.level === 2;
    return (
      <Tag
        data-heading-id={block.text}
        className="doc-block-animated"
        style={{ animationDelay: `${animDelay}ms` }}
      >
        {isCollapsible && (
          <button
            className={`doc-section-toggle${collapsed ? " collapsed" : ""}`}
            onClick={() => onToggleCollapse(block.text)}
            title={collapsed ? "Expand section" : "Collapse section"}
          >
            <CaretDown size={12} weight="bold" />
          </button>
        )}
        <HighlightedText text={block.text} query={query} />
      </Tag>
    );
  }

  if (block.kind === "table") {
    return (
      <div className="source-table table-scroll doc-block-animated" style={{ animationDelay: `${animDelay}ms` }}>
        <table>
          <thead>
            {block.rows.length > 0 && (
              <tr>
                {block.rows[0].map((cell, cellIndex) => (
                  <th key={cellIndex}><HighlightedText text={cell} query={query} /></th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {block.rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}><HighlightedText text={cell} query={query} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.style === "List Bullet") {
    return (
      <div className="source-bullet doc-block-animated" style={{ animationDelay: `${animDelay}ms` }}>
        <span />
        <HighlightedText text={block.text} query={query} />
      </div>
    );
  }

  if (block.style === "Intense Quote") {
    return (
      <h5 className="doc-block-animated" style={{ animationDelay: `${animDelay}ms` }}>
        <HighlightedText text={block.text} query={query} />
      </h5>
    );
  }

  return (
    <p className="doc-block-animated" style={{ animationDelay: `${animDelay}ms` }}>
      <HighlightedText text={block.text} query={query} />
    </p>
  );
}

const presentationSlides = [
  { chapter: "OPEN", kicker: "Client update", title: "Sprint review" },
  { chapter: "01", kicker: "Executive pulse", title: "The story in 60 seconds" },
  { chapter: "02", kicker: "Sprint commitment", title: "Outcomes and scope" },
  { chapter: "03", kicker: "Portfolio health", title: "Module delivery radar" },
  { chapter: "04", kicker: "Delivery flow", title: "How work moved" },
  { chapter: "05", kicker: "Value delivered", title: "What is now complete" },
  { chapter: "06", kicker: "In flight", title: "What the team is advancing" },
  { chapter: "07", kicker: "Quality signal", title: "Evidence and readiness" },
  { chapter: "08", kicker: "Attention needed", title: "Risks and decisions" },
  { chapter: "09", kicker: "Forward view", title: "Next sprint and actions" },
];

const presenterShortcuts = [
  [["→", "Space", "PgDn"], "Next slide"],
  [["←", "PgUp"], "Previous slide"],
  [["Home", "End"], "First / last slide"],
  [["G"], "Slide overview"],
  [["N"], "Speaker notes"],
  [["B"], "Blackout screen"],
  [["T"], "Reset timer"],
  [["Esc"], "Exit presentation"],
];

const planningAudiences = [
  { id: "client", label: "Client", chapter: "CLIENT", kicker: "Scope approval", title: "Confirm the sprint commitment", purpose: "Review planned scope, priority, and approval status before the team commits.", Icon: Users },
  { id: "development", label: "Development", chapter: "DEV", kicker: "Delivery handoff", title: "Prepare stories for implementation", purpose: "Align ownership, dependencies, acceptance criteria, and delivery complexity.", Icon: Briefcase },
  { id: "qa", label: "QA", chapter: "QA", kicker: "Quality planning", title: "Prepare coverage before execution", purpose: "Review dependencies, acceptance evidence, and the checks required for each story.", Icon: TestTube },
];

function buildPlanningSlides(stories) {
  return planningAudiences.flatMap((audience) => [
    { key: `${audience.id}-section`, kind: "section", audience, chapter: audience.chapter, kicker: audience.kicker, title: audience.title },
    ...stories.map((story, index) => ({
      key: `${audience.id}-${story.id}`,
      kind: "story",
      audience,
      story,
      chapter: `${audience.chapter.slice(0, 1)}${String(index + 1).padStart(2, "0")}`,
      kicker: `${audience.label} view`,
      title: story.title,
    })),
  ]);
}

function SprintPresentation({ state, setState, project, showToast }) {
  const presentation = state.presentations?.[0];
  const [slideIndex, setSlideIndex] = useState(0);
  const [presentationType, setPresentationType] = useState("review");
  const [planningAudience, setPlanningAudience] = useState("client");
  const [editing, setEditing] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStoryField, setSavingStoryField] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(presentation);
  const [showNotes, setShowNotes] = useState(false);
  const [presentedAt, setPresentedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);

  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
  const allStories = state.workItems.filter((item) => item.type === "User Story" && item.phase !== "Unplanned");
  const sprintNames = [...new Set(allStories.map((item) => item.sprint).filter((sprint) => /^Sprint\s+\d+/i.test(sprint)))].sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
  const sprintStories = allStories.filter((item) => item.sprint === draft?.sprintName);
  const stories = sprintStories.length ? sprintStories : allStories;
  const planningSlides = buildPlanningSlides(stories).filter((item) => item.audience.id === planningAudience);
  const activeSlides = presentationType === "review" ? presentationSlides : planningSlides;
  const activeSlide = activeSlides[slideIndex] || activeSlides[0];

  useEffect(() => { if (presentation) setDraft(presentation); }, [presentation?.updatedAt]);
  useEffect(() => { setSlideIndex(0); setEditing(false); }, [presentationType, planningAudience, draft?.sprintName]);
  const closePresentation = () => {
    setPresenting(false); setBlackout(false); setShowGrid(false); setShowHelp(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  useEffect(() => {
    if (!presenting) return undefined;
    const onKeyDown = (event) => {
      if (event.target.closest?.("input, textarea, select")) return;
      const key = event.key;
      if (key === "Escape") { if (showHelp) setShowHelp(false); else if (showGrid) setShowGrid(false); else if (blackout) setBlackout(false); else closePresentation(); return; }
      if (key === "?") { setShowHelp((value) => !value); return; }
      if (key === "b" || key === "B") { setBlackout((value) => !value); return; }
      if (blackout) { setBlackout(false); return; }
      if (key === "g" || key === "G") { setShowGrid((value) => !value); return; }
      if (key === "n" || key === "N") { setShowNotes((value) => !value); return; }
      if (key === "t" || key === "T") { setPresentedAt(Date.now()); setElapsed(0); return; }
      if (key === "ArrowRight" || key === " " || key === "PageDown") { event.preventDefault(); setShowGrid(false); setSlideIndex((current) => Math.min(activeSlides.length - 1, current + 1)); }
      if (key === "ArrowLeft" || key === "PageUp" || key === "Backspace") { event.preventDefault(); setShowGrid(false); setSlideIndex((current) => Math.max(0, current - 1)); }
      if (key === "Home") { event.preventDefault(); setSlideIndex(0); }
      if (key === "End") { event.preventDefault(); setSlideIndex(activeSlides.length - 1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presenting, activeSlides.length, showHelp, showGrid, blackout]);
  useEffect(() => {
    if (presenting) return undefined;
    const onKeyDown = (event) => {
      if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowRight") setSlideIndex((current) => Math.min(activeSlides.length - 1, current + 1));
      if (event.key === "ArrowLeft") setSlideIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presenting, activeSlides.length]);
  useEffect(() => {
    if (!presenting) return undefined;
    const onFullscreenChange = () => { if (!document.fullscreenElement) closePresentation(); };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [presenting]);
  useEffect(() => {
    if (!presenting) return undefined;
    let idleTimer = window.setTimeout(() => setChromeHidden(true), 2600);
    const wake = () => { setChromeHidden(false); window.clearTimeout(idleTimer); idleTimer = window.setTimeout(() => setChromeHidden(true), 2600); };
    window.addEventListener("mousemove", wake);
    return () => { window.clearTimeout(idleTimer); window.removeEventListener("mousemove", wake); setChromeHidden(false); };
  }, [presenting]);
  useEffect(() => {
    if (!presenting || !presentedAt) return undefined;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - presentedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [presenting, presentedAt]);

  if (!presentation || !draft) return <div className="content"><Empty title="No sprint presentation" text="Restart the server once to create the reusable sprint presentation." /></div>;

  const tasks = state.workItems.filter((item) => item.type === "Task");
  const storyIds = new Set(stories.map((item) => item.id));
  const sprintTests = state.tests.filter((test) => storyIds.has(test.storyId));
  const sprintTasks = tasks.filter((task) => storyIds.has(task.parentId));
  const metrics = {
    features,
    stories,
    tasks: sprintTasks,
    closedStories: stories.filter((item) => item.status === "Closed"),
    activeStories: stories.filter((item) => item.status === "Active"),
    newStories: stories.filter((item) => item.status === "New"),
    tests: sprintTests,
    passedTests: sprintTests.filter((test) => test.status === "Passed"),
    failedTests: sprintTests.filter((test) => test.status === "Failed"),
    activeTests: sprintTests.filter((test) => test.status === "In Progress"),
    notRunTests: sprintTests.filter((test) => test.status === "Not Run"),
  };
  metrics.completion = stories.length ? Math.round((metrics.closedStories.length + metrics.activeStories.length * .5) / stories.length * 100) : 0;
  metrics.qaStarted = sprintTests.length ? Math.round((sprintTests.length - metrics.notRunTests.length) / sprintTests.length * 100) : 0;
  metrics.passRate = sprintTests.length ? Math.round(metrics.passedTests.length / sprintTests.length * 100) : 0;
  metrics.storyPoints = stories.reduce((total, item) => total + (Number(item.storyPoints) || 0), 0);

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
      executiveSummary: `${metrics.closedStories.length} of ${stories.length} ${draft.sprintName} stories are closed and ${metrics.activeStories.length} are active. ${leading?.title || "Core requirements"} is furthest along at ${leading?.progress || 0}%, while ${trailing?.title || "cross-module work"} needs the most attention at ${trailing?.progress || 0}%. QA execution has started on ${metrics.qaStarted}% of this sprint's linked scenarios.`,
      highlights: metrics.closedStories.slice(0, 3).map((item) => `${item.title} is complete and traceable to acceptance criteria and QA coverage.`),
    }));
    showToast("Narrative refreshed from current project data");
  };

  const openPresentation = () => {
    setPresentedAt(Date.now()); setElapsed(0); setBlackout(false); setShowGrid(false); setShowHelp(false); setPresenting(true);
    try { document.documentElement.requestFullscreen?.()?.catch(() => {}); } catch { /* fullscreen unavailable — overlay still works */ }
  };
  const updateStoryField = async (storyId, field, value) => {
    const savingKey = `${storyId}:${field}`;
    setSavingStoryField(savingKey); setError("");
    try {
      const updated = await api(`/api/work-items/${encodeURIComponent(storyId)}`, { method: "PUT", body: JSON.stringify({ [field]: value }) });
      setState((current) => ({ ...current, workItems: current.workItems.map((item) => item.id === storyId ? updated : item) }));
      showToast(`${storyId} ${field === "moscow" ? "MoSCoW priority" : "client approval"} set to ${value}`);
    } catch (requestError) { setError(requestError.message); }
    finally { setSavingStoryField(""); }
  };
  const jumpToAudience = (audienceId) => {
    setPlanningAudience(audienceId);
    setSlideIndex(0);
  };
  const timeLabel = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const approvedCount = stories.filter((story) => story.approvedByClient === "Yes").length;
  const slide = presentationType === "review"
    ? <SprintSlide index={slideIndex} presentation={draft} metrics={metrics} state={state} project={project} />
    : <PlanningSlide slide={activeSlide} presentation={draft} stories={stories} tests={sprintTests} project={project} updateStoryField={updateStoryField} savingStoryField={savingStoryField} />;
  const reviewTalkTracks = [
    draft.presenterNotes || `Set the scene in one line: ${draft.headline}`,
    `Tell the 60-second story, then land the confidence call — delivery is ${draft.confidence}. Pause for reactions before moving on.`,
    `Anchor on the sprint goal and the size of the commitment: ${metrics.stories.length} stories, ${metrics.storyPoints} points. Say what was deliberately protected or deferred.`,
    `Walk the modules left to right. Celebrate the leader, then name the module that needs a decision — don't let it hide.`,
    `Keep this factual: ${metrics.newStories.length} ready, ${metrics.activeStories.length} active, ${metrics.closedStories.length} closed. Explain what moved since the last review.`,
    `Prove value, not activity — every closed story traces to acceptance criteria and QA. Pick one story and tell its journey.`,
    `Show ownership: every active story has an owner and measurable progress. Invite questions on any row before leaving the slide.`,
    `Read the quality signal out loud: ${metrics.qaStarted}% executed, ${metrics.passRate}% passing. State what QA tackles next and any blockers.`,
    `Slow down — this slide earns the meeting. Ask for an owner and a date on each decision before advancing.`,
    `Close forward: three outcomes, three client asks. Confirm the next review date, then thank the room.`,
  ];
  const presenterNote = presentationType === "review" ? (reviewTalkTracks[slideIndex] || draft.presenterNotes) : activeSlide.kind === "section" ? activeSlide.audience.purpose : activeSlide.audience.id === "client" ? "Confirm the story outcome, priority, planned status, and client approval before moving forward." : activeSlide.audience.id === "development" ? "Confirm ownership, dependencies, acceptance criteria, and complexity before commitment." : "Confirm the acceptance evidence and QA checks are complete enough to begin test design.";
  const nextSlide = activeSlides[slideIndex + 1];
  const slideView = <div className="slide-anim" key={`${presentationType}-${planningAudience}-${slideIndex}`}>{slide}</div>;
  return <div className={`content presentation-page ${presenting ? "is-presenting" : ""}`}>
    <div className="page-heading presentation-heading"><div><div className="presentation-live"><span /><strong>{presentationType === "review" ? "LIVE CLIENT DECK" : "LIVE PLANNING DECK"}</strong><i>Auto-built from delivery and QA data</i></div><h1>{presentationType === "review" ? "Sprint presentation" : "Sprint planning"}</h1><p>{presentationType === "review" ? "A decision-led sprint narrative with live scope, delivery, quality, and risk evidence." : "Audience-specific planning views for client approval, delivery handoff, and QA preparation."}</p></div><div className="presentation-actions"><div className="presentation-mode-switch" role="group" aria-label="Presentation mode"><button className={presentationType === "review" ? "active" : ""} aria-pressed={presentationType === "review"} onClick={() => setPresentationType("review")}><PresentationChart />Presentation</button><button className={presentationType === "planning" ? "active" : ""} aria-pressed={presentationType === "planning"} onClick={() => setPresentationType("planning")}><ClipboardText />Planning</button></div><select aria-label="Sprint shown in presentation" value={draft.sprintName} onChange={(event) => setDraft({ ...draft, sprintName: event.target.value })}>{sprintNames.map((sprint) => <option key={sprint}>{sprint}</option>)}</select>{presentationType === "review" && <><button className="secondary-button" onClick={refreshNarrative}><ArrowClockwise />Sync narrative</button><button className="secondary-button" onClick={() => setEditing(!editing)}><PencilSimple />{editing ? "Close editor" : "Edit story"}</button></>}<button className="secondary-button" onClick={() => window.print()}><Printer />Export PDF</button><button className="primary-button" onClick={openPresentation}><Play weight="fill" />Present</button></div></div>
    {error && <div className="form-error"><Warning />{error}</div>}
    {presentationType === "planning" && <AudienceSwitcher activeAudience={activeSlide.audience.id} onSelect={jumpToAudience} />}
    <div className={`presentation-workspace ${editing ? "editing" : ""}`}>
      <aside className="slide-rail">{activeSlides.map((item, index) => <button key={item.key || item.title} className={`${slideIndex === index ? "active" : ""} ${item.kind === "section" ? "section-slide" : ""}`} onClick={() => setSlideIndex(index)}><span>{item.chapter}</span><div className={`slide-thumb thumb-${index}`}><small>{item.kicker}</small><strong>{item.title}</strong><i>{String(index + 1).padStart(2, "0")}</i></div></button>)}</aside>
      <section className="slide-stage"><div className="slide-toolbar"><div><button className="icon-button" title="Previous slide (←)" disabled={slideIndex === 0} onClick={() => setSlideIndex((value) => Math.max(0, value - 1))}><ArrowLeft /></button><strong>{activeSlide.chapter} / {activeSlide.kicker}</strong><button className="icon-button" title="Next slide (→)" disabled={slideIndex === activeSlides.length - 1} onClick={() => setSlideIndex((value) => Math.min(activeSlides.length - 1, value + 1))}><ArrowRight /></button></div><span className="deck-freshness"><i />{presentationType === "review" ? `Live snapshot / ${draft.sprintName}` : `${approvedCount}/${stories.length} client approved`}</span><button className="tertiary-button" onClick={openPresentation}><ArrowsOutSimple />Present view</button></div>{slideView}<div className="presenter-note"><NotePencil size={18} /><div><strong>Talk track</strong><span>{presenterNote}</span></div><small>{slideIndex + 1} / {activeSlides.length} · ← → to navigate</small></div></section>
      {editing && <PresentationEditor draft={draft} setDraft={setDraft} save={save} saving={saving} refreshNarrative={refreshNarrative} />}
    </div>
    {presenting && <div className={`present-overlay ${chromeHidden ? "chrome-hidden" : ""}`} role="dialog" aria-modal="true" aria-label="Presentation mode">
      <div className="present-topbar"><div><span className="present-live-dot" />{draft.sprintName}<strong title="Elapsed time — click or press T to reset" onClick={() => { setPresentedAt(Date.now()); setElapsed(0); }}>{timeLabel}</strong></div>{presentationType === "planning" && <AudienceSwitcher compact activeAudience={activeSlide.audience.id} onSelect={jumpToAudience} />}<div><button onClick={() => setShowGrid(!showGrid)} className={showGrid ? "active" : ""} title="Slide overview (G)"><SquaresFour />Overview</button><button onClick={() => setShowNotes(!showNotes)} className={showNotes ? "active" : ""} title="Speaker notes (N)"><NotePencil />Notes</button><button onClick={() => setShowHelp(!showHelp)} className={showHelp ? "active" : ""} title="Keyboard shortcuts (?)"><Keyboard />Shortcuts</button><button onClick={closePresentation} title="Exit (Esc)"><X />Exit</button></div></div>
      <div className="present-canvas" onClick={(event) => { const { left, width } = event.currentTarget.getBoundingClientRect(); if ((event.clientX - left) / width < 0.22) setSlideIndex((value) => Math.max(0, value - 1)); else setSlideIndex((value) => Math.min(activeSlides.length - 1, value + 1)); }}>{slideView}</div>
      {showNotes && <div className="present-note-popover"><strong>Talk track</strong><p>{presenterNote}</p><small>{nextSlide ? `Next up · ${nextSlide.title}` : "Last slide — bring it home"}</small></div>}
      {showGrid && <div className="present-grid" onClick={() => setShowGrid(false)}>{activeSlides.map((item, index) => <button key={item.key || `${item.chapter}-${index}`} className={slideIndex === index ? "active" : ""} onClick={(event) => { event.stopPropagation(); setSlideIndex(index); setShowGrid(false); }}><span>{item.chapter}</span><small>{item.kicker}</small><strong>{item.title}</strong><i>{String(index + 1).padStart(2, "0")}</i></button>)}</div>}
      {showHelp && <div className="present-help" onClick={() => setShowHelp(false)}><div onClick={(event) => event.stopPropagation()}><strong>Presenter shortcuts</strong>{presenterShortcuts.map(([keys, action]) => <div key={action}><span>{keys.map((keyLabel) => <kbd key={keyLabel}>{keyLabel}</kbd>)}</span><p>{action}</p></div>)}<small>Presentation clickers work too — they send Page Up / Page Down.</small></div></div>}
      {blackout && <div className="present-blackout" onClick={() => setBlackout(false)} title="Click or press any key to resume" />}
      <div className="present-controls"><button disabled={slideIndex === 0} onClick={() => setSlideIndex((value) => Math.max(0, value - 1))}><ArrowLeft />Previous</button><div><span>{nextSlide ? `Next · ${nextSlide.title}` : "Closing slide"}</span><i style={{ "--deck-progress": `${(slideIndex + 1) / activeSlides.length * 100}%` }} /></div><strong>{String(slideIndex + 1).padStart(2, "0")} / {activeSlides.length}</strong><button disabled={slideIndex === activeSlides.length - 1} onClick={() => setSlideIndex((value) => Math.min(activeSlides.length - 1, value + 1))}>Next<ArrowRight /></button></div>
    </div>}
    <div className="print-deck">{presentationType === "review" ? presentationSlides.map((_, index) => <SprintSlide key={index} index={index} presentation={draft} metrics={metrics} state={state} project={project} />) : planningSlides.map((item) => <PlanningSlide key={item.key} slide={item} presentation={draft} stories={stories} tests={sprintTests} project={project} updateStoryField={updateStoryField} savingStoryField={savingStoryField} />)}</div>
  </div>;
}

function PresentationEditor({ draft, setDraft, save, saving, refreshNarrative }) {
  const setList = (key, value) => setDraft({ ...draft, [key]: value.split("\n").map((item) => item.trim()).filter(Boolean) });
  return <aside className="presentation-editor"><header><div><span className="eyebrow">SPRINT UPDATE</span><h2>Edit client narrative</h2></div><button className="icon-button" onClick={refreshNarrative} title="Refresh narrative from project data"><TrendUp /></button></header><div className="editor-scroll"><div className="form-row"><label>Sprint name<input value={draft.sprintName} onChange={(event) => setDraft({ ...draft, sprintName: event.target.value })} /></label><label>Date range<input value={draft.dateRange} onChange={(event) => setDraft({ ...draft, dateRange: event.target.value })} /></label></div><label>Audience<input value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })} /></label><label>Headline<textarea rows="3" value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} /></label><label>Executive summary<textarea rows="5" value={draft.executiveSummary} onChange={(event) => setDraft({ ...draft, executiveSummary: event.target.value })} /></label><label>Sprint goal<textarea rows="4" value={draft.sprintGoal} onChange={(event) => setDraft({ ...draft, sprintGoal: event.target.value })} /></label><label>Highlights <small>One item per line</small><textarea rows="6" value={draft.highlights.join("\n")} onChange={(event) => setList("highlights", event.target.value)} /></label><label>Decisions needed <small>One item per line</small><textarea rows="6" value={draft.decisionsNeeded.join("\n")} onChange={(event) => setList("decisionsNeeded", event.target.value)} /></label><label>Next sprint goals <small>One item per line</small><textarea rows="6" value={draft.nextSprintGoals.join("\n")} onChange={(event) => setList("nextSprintGoals", event.target.value)} /></label><label>Client asks <small>One item per line</small><textarea rows="6" value={draft.clientAsks.join("\n")} onChange={(event) => setList("clientAsks", event.target.value)} /></label><label>Confidence<select value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: event.target.value })}><option>On Track</option><option>Watch</option><option>At Risk</option></select></label><label>Presenter note<textarea rows="4" value={draft.presenterNotes} onChange={(event) => setDraft({ ...draft, presenterNotes: event.target.value })} /></label></div><footer><button className="secondary-button" onClick={refreshNarrative}><TrendUp />Refresh from ADO</button><button className="primary-button" onClick={save} disabled={saving}>{saving ? <SpinnerGap className="spin" /> : <FloppyDisk />}Save update</button></footer></aside>;
}

function AudienceSwitcher({ activeAudience, onSelect, compact = false }) {
  return <div className={`audience-switcher ${compact ? "compact" : ""}`} role="group" aria-label="Sprint planning audience">{planningAudiences.map((audience) => { const Icon = audience.Icon; return <button key={audience.id} className={activeAudience === audience.id ? "active" : ""} aria-pressed={activeAudience === audience.id} onClick={() => onSelect(audience.id)}><Icon weight={activeAudience === audience.id ? "fill" : "regular"} /><span>{audience.label}</span><small>{audience.kicker}</small></button>; })}</div>;
}

function PlanningSlide({ slide, presentation, stories, tests, project, updateStoryField, savingStoryField }) {
  const { audience, story } = slide;
  const approvedCount = stories.filter((item) => item.approvedByClient === "Yes").length;
  const frame = (children, className = "") => <div className={`sprint-slide planning-slide planning-${audience.id} ${className}`}><div className="slide-accent" /><div className="slide-brand"><span><i>A</i> ATLAS DELIVERY HUB</span><strong>{presentation.sprintName} / SPRINT PLANNING</strong></div>{children}<div className="slide-footer"><span>{project.name} / {audience.label} view</span><strong>{slide.chapter}</strong></div></div>;

  if (slide.kind === "section") {
    const metrics = audience.id === "client"
      ? [[stories.length, "stories to review"], [approvedCount, "approved by client"], [stories.length - approvedCount, "awaiting approval"]]
      : audience.id === "development"
        ? [[stories.length, "planned stories"], [stories.filter((item) => item.assignee && item.assignee !== "Unassigned").length, "stories assigned"], [new Set(stories.flatMap((item) => item.dependencies || [])).size, "dependencies"]]
        : [[stories.length, "stories to cover"], [stories.reduce((total, item) => total + (item.qaFocus?.length || 0), 0), "planned QA checks"], [tests.length, "linked test cases"]];
    return frame(<div className="planning-section-content"><span>{audience.label.toUpperCase()} VIEW</span><h2>{audience.title}</h2><p>{audience.purpose}</p><div className="planning-section-metrics">{metrics.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="planning-section-flow"><span>01</span><p>Review each user story</p><span>02</span><p>Resolve open planning details</p><span>03</span><p>{audience.id === "client" ? "Capture client approval" : audience.id === "development" ? "Confirm implementation readiness" : "Confirm test readiness"}</p></div></div>, "planning-section-slide");
  }

  const header = <><div className="planning-story-heading"><div><span>{story.id}</span><i>{audience.label} view</i></div><h2>{story.title}</h2><p>{story.description || "No description supplied."}</p></div></>;
  const dependencies = <PlanningList title="Dependencies" items={story.dependencies} empty="No dependencies recorded." numbered={false} />;
  const acceptance = <PlanningList title="Acceptance criteria" items={story.acceptanceCriteria} empty="No acceptance criteria recorded." />;

  if (audience.id === "client") return frame(<>{header}<div className="client-planning-grid"><div className="planning-status-card"><span>PLANNED STATUS</span><strong className={`planning-status status-${story.status.toLowerCase().replaceAll(" ", "-")}`}>{story.status}</strong><small>Current state for {presentation.sprintName}</small></div><label className="planning-decision-card moscow-card" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}><span>MOSCOW PRIORITY</span><select aria-label={`MoSCoW Priority for ${story.id}`} value={story.moscow || "Should Have"} disabled={savingStoryField === `${story.id}:moscow`} onChange={(event) => updateStoryField(story.id, "moscow", event.target.value)}><option>Must Have</option><option>Should Have</option><option>Could Have</option><option>Won't Have</option></select><small>{savingStoryField === `${story.id}:moscow` ? "Saving priority..." : "Change priority during planning"}</small></label><label className={`planning-decision-card client-approval-card approval-${(story.approvedByClient || "No").toLowerCase()}`} onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}><span>APPROVED BY CLIENT</span><select aria-label={`Approved by Client for ${story.id}`} value={story.approvedByClient || "No"} disabled={savingStoryField === `${story.id}:approvedByClient`} onChange={(event) => updateStoryField(story.id, "approvedByClient", event.target.value)}><option>Yes</option><option>No</option></select><small>{savingStoryField === `${story.id}:approvedByClient` ? "Saving decision..." : "Decision is saved immediately"}</small></label></div></>);

  if (audience.id === "development") return frame(<>{header}<div className="planning-meta-row"><div><span>ASSIGNEE</span><strong>{story.assignee || "Unassigned"}</strong></div><div><span>COMPLEXITY</span><strong>{story.complexity || "Medium"}</strong></div></div><div className="planning-detail-grid"><div>{dependencies}</div><div>{acceptance}</div></div></>);

  const storyTests = tests.filter((test) => test.storyId === story.id);
  return frame(<>{header}<div className="qa-planning-summary"><div><span>DEPENDENCIES</span><strong>{story.dependencies?.length || 0}</strong><small>{story.dependencies?.slice(0, 3).join(" / ") || "None recorded"}</small></div><div><span>ACCEPTANCE CRITERIA</span><strong>{story.acceptanceCriteria?.length || 0}</strong><small>Expected outcomes to validate</small></div><div><span>LINKED TEST CASES</span><strong>{storyTests.length}</strong><small>Existing execution coverage</small></div></div><div className="planning-detail-grid qa-detail-grid"><div>{acceptance}</div><div><PlanningList title="QA checklist / checks" items={story.qaFocus} empty="No QA checks recorded." /></div></div></>);
}

function PlanningList({ title, items = [], empty, numbered = true }) {
  return <section className="planning-list"><header><span>{title}</span><strong>{items?.length || 0}</strong></header>{items?.length ? <ol className={numbered ? "" : "plain"}>{items.map((item, index) => <li key={`${item}-${index}`}><i>{numbered ? String(index + 1).padStart(2, "0") : <LinkSimple />}</i><span>{item}</span></li>)}</ol> : <p>{empty}</p>}</section>;
}

function SprintSlide({ index, presentation, metrics, state, project }) {
  const slideNumber = String(index + 1).padStart(2, "0");
  const openRisks = state.risks.filter((risk) => risk.status !== "Closed");
  const frame = (children, className = "") => <div className={`sprint-slide ${className}`}><div className="slide-accent" /><div className="slide-brand"><span><i>A</i> ATLAS DELIVERY HUB</span><strong>{presentation.sprintName} · LIVE SNAPSHOT</strong></div>{children}<div className="slide-footer"><span>{project.name} · {presentation.dateRange}</span><strong>{slideNumber}</strong></div></div>;
  if (index === 0) return frame(<><div className="cover-content"><div className="slide-kicker">SPRINT REVIEW / CLIENT UPDATE</div><h2>{project.name}</h2><h3>{presentation.sprintName}<br />Delivery Review</h3><p>{presentation.headline}</p><div className="cover-meta"><span>{presentation.dateRange}</span><span>{presentation.audience}</span></div></div><div className="cover-score"><div style={{ "--score": metrics.completion }}><strong>{metrics.completion}%</strong><span>Sprint momentum</span></div><small>{metrics.closedStories.length} outcomes closed · {metrics.qaStarted}% QA started</small></div></>, "slide-cover");
  if (index === 1) return frame(<><SlideTitle index="01" kicker="EXECUTIVE PULSE" title={presentation.headline} /><div className="pulse-grid"><div className="executive-story"><span>THE STORY</span><p>{presentation.executiveSummary}</p><div className={`confidence confidence-${presentation.confidence.toLowerCase().replaceAll(" ", "-")}`}><i />Delivery confidence <strong>{presentation.confidence}</strong></div></div><div className="pulse-kpis"><SlideMetric value={`${metrics.completion}%`} label="Sprint momentum" note="Weighted completion" /><SlideMetric value={`${metrics.closedStories.length}/${metrics.stories.length}`} label="Outcomes closed" note={`${metrics.activeStories.length} currently active`} /><SlideMetric value={`${metrics.qaStarted}%`} label="QA execution" note={`${metrics.tests.length} linked scenarios`} /><SlideMetric value={openRisks.length} label="Open risks" note={`${openRisks.filter((risk) => risk.impact === "High").length} high impact`} /></div></div></>);
  if (index === 2) return frame(<><SlideTitle index="02" kicker="SPRINT COMMITMENT" title="A focused commitment to make priority payroll flows implementation-ready." /><div className="commitment-layout"><div className="commitment-goal"><span>SPRINT GOAL</span><p>{presentation.sprintGoal}</p><div><strong>{metrics.stories.length}</strong><small>committed stories</small><strong>{metrics.storyPoints}</strong><small>story points</small></div></div><div className="commitment-breakdown"><span>COMMITMENT SHAPE</span><SlideStatusRow label="Complete" value={metrics.closedStories.length} total={metrics.stories.length} tone="green" /><SlideStatusRow label="In progress" value={metrics.activeStories.length} total={metrics.stories.length} tone="purple" /><SlideStatusRow label="Ready next" value={metrics.newStories.length} total={metrics.stories.length} tone="blue" /><div className="commitment-foot"><CheckCircle weight="fill" />Scope is traceable from story to acceptance criteria and QA.</div></div></div></>);
  if (index === 3) return frame(<><SlideTitle index="03" kicker="PORTFOLIO HEALTH" title="Module delivery is progressing, with Bonus requiring the clearest decision path." /><div className="module-grid">{metrics.features.slice(0, 5).map((feature, position) => <div className={feature.scopeStatus === "At Risk" ? "module-card at-risk" : "module-card"} key={feature.id}><div><span>0{position + 1}</span><i className={feature.scopeStatus === "At Risk" ? "risk" : "track"}>{feature.scopeStatus}</i></div><h4>{feature.title}</h4><div className="module-score"><strong>{feature.progress}%</strong><ProgressBar value={feature.progress} /></div><small>{feature.phase} · Target {feature.targetDate ? new Date(`${feature.targetDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "TBD"}</small></div>)}</div></>);
  if (index === 4) return frame(<><SlideTitle index="04" kicker="DELIVERY FLOW" title={`${metrics.closedStories.length} outcomes are closed; the sprint now concentrates on ${metrics.activeStories.length} active stories.`} /><div className="flow-layout"><div className="flow-waterfall">{[["New", metrics.newStories.length, "blue"], ["Active", metrics.activeStories.length, "purple"], ["Closed", metrics.closedStories.length, "green"]].map(([label, value, tone]) => <div key={label}><span>{label}</span><strong>{value}</strong><i className={tone} style={{ height: `${Math.max(18, value / Math.max(1, metrics.stories.length) * 100)}%` }} /><small>{Math.round(value / Math.max(1, metrics.stories.length) * 100)}%</small></div>)}</div><div className="flow-insight"><span>SPRINT SIGNAL</span><strong>{metrics.completion >= 65 ? "Momentum is healthy" : metrics.completion >= 40 ? "Momentum is building" : "Momentum needs attention"}</strong><p>{metrics.activeStories.length} stories are carrying the current delivery load. {metrics.tasks.filter((task) => task.status !== "Closed").length} supporting tasks remain open.</p><div><TrendUp weight="bold" />{metrics.completion}% weighted completion</div></div></div></>);
  if (index === 5) return frame(<><SlideTitle index="05" kicker="VALUE DELIVERED" title="Completed outcomes are backed by acceptance criteria and delivery evidence." /><div className="value-layout"><div className="value-score"><span>DELIVERED</span><strong>{metrics.closedStories.length}</strong><p>stories closed in {presentation.sprintName}</p><small>{metrics.tasks.filter((item) => item.status === "Closed").length} supporting tasks complete</small></div><div className="story-proof-list">{metrics.closedStories.slice(0, 5).map((story) => <div key={story.id}><CheckCircle weight="fill" /><div><span>{story.id}</span><strong>{story.title}</strong><small>{story.acceptanceCriteria?.length || 0} acceptance criteria · {metrics.tests.filter((test) => test.storyId === story.id).length} tests</small></div></div>)}{metrics.closedStories.length === 0 && <div className="slide-empty"><Clock /><strong>No stories closed yet</strong><span>Completion evidence will appear here automatically.</span></div>}</div></div></>);
  if (index === 6) return frame(<><SlideTitle index="06" kicker="IN FLIGHT" title="The active sprint workload is clear, owned, and measurable." /><div className="inflight-table"><div><span>Work item</span><span>Owner</span><span>Progress</span><span>Priority</span></div>{metrics.activeStories.slice(0, 6).map((story) => <div key={story.id}><div><small>{story.id}</small><strong>{story.title}</strong></div><span>{story.assignee}</span><div className="inflight-progress"><ProgressBar value={story.progress} /><strong>{story.progress}%</strong></div><i className={`priority-${story.priority?.toLowerCase()}`}>{story.moscow || story.priority}</i></div>)}</div></>);
  if (index === 7) return frame(<><SlideTitle index="07" kicker="QUALITY SIGNAL" title="Quality readiness is visible through execution, pass rate, and story traceability." /><div className="quality-command"><div className="quality-score"><div style={{ "--qa-score": `${metrics.qaStarted * 3.6}deg` }}><strong>{metrics.qaStarted}%</strong><span>executed</span></div><p>{metrics.tests.length} sprint-linked test scenarios</p></div><div className="quality-breakdown"><SlideQualityRow label="Passed" value={metrics.passedTests.length} total={metrics.tests.length} tone="green" /><SlideQualityRow label="In progress" value={metrics.activeTests.length} total={metrics.tests.length} tone="purple" /><SlideQualityRow label="Not run" value={metrics.notRunTests.length} total={metrics.tests.length} tone="gray" /><SlideQualityRow label="Failed" value={metrics.failedTests.length} total={metrics.tests.length} tone="red" /></div><div className="quality-proof"><span>READINESS PROOF</span><strong>{metrics.passRate}%</strong><p>pass rate across all linked sprint scenarios</p><div><CheckCircle weight="fill" />Traceability maintained</div></div></div></>);
  if (index === 8) return frame(<><SlideTitle index="08" kicker="ATTENTION NEEDED" title="Focused decisions now will prevent avoidable rework next sprint." /><div className="attention-grid"><div><div className="attention-head"><span>DELIVERY RISKS</span><strong>{openRisks.length} open</strong></div>{openRisks.slice(0, 3).map((risk) => <div className="risk-card" key={risk.id}><i className={`impact-${risk.impact.toLowerCase()}`}>{risk.impact}</i><div><strong>{risk.title}</strong><small>{risk.status} · Owner: {risk.owner}</small></div></div>)}</div><div><div className="attention-head"><span>DECISIONS REQUIRED</span><strong>Client + Product</strong></div>{presentation.decisionsNeeded.slice(0, 3).map((decision, position) => <div className="decision-card" key={decision}><span>0{position + 1}</span><p>{decision}</p></div>)}</div></div></>);
  return frame(<><SlideTitle index="09" kicker="FORWARD VIEW" title="The next sprint is ready to move—with three clear actions to protect momentum." /><div className="forward-grid"><div className="next-outcomes"><span>NEXT SPRINT OUTCOMES</span>{presentation.nextSprintGoals.slice(0, 3).map((goal, position) => <div key={goal}><strong>0{position + 1}</strong><p>{goal}</p></div>)}</div><div className="client-actions"><span>CLIENT ACTIONS</span>{presentation.clientAsks.slice(0, 3).map((ask) => <div key={ask}><CheckCircle /><p>{ask}</p></div>)}</div></div><div className="closing-ribbon"><div><span>DELIVERY CONFIDENCE</span><strong>{presentation.confidence}</strong></div><p>Thank you</p><small>Next review · {presentation.dateRange}</small></div></>);
}

function SlideTitle({ index, kicker, title }) { return <div className="sprint-slide-title"><div><strong>{index}</strong><span>{kicker}</span></div><h2>{title}</h2></div>; }
function SlideMetric({ value, label, note }) { return <div className="slide-metric"><strong>{value}</strong><div><span>{label}</span>{note && <small>{note}</small>}</div></div>; }
function SlideStatusRow({ label, value, total, tone }) { const percentage = Math.round(value / Math.max(1, total) * 100); return <div className="slide-status-row"><div><span>{label}</span><strong>{value} · {percentage}%</strong></div><i><b className={tone} style={{ width: `${percentage}%` }} /></i></div>; }
function SlideQualityRow({ label, value, total, tone }) { const percentage = Math.round(value / Math.max(1, total) * 100); return <div className="quality-row"><div><span><i className={tone} />{label}</span><strong>{value}</strong></div><ProgressBar value={percentage} /></div>; }

function Reports({ state, project }) {
  const features = state.workItems.filter((item) => item.type === "Feature" && item.phase !== "Unplanned");
  const stories = state.workItems.filter((item) => item.type === "User Story");
  const byStatus = Object.fromEntries(statuses.map((status) => [status, stories.filter((item) => item.status === status).length]));
  const taskCount = state.workItems.filter((item) => item.type === "Task").length;
  const acceptanceCount = stories.reduce((total, story) => total + (story.acceptanceCriteria?.length || 0), 0);
  return <div className="content reports-page"><div className="page-heading"><div><span className="eyebrow">REPORTING</span><h1>Project status report</h1><p>A client-ready summary with live delivery and QA data.</p></div><a className="primary-button" href="/api/export.csv"><DownloadSimple />Export work items</a></div><section className="report-cover"><div><span>DELIVERY STATUS</span><h2>{project.name}</h2><p>{project.phase} · Updated {new Date().toLocaleDateString()}</p></div><div className="report-mark">{project.name.slice(0, 1)}</div></section><div className="metrics-row"><Metric label="Epics" value={state.workItems.filter((item) => item.type === "Epic").length} icon={Briefcase} /><Metric label="Features" value={features.length} tone="purple" icon={Flag} /><Metric label="User stories" value={stories.length} tone="green" icon={BookOpenText} /><Metric label="Tasks" value={taskCount} tone="amber" icon={CheckCircle} /></div><div className="report-grid"><section className="panel"><PanelHeader title="Story status" /><div className="status-chart">{statuses.map((status) => <div key={status}><span>{status}</span><div><i className={`chart-${status.toLowerCase()}`} style={{ width: `${stories.length ? byStatus[status] / stories.length * 100 : 0}%` }} /></div><strong>{byStatus[status]}</strong></div>)}</div></section><section className="panel"><PanelHeader title="Feature delivery" /><div className="feature-progress-list">{features.map((feature) => <div key={feature.id}><div><strong>{feature.title}</strong><span>{feature.progress}%</span></div><ProgressBar value={feature.progress} /></div>)}</div></section><section className="panel"><PanelHeader title="Current risk posture" /><div className="risk-list">{state.risks.map((risk, index) => <div className="risk" key={risk.id}><span className={`risk-number ${risk.impact === "High" ? "red" : "amber"}`}>{index + 1}</span><div><strong>{risk.title}</strong><small>{risk.status} · {risk.owner}</small></div></div>)}</div></section><section className="panel"><PanelHeader title="Readiness coverage" /><div className="coverage-list"><div><span>Acceptance criteria</span><strong>{acceptanceCount}</strong></div><div><span>Delivery tasks</span><strong>{taskCount}</strong></div><div><span>QA scenarios</span><strong>{state.tests.length}</strong></div><div><span>Dependencies</span><strong>{state.workItems.reduce((total, item) => total + (item.dependencies?.length || 0), 0)}</strong></div></div></section></div></div>;
}

const settingsTabs = [
  ["workspaces", "Workspaces", Briefcase],
  ["team", "Team & notifications", Users],
  ["access", "Access & security", Gear],
];

function Settings({ state, setState, showToast }) {
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];
  const [settingsTab, setSettingsTab] = useState("workspaces");
  const [form, setForm] = useState({ name: "", description: "", phase: "Phase 1", targetMilestone: "Scope approval", targetDate: "" });
  const [createError, setCreateError] = useState("");

  const [editForm, setEditForm] = useState({ name: "", description: "", phase: "Phase 1", targetMilestone: "", targetDate: "" });
  const [editError, setEditError] = useState("");

  const [userForm, setUserForm] = useState({ name: "", email: "" });
  const [userError, setUserError] = useState("");

  useEffect(() => {
    if (activeProject) {
      setEditForm({
        name: activeProject.name || "",
        description: activeProject.description || "",
        phase: activeProject.phase || "Phase 1",
        targetMilestone: activeProject.targetMilestone || "",
        targetDate: activeProject.targetDate || ""
      });
    }
  }, [state.activeProjectId, activeProject?.id]);

  const createProject = async (event) => {
    event.preventDefault();
    setCreateError("");
    try {
      const project = await api("/api/projects", { method: "POST", body: JSON.stringify(form) });
      const next = await api("/api/state");
      setState(next);
      setForm({ name: "", description: "", phase: "Phase 1", targetMilestone: "Scope approval", targetDate: "" });
      showToast(`Project ${project.name} created`);
    } catch (requestError) {
      setCreateError(requestError.message);
    }
  };

  const saveProjectEdit = async (event) => {
    event.preventDefault();
    setEditError("");
    try {
      const updated = await api(`/api/projects/${activeProject.id}`, { method: "PUT", body: JSON.stringify(editForm) });
      setState((current) => ({
        ...current,
        projects: current.projects.map((p) => p.id === activeProject.id ? updated : p)
      }));
      showToast(`Workspace details updated`);
    } catch (requestError) {
      setEditError(requestError.message);
    }
  };

  const switchWorkspace = async (projectId) => {
    try {
      const next = await api("/api/projects/active", { method: "PUT", body: JSON.stringify({ activeProjectId: projectId }) });
      setState(next);
      showToast(`Switched active workspace`);
    } catch (requestError) {
      showToast(requestError.message);
    }
  };

  const deleteWorkspace = async (workspace) => {
    if (!window.confirm(`Delete workspace “${workspace.name}”? Its work items, tests, risks, and sprint presentation will also be removed.`)) return;
    try {
      const next = await api(`/api/projects/${encodeURIComponent(workspace.id)}`, { method: "DELETE" });
      setState(next);
      showToast(`Workspace ${workspace.name} deleted`);
    } catch (requestError) { showToast(requestError.message); }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setUserError("");
    if (!userForm.name || !userForm.email) return;
    try {
      const newUser = await api("/api/users", { method: "POST", body: JSON.stringify(userForm) });
      setState((current) => ({
        ...current,
        users: [...(current.users || []), newUser]
      }));
      setUserForm({ name: "", email: "" });
      showToast(`User ${newUser.name} created`);
    } catch (requestError) {
      setUserError(requestError.message);
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user ${name}? Their assigned work items and test cases will become Unassigned.`)) return;
    try {
      const result = await api(`/api/users/${id}`, { method: "DELETE" });
      setState((current) => ({
        ...current,
        users: current.users.filter((u) => u.id !== id),
        workItems: current.workItems.map((item) => item.assignee === name ? { ...item, assignee: "Unassigned" } : item),
        tests: current.tests.map((test) => test.assignee === name ? { ...test, assignee: "Unassigned" } : test),
      }));
      showToast(`User deleted · ${result.unassignedWorkItems + result.unassignedTests} assignments cleared`);
    } catch (requestError) {
      showToast(requestError.message);
    }
  };

  return (
    <div className="content settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>Project settings</h1>
          <p>Manage reusable project workspaces, team users, email notifications, and shared access.</p>
        </div>
      </div>

      <div className="settings-nav">
        {settingsTabs.map(([key, label, Icon]) => (
          <button key={key} className={settingsTab === key ? "active" : ""} onClick={() => setSettingsTab(key)}>
            <Icon size={16} weight={settingsTab === key ? "fill" : "regular"} />
            <span>{label}</span>
            {key === "workspaces" && <em>{state.projects.length}</em>}
            {key === "team" && <em>{(state.users || []).length}</em>}
          </button>
        ))}
      </div>

      {settingsTab === "workspaces" && (
        <div className="settings-grid">
          <section className="panel settings-section">
            <PanelHeader title="Project workspaces" />
            <p>Click a workspace to make it active. Work items, boards, and presentations adapt automatically.</p>
            <div className="project-list">
              {state.projects.map((p) => (
                <div key={p.id} className={`project-list-item ${p.id === state.activeProjectId ? "active" : ""}`}><button type="button" onClick={() => switchWorkspace(p.id)}><div className="project-avatar">{p.name.slice(0, 1)}</div><div><strong>{p.name}</strong><small>{p.targetMilestone}{p.targetDate ? ` · ${new Date(`${p.targetDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}</small></div><span className="phase-pill">{p.phase}</span>{p.id === state.activeProjectId ? <span className="workspace-active-pill"><CheckCircle size={13} weight="fill" />Active</span> : <span className="workspace-switch-hint">Switch</span>}</button><button className="icon-button delete workspace-delete" type="button" onClick={() => deleteWorkspace(p)} title={`Delete ${p.name}`} disabled={state.projects.length <= 1}><Trash size={15} /></button></div>
              ))}
            </div>
          </section>

          {activeProject && (
            <section className="panel settings-section">
              <PanelHeader title={`Edit “${activeProject.name}”`} />
              <form className="settings-form" onSubmit={saveProjectEdit}>
                <label>Project name<input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label>
                <label>Description<textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></label>
                <div className="form-row">
                  <label>Current phase
                    <select value={editForm.phase} onChange={(event) => setEditForm({ ...editForm, phase: event.target.value })}>
                      <option>Phase 1</option>
                      <option>Phase 2</option>
                      <option>Phase 3</option>
                    </select>
                  </label>
                  <label>Target date<input type="date" value={editForm.targetDate} onChange={(event) => setEditForm({ ...editForm, targetDate: event.target.value })} /></label>
                </div>
                <label>Target milestone<input value={editForm.targetMilestone} onChange={(event) => setEditForm({ ...editForm, targetMilestone: event.target.value })} /></label>
                {editError && <div className="form-error">{editError}</div>}
                <button className="primary-button"><FloppyDisk />Save workspace changes</button>
              </form>
            </section>
          )}

          <section className="panel settings-section">
            <PanelHeader title="Create new workspace" />
            <form className="settings-form" onSubmit={createProject}>
              <label>Project name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Customer Portal" /></label>
              <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <div className="form-row">
                <label>Current phase
                  <select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}>
                    <option>Phase 1</option>
                    <option>Phase 2</option>
                    <option>Phase 3</option>
                  </select>
                </label>
                <label>Target date<input type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></label>
              </div>
              <label>Target milestone<input value={form.targetMilestone} onChange={(event) => setForm({ ...form, targetMilestone: event.target.value })} /></label>
              {createError && <div className="form-error">{createError}</div>}
              <button className="primary-button"><Plus />Create project</button>
            </form>
          </section>
        </div>
      )}

      {settingsTab === "team" && (
        <div className="settings-grid">
          <section className="panel settings-section">
            <PanelHeader title="Team users" />
            <p>Register team members with their emails. When work is assigned to them, a notification email is simulated.</p>
            <form className="settings-form user-form" onSubmit={createUser}>
              <div className="form-row">
                <label>Full name<input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} placeholder="e.g. Alex Dela Cruz" required /></label>
                <label>Email<input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="e.g. alex@example.com" required /></label>
              </div>
              {userError && <div className="form-error">{userError}</div>}
              <button className="primary-button"><Plus />Add team user</button>
            </form>
            <div className="user-list">
              {(state.users || []).length === 0 && <p className="empty-text">No team users yet — add the first one above.</p>}
              {(state.users || []).map((u) => (
                <div key={u.id} className="user-item">
                  <div className="user-avatar-circle">{u.name.slice(0, 2).toUpperCase()}</div>
                  <div className="user-details">
                    <strong>{u.name}</strong>
                    <span>{u.email}</span>
                  </div>
                  <button className="icon-button delete" type="button" onClick={() => deleteUser(u.id, u.name)} title="Delete user"><Trash size={15} /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel settings-section email-logs-section">
            <PanelHeader title="Simulated email notifications" />
            <p>Outbound notifications triggered by item assignments, newest first.</p>
            <div className="email-logs-list">
              {(!state.emails || state.emails.length === 0) ? (
                <div className="links-empty">
                  <EnvelopeSimple size={26} weight="duotone" />
                  <strong>No emails dispatched yet</strong>
                  <span>Assign a work item to a registered team user to trigger one.</span>
                </div>
              ) : (
                state.emails.map((email) => (
                  <div key={email.id} className="email-log-item">
                    <div className="email-log-icon"><EnvelopeSimple size={16} weight="duotone" /></div>
                    <div className="email-log-content">
                      <div className="email-log-meta">
                        <strong>{email.to}</strong>
                        <small>{new Date(email.sentAt).toLocaleString()}</small>
                      </div>
                      <div className="email-log-subject">{email.subject}</div>
                      <details className="email-log-details">
                        <summary>View message body</summary>
                        <pre className="email-log-body">{email.body}</pre>
                      </details>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {settingsTab === "access" && (
        <div className="settings-grid">
          <section className="panel settings-section access-card">
            <PanelHeader title="Shared access" />
            <div className="access-icon"><Users size={28} weight="duotone" /></div>
            <h3>One credential, shared state</h3>
            <p>All users sign in with one server-managed credential. Updates persist centrally and are immediately available to the next user.</p>
            <div className="access-note">
              <Warning size={18} />
              <span>Change <code>ATLAS_USERNAME</code> and <code>ATLAS_PASSWORD</code> before exposing this service beyond a trusted internal network.</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
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
    {tab === "details" && (editing ? (
      <div className="detail-form">
        <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label>Description<textarea rows="4" value={draft.description || ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <div className="form-row">
          <label>Status
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value, progress: event.target.value === "Closed" ? 100 : draft.progress })}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>Phase
            <select value={draft.phase || "Phase 1"} onChange={(event) => setDraft({ ...draft, phase: event.target.value })}>
              <option>Phase 1</option>
              <option>Phase 2</option>
              <option>Phase 3</option>
              <option>Unplanned</option>
            </select>
          </label>
          {(item.type === "Feature" || item.type === "User Story") ? (
            <label>MoSCoW
              <select value={draft.moscow || "Should Have"} onChange={(event) => setDraft({ ...draft, moscow: event.target.value })}>
                <option>Must Have</option>
                <option>Should Have</option>
                <option>Could Have</option>
                <option>Won't Have</option>
              </select>
            </label>
          ) : (
            <label>Type<input disabled value={item.type} /></label>
          )}
        </div>
        <div className="form-row">
          <label>Assignee
            <select value={draft.assignee || "Unassigned"} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}>
              <option value="Unassigned">Unassigned</option>
              {(state.users || []).map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </label>
          <label>Sprint<input value={draft.sprint || ""} onChange={(event) => setDraft({ ...draft, sprint: event.target.value })} placeholder="Backlog for unplanned" /></label>
        </div>
        <div className="form-row">
          <label>Story points<input type="number" value={draft.storyPoints || 0} onChange={(event) => setDraft({ ...draft, storyPoints: Number(event.target.value) })} /></label>
          <label>Progress<input type="number" min="0" max="100" value={draft.progress || 0} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} /></label>
        </div>
        {item.type === "User Story" && <div className="form-row">
          <label>Complexity<select value={draft.complexity || "Medium"} onChange={(event) => setDraft({ ...draft, complexity: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Approved by client<select value={draft.approvedByClient || "No"} onChange={(event) => setDraft({ ...draft, approvedByClient: event.target.value })}><option>Yes</option><option>No</option></select></label>
        </div>}
        <label>Dependencies <small>One Work Item ID per line</small><textarea rows="4" value={(draft.dependencies || []).join("\n")} onChange={(event) => setDraft({ ...draft, dependencies: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} placeholder="US-BASIC-001" /></label>
        <label>Acceptance criteria <small>One criterion per line</small><textarea rows="6" value={(draft.acceptanceCriteria || []).join("\n")} onChange={(event) => setDraft({ ...draft, acceptanceCriteria: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label>
        <label>QA focus <small>One test focus per line</small><textarea rows="6" value={(draft.qaFocus || []).join("\n")} onChange={(event) => setDraft({ ...draft, qaFocus: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label>
        <label>Source trace<textarea rows="3" value={draft.sourceTrace || ""} onChange={(event) => setDraft({ ...draft, sourceTrace: event.target.value })} /></label>
      </div>
    ) : (
      <div className="detail-content">
        <Section title="Description"><p>{item.description || "No description supplied."}</p></Section>
        {item.persona && <Section title="User story"><p><strong>{item.persona}</strong> {item.need} {item.benefit}</p></Section>}
        <Section title="Planning">
          <dl>
            <div><dt>Phase</dt><dd>{item.phase || "—"}</dd></div>
            <div><dt>MoSCoW</dt><dd>{item.moscow || "—"}</dd></div>
            <div><dt>Sprint</dt><dd>{item.sprint || "Backlog"}</dd></div>
            <div><dt>Story points</dt><dd>{item.storyPoints || "—"}</dd></div>
            <div><dt>Complexity</dt><dd>{item.complexity || "—"}</dd></div>
            {item.type === "User Story" && <div><dt>Approved by client</dt><dd>{item.approvedByClient || "No"}</dd></div>}
            <div><dt>Progress</dt><dd>{item.progress || 0}%</dd></div>
          </dl>
          <ProgressBar value={item.progress} />
        </Section>
        <Section title="Dependencies">
          {item.dependencies?.length ? (
            <div className="tags dependency-tags">
              {item.dependencies.map((dependency) => {
                const linked = state.workItems.some((entry) => entry.id === dependency);
                return linked ? <button key={dependency} onClick={() => openItem(dependency)}><LinkSimple />{dependency}</button> : <span key={dependency}>{dependency}</span>;
              })}
            </div>
          ) : (
            <p>No dependencies recorded.</p>
          )}
        </Section>
        <Section title="Source trace"><p>{item.sourceTrace || "Created in Atlas Delivery Hub"}</p></Section>
      </div>
    ))}
    {tab === "criteria" && <div className="check-list">{item.acceptanceCriteria?.length ? item.acceptanceCriteria.map((criterion, index) => <div key={index}><CheckCircle size={20} weight="fill" /><p>{criterion}</p></div>) : <Empty title="No acceptance criteria" text="Edit this item to add delivery conditions." />}{item.qaFocus?.length > 0 && <><h3>QA focus</h3>{item.qaFocus.map((focus, index) => <div key={index}><TestTube size={20} /><p>{focus}</p></div>)}</>}</div>}
    {tab === "children" && <div className="child-list">{children.map((child) => <button key={child.id} onClick={() => openItem(child.id)}><TypeIcon type={child.type} /><div><strong>{child.id}</strong><span>{child.title}</span></div><Status value={child.status} /></button>)}{children.length === 0 && <Empty title="No child items" text="Add a child work item to break down the scope." />}<button className="secondary-button full" onClick={() => openCreate({ parentId: item.id, type: item.type === "Epic" ? "Feature" : item.type === "Feature" ? "User Story" : "Task" })}><Plus />Add child work item</button></div>}
    {tab === "tests" && <div className="child-list">{tests.map((test) => editingTestId === test.id ? <div className="inline-test-editor" key={test.id}><label>Test title<input value={testDraft.title} onChange={(event) => setTestDraft({ ...testDraft, title: event.target.value })} /></label><label>Preconditions<textarea rows="2" value={testDraft.preconditions || ""} onChange={(event) => setTestDraft({ ...testDraft, preconditions: event.target.value })} /></label><label>Steps<textarea rows="3" value={(testDraft.steps || []).join("\n")} onChange={(event) => setTestDraft({ ...testDraft, steps: event.target.value.split("\n").filter(Boolean) })} /></label><label>Expected result<textarea rows="2" value={testDraft.expectedResult || ""} onChange={(event) => setTestDraft({ ...testDraft, expectedResult: event.target.value })} /></label><div><button className="secondary-button" onClick={() => setEditingTestId(null)}>Cancel</button><button className="primary-button" onClick={saveTest}><Check />Save test</button></div></div> : <div className="test-row" key={test.id}><TestTube /><div><strong>{test.id}</strong><span>{test.title}</span></div><div className="test-row-actions"><span className={`test-pill test-${test.status.toLowerCase().replaceAll(" ", "-")}`}>{test.status}</span><button className="text-button" onClick={() => editTest(test)}>Edit</button></div></div>)}{tests.length === 0 && <Empty title="No linked tests" text="Import test cases from Excel or add QA focus while editing the User Story." />}</div>}
    {tab === "history" && <div className="history-list">{activities.length ? activities.map((entry) => <div key={entry.id}><span /><div><strong>{entry.action}</strong><p>{entry.actor} · {new Date(entry.at).toLocaleString()}</p></div></div>) : <Empty title="No recorded changes" text="Updates to this item appear here." />}</div>}
  </div><footer>{editing ? <><button className="secondary-button" onClick={() => { setDraft(item); setEditing(false); }}>Cancel</button><button className="primary-button" onClick={save}><Check />Save changes</button></> : <><button className="danger-button" onClick={remove}><Trash />Delete</button><button className="primary-button" onClick={() => { setTab("details"); setEditing(true); }}>Edit work item</button></>}</footer></aside>;
}

function Section({ title, children }) { return <section><h3>{title}</h3>{children}</section>; }

function CreateModal({ state, defaults, close, onCreated }) {
  const [form, setForm] = useState({ type: defaults.type || "User Story", parentId: defaults.parentId || "", title: "", description: "", status: defaults.status || "New", priority: "Medium", moscow: "Should Have", phase: defaults.phase || "Phase 1", assignee: "Unassigned", sprint: defaults.sprint || "Backlog", storyPoints: 0, complexity: "Medium", approvedByClient: "No", dependenciesText: "", acceptanceText: "", qaFocusText: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const validParents = state.workItems.filter((item) => form.type === "Epic" ? false : form.type === "Feature" ? item.type === "Epic" : form.type === "User Story" || form.type === "Bug" ? item.type === "Feature" : item.type === "User Story");
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const item = await api("/api/work-items", { method: "POST", body: JSON.stringify({ ...form, acceptanceCriteria: form.acceptanceText.split("\n").map((value) => value.trim()).filter(Boolean), qaFocus: form.qaFocusText.split("\n").map((value) => value.trim()).filter(Boolean), dependencies: form.dependenciesText.split("\n").map((value) => value.trim()).filter(Boolean) }) }); onCreated(item); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } };
  
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <form className="modal create-work-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="eyebrow">NEW WORK ITEM</span>
            <h2>Create work item</h2>
          </div>
          <button type="button" className="icon-button" onClick={close}><X /></button>
        </header>
        
        <div className="form-row">
          <label>Type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, parentId: "" })}>
              <option>Epic</option>
              <option>Feature</option>
              <option>User Story</option>
              <option>Task</option>
              <option>Bug</option>
            </select>
          </label>
          <label>Parent
            <select disabled={form.type === "Epic"} value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
              <option value="">No parent</option>
              {validParents.map((item) => <option value={item.id} key={item.id}>{item.id} — {item.title}</option>)}
            </select>
          </label>
        </div>

        <label>Title<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be delivered?" required /></label>
        <label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the outcome, context, or user need." /></label>

        <div className="form-row">
          <label>Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>Phase
            <select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}>
              <option>Phase 1</option>
              <option>Phase 2</option>
              <option>Phase 3</option>
              <option>Unplanned</option>
            </select>
          </label>
          {(form.type === "Feature" || form.type === "User Story") ? (
            <label>MoSCoW
              <select value={form.moscow} onChange={(event) => setForm({ ...form, moscow: event.target.value })}>
                <option>Must Have</option>
                <option>Should Have</option>
                <option>Could Have</option>
                <option>Won't Have</option>
              </select>
            </label>
          ) : (
            <label>Story points<input type="number" value={form.storyPoints} onChange={(event) => setForm({ ...form, storyPoints: Number(event.target.value) })} /></label>
          )}
        </div>

        <div className="form-row">
          <label>Assignee
            <select value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })}>
              <option value="Unassigned">Unassigned</option>
              {(state.users || []).map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </label>
          <label>Sprint<input value={form.sprint} onChange={(event) => setForm({ ...form, sprint: event.target.value })} placeholder="Backlog for unplanned" /></label>
        </div>

        {form.type === "User Story" && <div className="form-row">
          <label>Complexity<select value={form.complexity} onChange={(event) => setForm({ ...form, complexity: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Approved by client<select value={form.approvedByClient} onChange={(event) => setForm({ ...form, approvedByClient: event.target.value })}><option>Yes</option><option>No</option></select></label>
        </div>}

        <label>Dependencies <small>One Work Item ID per line</small><textarea rows="3" value={form.dependenciesText} onChange={(event) => setForm({ ...form, dependenciesText: event.target.value })} placeholder="US-BASIC-001" /></label>

        {form.type === "User Story" && (
          <>
            <label>Acceptance criteria <small>One criterion per line</small><textarea rows="4" value={form.acceptanceText} onChange={(event) => setForm({ ...form, acceptanceText: event.target.value })} /></label>
            <label>QA focus <small>One focus or test per line</small><textarea rows="4" value={form.qaFocusText} onChange={(event) => setForm({ ...form, qaFocusText: event.target.value })} /></label>
          </>
        )}

        {error && <div className="form-error"><Warning />{error}</div>}

        <footer>
          <button type="button" className="secondary-button" onClick={close}>Cancel</button>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? <SpinnerGap className="spin" /> : <Plus />}Create {form.type.toLowerCase()}</button>
        </footer>
      </form>
    </div>
  );
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

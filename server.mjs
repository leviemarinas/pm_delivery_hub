import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(root, "src", "data", "atlas-source.json");
const dataDir = path.join(root, "data");
const dataPath = path.join(dataDir, "atlas-hub.json");
const distDir = path.join(root, "dist");
const port = Number(process.env.PORT || 4173);
const username = process.env.ATLAS_USERNAME || "atlas";
const password = process.env.ATLAS_PASSWORD || "atlas2026";
const sessions = new Map();

const statusSets = {
  "FEAT-PAY-BASIC-001": ["Closed", "Active", "Active", "New", "New"],
  "FEAT-PAY-LOAN-001": ["Closed", "Active", "Active", "New", "New", "New"],
  "FEAT-PAY-BONUS-001": ["Active", "Active", "New", "New", "New"],
  "FEAT-PAY-DEMIN-001": ["Closed", "Active", "Active", "New", "New"],
  "FEAT-PAY-CROSS-001": ["Active", "New", "New"],
};

const featurePlans = {
  "FEAT-PAY-BASIC-001": { scopeStatus: "On Track", targetDate: "2026-07-31" },
  "FEAT-PAY-LOAN-001": { scopeStatus: "On Track", targetDate: "2026-08-14" },
  "FEAT-PAY-BONUS-001": { scopeStatus: "At Risk", targetDate: "2026-08-21" },
  "FEAT-PAY-DEMIN-001": { scopeStatus: "On Track", targetDate: "2026-08-14" },
  "FEAT-PAY-CROSS-001": { scopeStatus: "On Track", targetDate: "2026-08-31" },
};

function now() {
  return new Date().toISOString();
}

function seedState(source) {
  const createdAt = now();
  const workItems = [];
  workItems.push({
    ...source.epic,
    type: "Epic",
    parentId: null,
    status: "Active",
    priority: "High",
    assignee: "Project Team",
    sprint: "Program",
    storyPoints: 0,
    progress: 42,
    createdAt,
    updatedAt: createdAt,
  });

  for (const feature of source.features) {
    const featureStories = source.stories.filter((story) => story.featureId === feature.id);
    const statuses = statusSets[feature.id] || [];
    const completed = statuses.filter((status) => status === "Closed").length;
    const active = statuses.filter((status) => status === "Active").length;
    const progress = Math.round(((completed + active * 0.5) / Math.max(featureStories.length, 1)) * 100);
    workItems.push({
      ...feature,
      ...featurePlans[feature.id],
      type: "Feature",
      parentId: source.epic.id,
      status: progress >= 100 ? "Closed" : progress > 0 ? "Active" : "New",
      priority: "High",
      assignee: "BA Team",
      sprint: feature.id.includes("CROSS") ? "Sprint 10" : "Sprint 8",
      storyPoints: featureStories.length * 8,
      progress,
      createdAt,
      updatedAt: createdAt,
    });

    featureStories.forEach((story, storyIndex) => {
      const status = statuses[storyIndex] || "New";
      const storyAssignees = ["Alex Dela Cruz", "Rhea Santos", "Marco Reyes", "Mika Reyes"];
      workItems.push({
        ...story,
        type: "User Story",
        parentId: feature.id,
        status,
        assignee: storyAssignees[storyIndex % storyAssignees.length],
        sprint: storyIndex < 2 ? "Sprint 8" : "Sprint 9",
        storyPoints: [5, 8, 5, 3, 5, 8][storyIndex % 6],
        progress: status === "Closed" ? 100 : status === "Active" ? 50 : 0,
        createdAt,
        updatedAt: createdAt,
      });

      story.tasks.forEach((task, taskIndex) => {
        const taskStatus = status === "Closed" ? "Closed" : status === "Active" && taskIndex < 2 ? "Active" : "New";
        workItems.push({
          ...task,
          type: "Task",
          parentId: story.id,
          description: task.title,
          acceptanceCriteria: [],
          qaFocus: [],
          dependencies: [],
          sourceTrace: story.sourceTrace,
          priority: story.priority,
          complexity: "Low",
          status: taskStatus,
          assignee: task.ownerRole,
          sprint: storyIndex < 2 ? "Sprint 8" : "Sprint 9",
          storyPoints: 1,
          progress: taskStatus === "Closed" ? 100 : taskStatus === "Active" ? 50 : 0,
          createdAt,
          updatedAt: createdAt,
        });
      });
    });
  }

  const tests = source.stories.flatMap((story) =>
    story.qaFocus.map((title, index) => ({
      id: `TC-${story.id.replace("US-", "")}-${String(index + 1).padStart(2, "0")}`,
      storyId: story.id,
      featureId: story.featureId,
      title,
      status: index === 0 && story.id.endsWith("001") ? "Passed" : index === 1 ? "In Progress" : "Not Run",
      priority: story.priority,
      assignee: "QA Team",
      updatedAt: createdAt,
    }))
  );

  return {
    version: 1,
    activeProjectId: "atlas-payroll",
    projects: [{
      id: "atlas-payroll",
      name: "Atlas Payroll",
      description: source.epic.description,
      phase: "BA / Requirements",
      targetMilestone: "Requirements Sign-off",
      targetDate: "2026-08-31",
      createdAt,
    }],
    workItems,
    tests,
    risks: [
      { id: "RISK-001", title: "Bonus computation rules need final business confirmation", impact: "High", likelihood: "Medium", status: "Open", owner: "BA Team" },
      { id: "RISK-002", title: "Cross-module payroll dependencies may affect delivery order", impact: "High", likelihood: "Medium", status: "Mitigating", owner: "Tech Lead" },
      { id: "RISK-003", title: "De Minimis effective-date handling needs implementation decision", impact: "Medium", likelihood: "Low", status: "Open", owner: "BA Team" },
    ],
    activities: [
      { id: crypto.randomUUID(), action: "Atlas requirements imported", actor: "System", itemId: source.epic.id, at: createdAt },
    ],
    source,
  };
}

async function loadState() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const existing = JSON.parse(await fs.readFile(dataPath, "utf8"));
    let migrated = false;
    existing.workItems = existing.workItems.map((item) => {
      if (item.type === "Feature" && featurePlans[item.id] && (!item.scopeStatus || !item.targetDate)) {
        migrated = true;
        return { ...item, ...featurePlans[item.id] };
      }
      return item;
    });
    if (migrated) await saveState(existing);
    return existing;
  } catch {
    const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
    const state = seedState(source);
    await saveState(state);
    return state;
  }
}

async function saveState(nextState) {
  const temporaryPath = `${dataPath}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(nextState, null, 2));
  await fs.rename(temporaryPath, dataPath);
}

let state = await loadState();

function cookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").filter(Boolean).map((part) => {
    const [key, ...rest] = part.trim().split("=");
    return [key, decodeURIComponent(rest.join("="))];
  }));
}

function authenticated(request) {
  return sessions.has(cookies(request).atlas_session);
}

function json(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

async function body(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 2_000_000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function activity(action, itemId) {
  state.activities.unshift({ id: crypto.randomUUID(), action, actor: "Shared User", itemId, at: now() });
  state.activities = state.activities.slice(0, 100);
}

function nextId(type) {
  const prefixes = { Epic: "EPIC", Feature: "FEAT", "User Story": "US", Task: "TASK", Bug: "BUG" };
  const prefix = prefixes[type] || "ITEM";
  const count = state.workItems.filter((item) => item.type === type).length + 1;
  return `${prefix}-CUSTOM-${String(count).padStart(3, "0")}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/login" && request.method === "POST") {
    const credentials = await body(request);
    if (!secureEqual(credentials.username || "", username) || !secureEqual(credentials.password || "", password)) {
      return json(response, 401, { error: "Invalid shared credential." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { createdAt: now() });
    return json(response, 200, { authenticated: true, user: "Shared User" }, {
      "Set-Cookie": `atlas_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`,
    });
  }
  if (url.pathname === "/api/logout" && request.method === "POST") {
    sessions.delete(cookies(request).atlas_session);
    return json(response, 200, { authenticated: false }, {
      "Set-Cookie": "atlas_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
    });
  }
  if (url.pathname === "/api/session") {
    return json(response, 200, { authenticated: authenticated(request), user: authenticated(request) ? "Shared User" : null });
  }
  if (!authenticated(request)) return json(response, 401, { error: "Authentication required." });

  if (url.pathname === "/api/state" && request.method === "GET") return json(response, 200, state);
  if (url.pathname === "/api/projects" && request.method === "POST") {
    const input = await body(request);
    const project = { id: `project-${crypto.randomUUID().slice(0, 8)}`, name: input.name?.trim(), description: input.description?.trim() || "", phase: input.phase || "Discovery", targetMilestone: input.targetMilestone || "Scope approval", targetDate: input.targetDate || "", createdAt: now() };
    if (!project.name) return json(response, 400, { error: "Project name is required." });
    state.projects.push(project);
    state.activeProjectId = project.id;
    activity(`Created project ${project.name}`, project.id);
    await saveState(state);
    return json(response, 201, project);
  }
  if (url.pathname === "/api/work-items" && request.method === "POST") {
    const input = await body(request);
    const item = {
      id: input.id?.trim() || nextId(input.type),
      projectId: input.projectId || state.activeProjectId,
      type: input.type || "User Story",
      parentId: input.parentId || null,
      title: input.title?.trim(),
      description: input.description?.trim() || "",
      status: input.status || "New",
      priority: input.priority || "Medium",
      complexity: input.complexity || "Medium",
      assignee: input.assignee?.trim() || "Unassigned",
      sprint: input.sprint?.trim() || "Backlog",
      storyPoints: Number(input.storyPoints || 0),
      progress: Number(input.progress || 0),
      acceptanceCriteria: input.acceptanceCriteria || [],
      qaFocus: input.qaFocus || [],
      dependencies: input.dependencies || [],
      sourceTrace: input.sourceTrace || "Created in Atlas Delivery Hub",
      createdAt: now(),
      updatedAt: now(),
    };
    if (!item.title) return json(response, 400, { error: "Title is required." });
    if (state.workItems.some((existing) => existing.id === item.id)) return json(response, 409, { error: "Work item ID already exists." });
    state.workItems.push(item);
    activity(`Created ${item.type}: ${item.title}`, item.id);
    await saveState(state);
    return json(response, 201, item);
  }
  const workItemMatch = url.pathname.match(/^\/api\/work-items\/([^/]+)$/);
  if (workItemMatch && request.method === "PUT") {
    const id = decodeURIComponent(workItemMatch[1]);
    const index = state.workItems.findIndex((item) => item.id === id);
    if (index < 0) return json(response, 404, { error: "Work item not found." });
    const input = await body(request);
    state.workItems[index] = { ...state.workItems[index], ...input, id, updatedAt: now() };
    activity(`Updated ${id}`, id);
    await saveState(state);
    return json(response, 200, state.workItems[index]);
  }
  if (workItemMatch && request.method === "DELETE") {
    const id = decodeURIComponent(workItemMatch[1]);
    if (state.workItems.some((item) => item.parentId === id)) return json(response, 409, { error: "Move or delete child items first." });
    const index = state.workItems.findIndex((item) => item.id === id);
    if (index < 0) return json(response, 404, { error: "Work item not found." });
    state.workItems.splice(index, 1);
    activity(`Deleted ${id}`, id);
    await saveState(state);
    return json(response, 200, { deleted: true });
  }
  const testMatch = url.pathname.match(/^\/api\/tests\/([^/]+)$/);
  if (testMatch && request.method === "PUT") {
    const id = decodeURIComponent(testMatch[1]);
    const index = state.tests.findIndex((test) => test.id === id);
    if (index < 0) return json(response, 404, { error: "Test not found." });
    const input = await body(request);
    state.tests[index] = { ...state.tests[index], ...input, id, updatedAt: now() };
    activity(`Updated test ${id} to ${state.tests[index].status}`, state.tests[index].storyId);
    await saveState(state);
    return json(response, 200, state.tests[index]);
  }
  if (url.pathname === "/api/export.csv") {
    const headers = ["ID", "Type", "Parent", "Title", "Status", "Priority", "Assignee", "Sprint", "Story Points", "Progress"];
    const lines = [headers, ...state.workItems.map((item) => [item.id, item.type, item.parentId, item.title, item.status, item.priority, item.assignee, item.sprint, item.storyPoints, item.progress])];
    response.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=atlas-work-items.csv" });
    return response.end(lines.map((line) => line.map(csvEscape).join(",")).join("\n"));
  }
  return json(response, 404, { error: "API route not found." });
}

const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(request, response, url);
    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    let filePath = path.join(distDir, requested);
    if (!filePath.startsWith(distDir)) return json(response, 403, { error: "Forbidden" });
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
      const content = await fs.readFile(filePath);
      response.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
      response.end(content);
    } catch {
      const content = await fs.readFile(path.join(distDir, "index.html"));
      response.writeHead(200, { "Content-Type": mime[".html"] });
      response.end(content);
    }
  } catch (error) {
    console.error(error);
    json(response, 500, { error: "Unexpected server error." });
  }
});

const host = process.env.HOST || "0.0.0.0";
server.listen(port, host, () => {
  console.log(`Atlas Delivery Hub running at http://${host}:${port}`);
});

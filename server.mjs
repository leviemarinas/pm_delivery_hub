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

function defaultSprintPresentation() {
  return {
    id: "atlas-sprint-review",
    projectId: "atlas-payroll",
    sprintName: "Sprint 8",
    dateRange: "July 6 - July 17, 2026",
    audience: "Atlas Payroll Stakeholders",
    headline: "Core payroll requirements are moving into implementation-ready shape.",
    sprintGoal: "Finalize the delivery definition for Basic Pay and Company Loan while progressing Bonus and De Minimis scope.",
    executiveSummary: "The team has established a traceable delivery baseline across the four priority payroll modules. Basic Pay and Company Loan are furthest along, while Bonus decisions and cross-module dependencies remain the main focus areas.",
    highlights: [
      "Basic Pay requirements now include rate derivation, effective dating, retro pay, and audit behavior.",
      "Company Loan coverage includes amortization, balances, payment priority, and minimum take-home rules.",
      "All imported stories now have acceptance criteria, delivery tasks, and linked QA scenarios.",
    ],
    decisionsNeeded: [
      "Confirm the final Bonus computation and eligibility rules.",
      "Confirm how De Minimis effective-date versions apply during payroll processing.",
      "Agree the priority for cross-module payroll integration work.",
    ],
    nextSprintGoals: [
      "Close remaining Bonus and De Minimis business-rule questions.",
      "Move Basic Pay stories into development-ready status.",
      "Begin end-to-end QA design for payroll computation scenarios.",
    ],
    clientAsks: [
      "Provide owners for open business-rule decisions.",
      "Review and approve the Definition of Ready for development handoff.",
      "Confirm the next sprint review date and stakeholder group.",
    ],
    presenterNotes: "Lead with the overall outcome, explain the evidence behind the status, then close on the decisions needed to protect the next sprint.",
    confidence: "On Track",
    updatedAt: now(),
  };
}

function now() {
  return new Date().toISOString();
}

function moscowFromPriority(priority) {
  if (priority === "Critical" || priority === "High") return "Must Have";
  if (priority === "Medium") return "Should Have";
  return "Could Have";
}

function unplannedScopeItems(createdAt) {
  return [
    {
      id: "EPIC-UNPLANNED",
      title: "Unplanned and Future Scope",
      description: "Holding epic for features and user stories that are not committed to an active sprint or delivery phase.",
      type: "Epic",
      parentId: null,
      status: "New",
      priority: "Low",
      phase: "Unplanned",
      assignee: "Product Owner",
      sprint: "Backlog",
      storyPoints: 0,
      progress: 0,
      acceptanceCriteria: [],
      qaFocus: [],
      dependencies: [],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "FEAT-UNPLANNED",
      title: "Unplanned Work Item Intake",
      description: "Container for new user stories that have not yet been prioritized into a sprint.",
      type: "Feature",
      parentId: "EPIC-UNPLANNED",
      status: "New",
      priority: "Low",
      moscow: "Could Have",
      phase: "Unplanned",
      scopeStatus: "Unplanned",
      assignee: "Product Owner",
      sprint: "Backlog",
      storyPoints: 0,
      progress: 0,
      acceptanceCriteria: [],
      qaFocus: [],
      dependencies: [],
      createdAt,
      updatedAt: createdAt,
    },
  ];
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
    phase: "Phase 2",
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
      phase: feature.id.includes("CROSS") ? "Phase 3" : "Phase 2",
      moscow: feature.id.includes("CROSS") ? "Should Have" : "Must Have",
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
        phase: story.featureId.includes("CROSS") ? "Phase 3" : "Phase 2",
        moscow: moscowFromPriority(story.priority),
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
          phase: story.featureId.includes("CROSS") ? "Phase 3" : "Phase 2",
          storyPoints: 1,
          progress: taskStatus === "Closed" ? 100 : taskStatus === "Active" ? 50 : 0,
          createdAt,
          updatedAt: createdAt,
        });
      });
    });
  }

  workItems.push(...unplannedScopeItems(createdAt));

  const tests = source.stories.flatMap((story) =>
    story.qaFocus.map((title, index) => ({
      id: `TC-${story.id.replace("US-", "")}-${String(index + 1).padStart(2, "0")}`,
      storyId: story.id,
      featureId: story.featureId,
      title,
      status: index === 0 && story.id.endsWith("001") ? "Passed" : index === 1 ? "In Progress" : "Not Run",
      priority: story.priority,
      assignee: "QA Team",
      preconditions: "",
      steps: [],
      expectedResult: title,
      sprint: "Backlog",
      tags: [],
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
      phase: "Phase 2 - Payroll Delivery",
      targetMilestone: "Requirements Sign-off",
      targetDate: "2026-08-31",
      linkGroups: ["General", "Worksheets", "Presentations", "External Sites"],
      links: [
        { id: "link-1", name: "Bug Inventory Summary", url: "https://docs.google.com/spreadsheets/d/10SCnCAbwqQB4Llix_gQllwygaCk5k-yWKv76_yxQi_k/edit", group: "Worksheets" },
        { id: "link-2", name: "Payroll Timeline Sheet", url: "https://docs.google.com/spreadsheets/d/1FopPinrWpPNFCJ3mfAVBHh2gZ-EB9VACgOqJwo8LNMQ/edit", group: "Worksheets" },
        { id: "link-3", name: "Client Kickoff Slides", url: "https://docs.google.com/presentation/d/1K-G0Z9y2PzS8x56wF7p7i4qQp37sN_sC-oD7j9l-8zE/edit", group: "Presentations" },
        { id: "link-4", name: "System Architecture Design", url: "https://mermaid.live/", group: "External Sites" }
      ],
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
    presentations: [defaultSprintPresentation()],
    source,
    users: [
      { id: "user-1", name: "Alex Dela Cruz", email: "alex.delacruz@example.com" },
      { id: "user-2", name: "Rhea Santos", email: "rhea.santos@example.com" },
      { id: "user-3", name: "Marco Reyes", email: "marco.reyes@example.com" },
      { id: "user-4", name: "Mika Reyes", email: "mika.reyes@example.com" },
      { id: "user-5", name: "BA Team", email: "ba.team@example.com" },
      { id: "user-6", name: "QA Team", email: "qa.team@example.com" },
      { id: "user-7", name: "Project Team", email: "project.team@example.com" },
      { id: "user-8", name: "Tech Lead", email: "tech.lead@example.com" }
    ],
    emails: []
  };
}

async function loadState() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const existing = JSON.parse(await fs.readFile(dataPath, "utf8"));
    let migrated = false;
    existing.workItems = existing.workItems.map((item) => {
      let next = item;
      if (item.type === "Feature" && featurePlans[item.id] && (!item.scopeStatus || !item.targetDate)) {
        migrated = true;
        next = { ...next, ...featurePlans[item.id] };
      }
      if (!next.phase) {
        migrated = true;
        next = { ...next, phase: next.id?.includes("CROSS") ? "Phase 3" : "Phase 2" };
      }
      if ((next.type === "Feature" || next.type === "User Story") && !next.moscow) {
        migrated = true;
        next = { ...next, moscow: moscowFromPriority(next.priority) };
      }
      return next;
    });
    const unplannedIds = new Set(existing.workItems.map((item) => item.id));
    const missingUnplanned = unplannedScopeItems(now()).filter((item) => !unplannedIds.has(item.id));
    if (missingUnplanned.length) {
      existing.workItems.push(...missingUnplanned);
      migrated = true;
    }
    existing.tests = (existing.tests || []).map((test) => {
      const next = {
        preconditions: "",
        steps: [],
        expectedResult: test.title,
        sprint: "Backlog",
        tags: [],
        ...test,
      };
      if (!Object.hasOwn(test, "preconditions")) migrated = true;
      return next;
    });
    const atlasProject = existing.projects?.find((project) => project.id === "atlas-payroll");
    if (atlasProject?.phase === "BA / Requirements") {
      atlasProject.phase = "Phase 2 - Payroll Delivery";
      migrated = true;
    }
    if (!Array.isArray(existing.presentations) || existing.presentations.length === 0) {
      existing.presentations = [defaultSprintPresentation()];
      migrated = true;
    }
    if (!existing.users) {
      existing.users = [
        { id: "user-1", name: "Alex Dela Cruz", email: "alex.delacruz@example.com" },
        { id: "user-2", name: "Rhea Santos", email: "rhea.santos@example.com" },
        { id: "user-3", name: "Marco Reyes", email: "marco.reyes@example.com" },
        { id: "user-4", name: "Mika Reyes", email: "mika.reyes@example.com" },
        { id: "user-5", name: "BA Team", email: "ba.team@example.com" },
        { id: "user-6", name: "QA Team", email: "qa.team@example.com" },
        { id: "user-7", name: "Project Team", email: "project.team@example.com" },
        { id: "user-8", name: "Tech Lead", email: "tech.lead@example.com" }
      ];
      migrated = true;
    }
    if (!existing.emails) {
      existing.emails = [];
      migrated = true;
    }
    existing.projects = (existing.projects || []).map((proj) => {
      if (!proj.linkGroups) {
        proj.linkGroups = ["General", "Worksheets", "Presentations", "External Sites"];
        migrated = true;
      }
      if (!proj.links || proj.links.length < 3) {
        proj.links = [
          { id: "link-1", name: "Bug Inventory Summary", url: "https://docs.google.com/spreadsheets/d/10SCnCAbwqQB4Llix_gQllwygaCk5k-yWKv76_yxQi_k/edit", group: "Worksheets" },
          { id: "link-2", name: "Payroll Timeline Sheet", url: "https://docs.google.com/spreadsheets/d/1FopPinrWpPNFCJ3mfAVBHh2gZ-EB9VACgOqJwo8LNMQ/edit", group: "Worksheets" },
          { id: "link-3", name: "Client Kickoff Slides", url: "https://docs.google.com/presentation/d/1K-G0Z9y2PzS8x56wF7p7i4qQp37sN_sC-oD7j9l-8zE/edit", group: "Presentations" },
          { id: "link-4", name: "System Architecture Design", url: "https://mermaid.live/", group: "External Sites" }
        ];
        migrated = true;
      } else {
        let updatedLinks = false;
        proj.links = proj.links.map((link) => {
          if (!link.group) {
            let g = "General";
            if (link.id === "link-1" || link.id === "link-2") g = "Worksheets";
            else if (link.id === "link-3") g = "Presentations";
            else if (link.id === "link-4") g = "External Sites";
            updatedLinks = true;
            return { ...link, group: g };
          }
          return link;
        });
        if (updatedLinks) migrated = true;
      }
      return proj;
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

function sendEmailNotification(user, item, actionType) {
  const emailId = `email-${crypto.randomUUID().slice(0, 8)}`;
  const subject = `[Atlas Delivery Hub] Work Item Assigned: ${item.id}`;
  const bodyText = `Hello ${user.name},\n\nYou have been assigned a new item on the Atlas Delivery Hub website:\n\n` +
                   `Item: ${item.id} - ${item.title}\n` +
                   `Type: ${item.type}\n` +
                   `Status: ${item.status}\n` +
                   `Sprint: ${item.sprint || "Backlog"}\n\n` +
                   `You can view it here: http://localhost:4173/?item=${item.id}\n\n` +
                   `Best regards,\nAtlas Delivery Hub System`;
  
  const emailLog = {
    id: emailId,
    to: user.email,
    subject,
    body: bodyText,
    sentAt: now()
  };
  
  if (!state.emails) state.emails = [];
  state.emails.unshift(emailLog);
  state.emails = state.emails.slice(0, 50);
  
  console.log("========================================================================");
  console.log(`[EMAIL NOTIFICATION SENT]`);
  console.log(`To: ${user.email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${bodyText}`);
  console.log("========================================================================");
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
    const project = { id: `project-${crypto.randomUUID().slice(0, 8)}`, name: input.name?.trim(), description: input.description?.trim() || "", phase: input.phase || "Discovery", targetMilestone: input.targetMilestone || "Scope approval", targetDate: input.targetDate || "", links: input.links || [], createdAt: now() };
    if (!project.name) return json(response, 400, { error: "Project name is required." });
    state.projects.push(project);
    state.activeProjectId = project.id;
    activity(`Created project ${project.name}`, project.id);
    await saveState(state);
    return json(response, 201, project);
  }
  if (url.pathname === "/api/projects/active" && request.method === "PUT") {
    const input = await body(request);
    const nextActiveId = input.activeProjectId;
    if (!nextActiveId || !state.projects.some(p => p.id === nextActiveId)) {
      return json(response, 400, { error: "Invalid project ID." });
    }
    state.activeProjectId = nextActiveId;
    activity(`Switched active project workspace`, nextActiveId);
    await saveState(state);
    return json(response, 200, state);
  }
  const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && request.method === "PUT") {
    const id = decodeURIComponent(projectMatch[1]);
    const index = state.projects.findIndex((p) => p.id === id);
    if (index < 0) return json(response, 404, { error: "Project not found." });
    const input = await body(request);
    state.projects[index] = { ...state.projects[index], ...input, id };
    activity(`Updated project details for ${state.projects[index].name}`, id);
    await saveState(state);
    return json(response, 200, state.projects[index]);
  }
  const presentationMatch = url.pathname.match(/^\/api\/presentations\/([^/]+)$/);
  if (presentationMatch && request.method === "PUT") {
    const id = decodeURIComponent(presentationMatch[1]);
    const index = state.presentations.findIndex((presentation) => presentation.id === id);
    if (index < 0) return json(response, 404, { error: "Sprint presentation not found." });
    const input = await body(request);
    const allowed = ["sprintName", "dateRange", "audience", "headline", "sprintGoal", "executiveSummary", "highlights", "decisionsNeeded", "nextSprintGoals", "clientAsks", "presenterNotes", "confidence"];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(input, key)).map((key) => [key, input[key]]));
    state.presentations[index] = { ...state.presentations[index], ...updates, id, updatedAt: now() };
    activity(`Updated ${state.presentations[index].sprintName} client presentation`, id);
    await saveState(state);
    return json(response, 200, state.presentations[index]);
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
      moscow: input.moscow || ((input.type === "Feature" || input.type === "User Story") ? moscowFromPriority(input.priority || "Medium") : ""),
      phase: input.phase || "Phase 1",
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
    if (item.assignee && item.assignee !== "Unassigned") {
      const user = state.users?.find((u) => u.name === item.assignee);
      if (user && user.email) {
        sendEmailNotification(user, item, "assigned");
      }
    }
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
    const oldAssignee = state.workItems[index].assignee;
    state.workItems[index] = { ...state.workItems[index], ...input, id, updatedAt: now() };
    const newAssignee = state.workItems[index].assignee;
    if (newAssignee && newAssignee !== oldAssignee && newAssignee !== "Unassigned") {
      const user = state.users?.find((u) => u.name === newAssignee);
      if (user && user.email) {
        sendEmailNotification(user, state.workItems[index], "assigned");
      }
    }
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
  if (url.pathname === "/api/tests/import" && request.method === "POST") {
    const input = await body(request);
    const rows = Array.isArray(input.rows) ? input.rows : [];
    const errors = [];
    let created = 0;
    let updated = 0;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] || {};
      const story = state.workItems.find((item) => item.id === row.storyId && item.type === "User Story");
      if (!row.storyId || !story) {
        errors.push({ row: rowIndex + 2, message: `User Story ID ${row.storyId || "is blank"} was not found.` });
        continue;
      }
      if (!row.title?.trim()) {
        errors.push({ row: rowIndex + 2, message: "Test Case Title is required." });
        continue;
      }
      const requestedId = row.id?.trim();
      const id = requestedId || `TC-IMPORT-${String(state.tests.length + created + 1).padStart(4, "0")}`;
      const existingIndex = state.tests.findIndex((test) => test.id === id);
      const testCase = {
        id,
        storyId: story.id,
        featureId: story.parentId,
        title: row.title.trim(),
        preconditions: row.preconditions?.trim() || "",
        steps: Array.isArray(row.steps) ? row.steps : String(row.steps || "").split(/\r?\n|\s*\|\s*/).map((step) => step.trim()).filter(Boolean),
        expectedResult: row.expectedResult?.trim() || "",
        priority: row.priority || story.priority || "Medium",
        status: row.status || "Not Run",
        assignee: row.assignee?.trim() || "QA Team",
        sprint: row.sprint?.trim() || story.sprint || "Backlog",
        tags: Array.isArray(row.tags) ? row.tags : String(row.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        updatedAt: now(),
      };
      if (existingIndex >= 0) {
        state.tests[existingIndex] = { ...state.tests[existingIndex], ...testCase };
        updated += 1;
      } else {
        state.tests.push(testCase);
        created += 1;
      }
    }
    if (created || updated) {
      activity(`Imported ${created} and updated ${updated} Excel test cases`, "QA-IMPORT");
      await saveState(state);
    }
    return json(response, 200, { created, updated, errors, tests: state.tests });
  }
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
    const headers = ["ID", "Type", "Parent", "Title", "Status", "Phase", "MoSCoW", "Priority", "Assignee", "Sprint", "Dependencies", "Story Points", "Progress"];
    const lines = [headers, ...state.workItems.map((item) => [item.id, item.type, item.parentId, item.title, item.status, item.phase, item.moscow, item.priority, item.assignee, item.sprint, (item.dependencies || []).join(" | "), item.storyPoints, item.progress])];
    response.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=atlas-work-items.csv" });
    return response.end(lines.map((line) => line.map(csvEscape).join(",")).join("\n"));
  }
  if (url.pathname === "/api/users" && request.method === "POST") {
    const input = await body(request);
    const name = input.name?.trim();
    const email = input.email?.trim();
    if (!name || !email) {
      return json(response, 400, { error: "Name and email are required." });
    }
    if (state.users?.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      return json(response, 400, { error: "A user with this name already exists." });
    }
    const newUser = { id: `user-${crypto.randomUUID().slice(0, 8)}`, name, email };
    if (!state.users) state.users = [];
    state.users.push(newUser);
    activity(`Created user ${name}`, newUser.id);
    await saveState(state);
    return json(response, 201, newUser);
  }
  const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch && request.method === "DELETE") {
    const id = decodeURIComponent(userMatch[1]);
    const index = state.users?.findIndex((u) => u.id === id) ?? -1;
    if (index < 0) return json(response, 404, { error: "User not found." });
    const userName = state.users[index].name;
    state.users.splice(index, 1);
    activity(`Deleted user ${userName}`, id);
    await saveState(state);
    return json(response, 200, { deleted: true });
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

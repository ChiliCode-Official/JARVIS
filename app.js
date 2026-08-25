const STORAGE_KEY = "quest-log-uvm-state-v2";
const platformLinks = [
  ["blackboard", "Blackboard", "https://uvmonline.blackboard.com/ultra/course", "Revisar tareas, anuncios y fechas"],
  ["teams", "Microsoft Teams", "https://teams.microsoft.com/v2/", "Ver anuncios y actividades"],
  ["cisco", "Cisco Academy", "https://www.netacad.com/courses/it-support-essentials?courseLang=es-XL", "Continuar certificación"],
  ["cambridge", "Cambridge One", "https://www.cambridgeone.org/dashboard/learner/dashboard", "Continuar inglés"],
  ["todo", "Microsoft To Do", "https://to-do.office.com/tasks/important", "Abrir pendientes"]
];
const demoState = { xp: 0, streak: 1, quests: [
  { id: "bb-01", title: "Revisar anuncios y fechas de Blackboard", subject: "Gestión académica", platform: "blackboard", due: "Hoy", url: platformLinks[0][2], xp: 20, status: "pending" },
  { id: "cisco-01", title: "Completar módulo 1 de IT Support Essentials", subject: "Cisco Academy", platform: "cisco", due: "2026-08-28", url: platformLinks[2][2], xp: 60, status: "pending" },
  { id: "cam-01", title: "Completar unidad 2 de Cambridge One", subject: "Inglés", platform: "cambridge", due: "2026-08-30", url: platformLinks[3][2], xp: 40, status: "pending" }
]};
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || structuredClone(demoState);
const $ = (selector) => document.querySelector(selector);
const esc = (value = "") => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
const platformName = (id) => platformLinks.find(link => link[0] === id)?.[1] || id;
function levelFromXp(xp) { return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1); }
function formatDue(value) { if (!value || value === "Hoy") return value || "Sin fecha"; const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function renderLinks() { $("#quickLinks").innerHTML = platformLinks.map(([id, name, url, hint]) => `<a class="link-card ${id}" href="${url}" target="_blank" rel="noopener"><span class="link-icon">↗</span><span><strong>${name}</strong><small>${hint}</small></span></a>`).join(""); }
function render() {
  const level = levelFromXp(state.xp), currentStart = Math.max(0, (level - 1) ** 2 * 100), nextStart = level ** 2 * 100;
  const progress = Math.min(100, ((state.xp - currentStart) / Math.max(1, nextStart - currentStart)) * 100), pending = state.quests.filter(q => q.status !== "completed");
  $("#levelValue").textContent = level; $("#xpValue").textContent = state.xp; $("#xpBar").style.width = `${progress}%`; $("#xpNext").textContent = `${state.xp - currentStart} / ${nextStart - currentStart} XP para nivel ${level + 1}`; $("#streakValue").textContent = `${state.streak} día${state.streak === 1 ? "" : "s"}`; $("#hpValue").textContent = Math.max(0, 100 - state.quests.filter(q => q.status === "overdue").length * 10); $("#questCount").textContent = `${pending.length} pendientes`;
  $("#briefingCount").textContent = `${pending.length} pendiente${pending.length === 1 ? "" : "s"} detectado${pending.length === 1 ? "" : "s"}`;
  const focusQuest = pending[0];
  $("#jarvisTitle").textContent = focusQuest ? `Siguiente objetivo: ${focusQuest.title}` : "Inventario despejado, comandante.";
  $("#jarvisMessage").textContent = focusQuest ? `Materia: ${focusQuest.subject}. Abre la plataforma y completa el siguiente bloque.` : "Puedes capturar una nueva misión o revisar tus plataformas.";
  $("#questList").innerHTML = state.quests.length ? state.quests.map(q => `<article class="quest-card ${q.status === "completed" ? "done" : ""}"><div class="quest-top"><span class="tag ${esc(q.platform)}">${esc(platformName(q.platform))}</span><strong>+${q.xp} XP</strong></div><h3>${esc(q.title)}</h3><p class="quest-meta">${esc(q.subject)}<br>Fecha: ${esc(formatDue(q.due))}</p><div class="quest-bottom"><a class="open-link" href="${esc(q.url || "#")}" target="_blank" rel="noopener">Abrir plataforma ↗</a><button class="complete-button" data-id="${esc(q.id)}" ${q.status === "completed" ? "disabled" : ""}>${q.status === "completed" ? "Lista" : "Completar"}</button></div></article>`).join("") : `<div class="empty-state"><strong>No hay misiones.</strong><span>Añade una manualmente o abre una plataforma para revisar pendientes.</span></div>`;
  const subjects = [...new Set(state.quests.map(q => q.subject))]; $("#subjectStats").innerHTML = subjects.map(subject => { const qs = state.quests.filter(q => q.subject === subject), done = qs.filter(q => q.status === "completed").length; return `<article class="stat-card"><strong>${done}/${qs.length}</strong><span>${esc(subject)}</span></article>`; }).join("");
  document.querySelectorAll(".complete-button").forEach(button => button.addEventListener("click", () => { const quest = state.quests.find(q => q.id === button.dataset.id); if (!quest || quest.status === "completed") return; quest.status = "completed"; state.xp += quest.xp; save(); render(); }));
}
function openTaskPanel() { $("#taskPanel").hidden = false; $("#taskPanel").scrollIntoView({ behavior: "smooth", block: "center" }); $("input[name=title]").focus(); }
$("#addTaskTop").addEventListener("click", openTaskPanel); $("#closeTask").addEventListener("click", () => { $("#taskPanel").hidden = true; });
$("#focusButton").addEventListener("click", () => { const first = document.querySelector(".quest-card:not(.done) .open-link"); if (first) first.click(); else openTaskPanel(); });
$("#taskForm").addEventListener("submit", event => { event.preventDefault(); const data = new FormData(event.currentTarget), title = data.get("title").trim(); const quest = { id: `custom-${Date.now()}`, title, subject: data.get("subject").trim(), platform: data.get("platform"), due: data.get("due") || "Sin fecha", url: data.get("url").trim() || platformLinks.find(link => link[0] === data.get("platform"))?.[2] || "#", xp: 25, status: "pending" }; state.quests.unshift(quest); save(); event.currentTarget.reset(); $("#taskPanel").hidden = true; render(); });
$("#resetButton").addEventListener("click", () => { localStorage.removeItem(STORAGE_KEY); location.reload(); });
renderLinks(); render();

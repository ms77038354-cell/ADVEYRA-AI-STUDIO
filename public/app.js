const $ = (id) => document.getElementById(id);
let chat = [];
let activeFile = null;
let currentFiles = [];
let diagnosticsOpen = false;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function addBubble(role, content) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = content;
  $("chatMessages").appendChild(div);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
}
async function refreshFiles() {
  const data = await api("/api/files");
  currentFiles = data.files || [];
  const list = $("fileList");
  list.innerHTML = "";
  if (!currentFiles.length) {
    list.innerHTML = '<p class="muted tiny">No project files yet. Ask the agent to create a website or app.</p>';
    return;
  }
  currentFiles.filter(x => x.type === "file").forEach(file => {
    const btn = document.createElement("button");
    btn.className = "file-item" + (activeFile === file.path ? " active" : "");
    btn.textContent = (file.type === "directory" ? "▰  " : "▤  ") + file.path;
    btn.onclick = () => openFile(file.path);
    list.appendChild(btn);
  });
}
async function openFile(filePath) {
  const data = await api(`/api/file?path=${encodeURIComponent(filePath)}`);
  activeFile = data.path;
  $("currentFile").textContent = data.path;
  $("editor").value = data.content;
  $("saveFile").disabled = false;
  $("renameFile").disabled = false;
  $("deleteFile").disabled = false;
  await refreshFiles();
}
async function checkSession() {
  const data = await api("/api/session");
  $("login").classList.toggle("hidden", data.authenticated);
  $("app").classList.toggle("hidden", !data.authenticated);
  if (data.authenticated) {
    $("status").textContent = "Signed in · Gemini API is server-configured";
    await refreshFiles();
  }
}
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginError").textContent = "";
  try {
    await api("/api/login", { method: "POST", body: JSON.stringify({ username: $("username").value, password: $("password").value }) });
    await checkSession();
  } catch (err) { $("loginError").textContent = err.message; }
});
$("logoutBtn").onclick = async () => { await api("/api/logout", { method: "POST" }); location.reload(); };
$("refreshFiles").onclick = () => refreshFiles().catch(e => alert(e.message));
$("saveFile").onclick = async () => {
  try {
    await api("/api/file", { method: "POST", body: JSON.stringify({ path: activeFile, content: $("editor").value }) });
    $("status").textContent = `Saved ${activeFile}`;
    await refreshFiles();
  } catch (e) { alert(e.message); }
};
$("newFileBtn").onclick = async () => {
  const filePath = prompt("New file path (example: index.html):");
  if (!filePath) return;
  try { await api("/api/file", { method: "POST", body: JSON.stringify({ path: filePath, content: "" }) }); await refreshFiles(); await openFile(filePath); }
  catch (e) { alert(e.message); }
};
$("newFolderBtn").onclick = async () => {
  const folderPath = prompt("New folder path (example: src/components):");
  if (!folderPath) return;
  try { await api("/api/folder", { method: "POST", body: JSON.stringify({ path: folderPath }) }); await refreshFiles(); }
  catch (e) { alert(e.message); }
};
$("renameFile").onclick = async () => {
  if (!activeFile) return;
  const next = prompt("Rename file to (relative path):", activeFile);
  if (!next || next === activeFile) return;
  try { await api("/api/rename", { method: "POST", body: JSON.stringify({ from: activeFile, to: next }) }); activeFile = next; await refreshFiles(); await openFile(next); }
  catch (e) { alert(e.message); }
};
$("deleteFile").onclick = async () => {
  if (!activeFile || !confirm(`Delete ${activeFile}? A backup copy will be kept on the server.`)) return;
  try { await api("/api/file", { method: "DELETE", body: JSON.stringify({ path: activeFile }) }); activeFile = null; $("currentFile").textContent = "Select a file"; $("editor").value = ""; $("saveFile").disabled = true; $("renameFile").disabled = true; $("deleteFile").disabled = true; await refreshFiles(); }
  catch (e) { alert(e.message); }
};
$("diagnosticsBtn").onclick = async () => {
  try {
    const data = await api("/api/diagnostics");
    const report = data.checks.map(c => `${c.ok ? "✓" : "✕"} ${c.name}: ${c.detail}`).join("\n");
    alert(`ADVEYRA diagnostics\nModel: ${data.model}\n\n${report}`);
  } catch (e) { alert(e.message); }
};
$("exportBtn").onclick = () => { location.href = "/api/export"; };

$("chatForm").addEventListener("submit", async e => {
  e.preventDefault();
  const text = $("prompt").value.trim();
  if (!text) return;
  $("prompt").value = "";
  chat.push({ role: "user", content: text });
  addBubble("user", text);
  $("sendBtn").disabled = true;
  $("sendBtn").textContent = "Working…";
  try {
    const data = await api("/api/chat", { method: "POST", body: JSON.stringify({ messages: chat }) });
    chat.push({ role: "assistant", content: data.reply });
    addBubble("assistant", data.reply);
    await refreshFiles();
  } catch (err) {
    addBubble("assistant", "Error: " + err.message);
  } finally {
    $("sendBtn").disabled = false;
    $("sendBtn").textContent = "Send ↗";
  }
});
$("previewBtn").onclick = async () => {
  if (!activeFile || !activeFile.toLowerCase().endsWith(".html")) {
    alert("Select an .html file first.");
    return;
  }
  $("preview").srcdoc = $("editor").value;
};
$("pushBtn").onclick = async () => {
  if (!confirm("Push the current workspace files to the configured GitHub repository?")) return;
  $("pushBtn").disabled = true;
  try {
    const data = await api("/api/github/push", { method: "POST", body: JSON.stringify({ message: "Update from ADVEYRA AI Studio" }) });
    alert("GitHub push successful: " + data.url);
  } catch (e) { alert(e.message); }
  finally { $("pushBtn").disabled = false; }
};
checkSession().catch(() => {});

// src/liveTracePage.ts
import { escapeHtml } from "./utils";

export function renderLiveTracePage(initialTopic: string): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LangGraph Live Trace</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: #121933;
      --muted: #8fa0c7;
      --text: #eef3ff;
      --line: #2b3765;
      --ok: #2ecc71;
      --run: #4da3ff;
      --done: #b38cff;
      --err: #ff6b6b;
      --warn: #ffc857;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    .wrap {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { color: var(--muted); margin: 0 0 20px; }
    .row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      margin-bottom: 20px;
    }
    input, button {
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      padding: 12px 14px;
      font: inherit;
    }
    button {
      cursor: pointer;
      font-weight: 600;
    }
    button:hover { filter: brightness(1.08); }
    .grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 18px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
    }
    .steps {
      display: grid;
      gap: 12px;
    }
    .step {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      opacity: 0.55;
      transition: 160ms ease;
    }
    .step.active {
      opacity: 1;
      border-color: var(--run);
      box-shadow: 0 0 0 1px rgba(77,163,255,.25) inset;
    }
    .step.done {
      opacity: 1;
      border-color: var(--ok);
    }
    .step-title {
      font-weight: 700;
      margin-bottom: 6px;
    }
    .status {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .log {
      height: 540px;
      overflow: auto;
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      line-height: 1.5;
      background: #0a0f1f;
      border-radius: 14px;
      padding: 14px;
      border: 1px solid var(--line);
    }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .b-info { background: rgba(77,163,255,.14); color: #9ec8ff; }
    .b-ok { background: rgba(46,204,113,.14); color: #9ef0bf; }
    .b-warn { background: rgba(255,200,87,.14); color: #ffe19a; }
    .b-err { background: rgba(255,107,107,.14); color: #ffb3b3; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>LangGraph live trace</h1>
    <p>Watch each node run and inspect state updates as they arrive.</p>

    <div class="row">
      <input id="topic" value="${escapeHtml(initialTopic)}" />
      <button id="run">Run trace</button>
      <button id="stop">Stop</button>
    </div>

    <div class="grid">
      <div class="card">
        <div class="badge b-info" id="summary">Idle</div>
        <div class="steps">
          <div class="step" id="step-generateBaseJoke">
            <div class="step-title">generateBaseJoke</div>
            <div class="status" id="status-generateBaseJoke">waiting</div>
          </div>
          <div class="step" id="step-generateRelatedJokes">
            <div class="step-title">generateRelatedJokes</div>
            <div class="status" id="status-generateRelatedJokes">waiting</div>
          </div>
          <div class="step" id="step-saveRelatedJokesToDb">
            <div class="step-title">saveRelatedJokesToDb</div>
            <div class="status" id="status-saveRelatedJokesToDb">waiting</div>
          </div>
          <div class="step" id="step-skipRelatedJokesPersistence">
            <div class="step-title">skipRelatedJokesPersistence</div>
            <div class="status" id="status-skipRelatedJokesPersistence">waiting</div>
          </div>
          <div class="step" id="step-pickBestJoke">
            <div class="step-title">pickBestJoke</div>
            <div class="status" id="status-pickBestJoke">waiting</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="log" id="log"></div>
      </div>
    </div>
  </div>

  <script>
    const log = document.getElementById("log");
    const topicInput = document.getElementById("topic");
    const summary = document.getElementById("summary");
    const runBtn = document.getElementById("run");
    const stopBtn = document.getElementById("stop");

    const nodeIds = [
      "generateBaseJoke",
      "generateRelatedJokes",
      "saveRelatedJokesToDb",
      "skipRelatedJokesPersistence",
      "pickBestJoke"
    ];

    let currentSource = null;

    function appendLog(value) {
      log.textContent += value + "\\n";
      log.scrollTop = log.scrollHeight;
    }

    function resetUi() {
      log.textContent = "";
      summary.textContent = "Running";
      summary.className = "badge b-info";
      for (const id of nodeIds) {
        document.getElementById("step-" + id).className = "step";
        document.getElementById("status-" + id).textContent = "waiting";
      }
    }

    function setNodeRunning(id) {
      for (const nodeId of nodeIds) {
        const step = document.getElementById("step-" + nodeId);
        if (!step.classList.contains("done")) {
          step.classList.remove("active");
        }
      }
      const step = document.getElementById("step-" + id);
      const status = document.getElementById("status-" + id);
      if (step) step.classList.add("active");
      if (status) status.textContent = "running";
    }

    function setNodeDone(id) {
      const step = document.getElementById("step-" + id);
      const status = document.getElementById("status-" + id);
      if (step) {
        step.classList.remove("active");
        step.classList.add("done");
      }
      if (status) status.textContent = "done";
    }

    function stopCurrent() {
      if (currentSource) {
        currentSource.close();
        currentSource = null;
      }
    }

    function start() {
      stopCurrent();
      resetUi();

      const topic = topicInput.value.trim() || "programmers";
      const url = "/joke/live/stream?topic=" + encodeURIComponent(topic);
      const source = new EventSource(url);
      currentSource = source;

      source.addEventListener("start", (event) => {
        appendLog("=== RUN START ===");
        appendLog(event.data);
        appendLog("");
      });

      source.addEventListener("node", (event) => {
        const payload = JSON.parse(event.data);
        setNodeRunning(payload.node);
        appendLog(">> NODE: " + payload.node);
        appendLog(JSON.stringify(payload.update, null, 2));
        appendLog("");
      });

      source.addEventListener("state", (event) => {
        const payload = JSON.parse(event.data);
        appendLog(">> FULL STATE");
        appendLog(JSON.stringify(payload, null, 2));
        appendLog("");
      });

      source.addEventListener("node_done", (event) => {
        const payload = JSON.parse(event.data);
        setNodeDone(payload.node);
      });

      source.addEventListener("done", (event) => {
        summary.textContent = "Completed";
        summary.className = "badge b-ok";
        appendLog("=== RUN COMPLETE ===");
        appendLog(event.data);
        stopCurrent();
      });

      source.addEventListener("error_event", (event) => {
        summary.textContent = "Failed";
        summary.className = "badge b-err";
        appendLog("=== RUN ERROR ===");
        appendLog(event.data);
        stopCurrent();
      });

      source.onerror = () => {
        if (currentSource) {
          summary.textContent = "Connection closed";
          summary.className = "badge b-warn";
        }
      };
    }

    runBtn.addEventListener("click", start);
    stopBtn.addEventListener("click", () => {
      stopCurrent();
      summary.textContent = "Stopped";
      summary.className = "badge b-warn";
      appendLog("=== STOPPED ===");
    });
  </script>
</body>
</html>`;
}

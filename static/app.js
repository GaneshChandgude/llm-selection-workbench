const requestsInput = document.getElementById("requestsPerDay");
const inputTokens = document.getElementById("inputTokens");
const outputTokens = document.getElementById("outputTokens");
const iterationsInput = document.getElementById("iterations");

const selectionModel = document.getElementById("selectionModel");
const currentModel = document.getElementById("currentModel");
const newModel = document.getElementById("newModel");
const modelSelectionList = document.getElementById("modelSelectionList");
const modelConfigMessage = document.getElementById("modelConfigMessage");
const criticModel = document.getElementById("criticModel");
const routerPrompt = document.getElementById("routerPrompt");
const routerGolden = document.getElementById("routerGolden");
const routerPriority = document.getElementById("routerPriority");

const costTable = document.getElementById("costTable");
const selectionSummary = document.getElementById("selectionSummary");
const selectionTests = document.getElementById("selectionTests");
const benchmarkRankings = document.getElementById("benchmarkRankings");
const decisionResult = document.getElementById("decisionResult");
const canaryResult = document.getElementById("canaryResult");
const routerSummary = document.getElementById("routerSummary");
const routerResults = document.getElementById("routerResults");
const routerHistory = document.getElementById("routerHistory");

const costCanvas = document.getElementById("costChart");
const benchmarkCanvas = document.getElementById("benchmarkChart");

let models = [];
let selectedModelKeys = [];
let costChart;
let benchmarkChart;

const apiPost = async (path, payload) => {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return res.json();
};

const commonPayload = () => ({
  requests_per_day: Number(requestsInput.value),
  avg_input_tokens: Number(inputTokens.value),
  avg_output_tokens: Number(outputTokens.value),
});

const selectedOrFallback = () => (selectedModelKeys.length ? selectedModelKeys : models.map((m) => m.key));

function showModelMessage(message, ok = true) {
  modelConfigMessage.innerHTML = `<div class="card">${ok ? "✅" : "❌"} ${message}</div>`;
}

function renderModelSelection() {
  modelSelectionList.innerHTML = models
    .map((m) => `
      <label>
        <input type="checkbox" class="model-checkbox" value="${m.key}" ${selectedModelKeys.includes(m.key) ? "checked" : ""} />
        <span>${m.name} <small>(${m.provider})</small></span>
      </label>
    `)
    .join("");
}

function populateModelDropdowns() {
  const filtered = models.filter((m) => selectedModelKeys.includes(m.key));
  const fallback = filtered.length ? filtered : models;
  const opts = fallback.map((m) => `<option value="${m.key}">${m.name}</option>`).join("");
  selectionModel.innerHTML = opts;
  currentModel.innerHTML = opts;
  newModel.innerHTML = opts;
  criticModel.innerHTML = opts;
  if (fallback.length) {
    currentModel.value = fallback[0].key;
    newModel.value = fallback[Math.min(1, fallback.length - 1)].key;
    criticModel.value = fallback[0].key;
  }
}

function renderCost(results) {
  const rows = results
    .map((r) => `<tr><td>${r.model_name}</td><td>$${r.total_monthly}</td><td>${(r.quality_score * 100).toFixed(1)}%</td><td>${r.speed_ms}ms</td></tr>`)
    .join("");
  costTable.innerHTML = `<table class="table"><thead><tr><th>Model</th><th>Total Monthly</th><th>Quality</th><th>Latency</th></tr></thead><tbody>${rows}</tbody></table>`;
  if (costChart) costChart.destroy();
  costChart = new Chart(costCanvas, {
    type: "bar",
    data: { labels: results.map((r) => r.model_name), datasets: [{ label: "Monthly Cost", data: results.map((r) => r.total_monthly) }] },
  });
}

function renderSelection(result) {
  selectionSummary.innerHTML = `<div class="card"><strong>${result.model_name}</strong> <span class="badge">Score ${result.overall_score}</span> <span class="badge">Passed ${result.passed}/${result.total}</span></div>`;
  selectionTests.innerHTML = result.test_results.map((t) => `<div class="card">${t.scenario}: accuracy ${t.accuracy}, latency ${t.latency_ms}ms ${t.passed ? "✅" : "❌"}</div>`).join("");
}

function renderBenchmark(data) {
  const acc = data.rankings.by_accuracy;
  benchmarkRankings.innerHTML = `
    <div class="card"><strong>By Accuracy:</strong> ${acc.map((x) => `${x[0]} (${x[1].toFixed(3)})`).join(" • ")}</div>
    <div class="card"><strong>By Speed:</strong> ${data.rankings.by_speed.map((x) => `${x[0]} (${x[1]}ms)`).join(" • ")}</div>
    <div class="card"><strong>By Cost:</strong> ${data.rankings.by_cost.map((x) => `${x[0]} ($${x[1]}/1k)`).join(" • ")}</div>
  `;
  if (benchmarkChart) benchmarkChart.destroy();
  benchmarkChart = new Chart(benchmarkCanvas, {
    type: "line",
    data: { labels: acc.map((x) => x[0]), datasets: [{ label: "Avg accuracy", data: acc.map((x) => x[1]) }] },
    options: { scales: { y: { min: 0, max: 1 } } },
  });
}

function renderDecision(data) {
  if (data.recommended_model_name) {
    decisionResult.innerHTML = `<div class="card"><strong>${data.recommended_model_name}</strong><br/>Reason: ${data.reasoning}<br/>Monthly cost: $${data.monthly_cost}<br/>Savings vs budget: $${data.savings_vs_budget}</div>`;
  } else {
    decisionResult.innerHTML = `<div class="card"><strong>${data.recommendation}</strong><br/>${data.options.join(" • ")}</div>`;
  }
}

function renderCanary(data) {
  if (data.status === "completed") {
    canaryResult.innerHTML = `<div class="card">✅ Completed rollout to ${data.new_model_now_in_production}</div>` + data.phases_completed.map((p) => `<div class="card">${p.phase} (${p.traffic_percent}%): accuracy ${p.metrics.accuracy}, error ${p.metrics.error_rate}, latency ${p.metrics.latency_p99}ms</div>`).join("");
  } else {
    canaryResult.innerHTML = `<div class="card">❌ Rolled back at ${data.failed_at_phase}: ${data.reason}</div>`;
  }
}

async function loadModels() {
  const response = await (await fetch("/api/models")).json();
  models = response.models || [];
  selectedModelKeys = response.selected_models || models.map((m) => m.key);
  renderModelSelection();
  populateModelDropdowns();
}

async function saveModelSelection() {
  const checked = Array.from(document.querySelectorAll(".model-checkbox:checked")).map((e) => e.value);
  const res = await apiPost("/api/models/select", { selected_models: checked });
  selectedModelKeys = res.selected_models || checked;
  populateModelDropdowns();
  showModelMessage("Selected model list saved.");
}

async function addCustomModel() {
  const payload = {
    name: document.getElementById("customName").value,
    provider: document.getElementById("customProvider").value,
    input_cost_per_1k: Number(document.getElementById("customInputCost").value),
    output_cost_per_1k: Number(document.getElementById("customOutputCost").value),
    speed_ms: Number(document.getElementById("customLatency").value),
    quality_score: Number(document.getElementById("customQuality").value),
    hallucination_rate: Number(document.getElementById("customHallucination").value),
    context_window: Number(document.getElementById("customContext").value),
    best_for: document.getElementById("customBestFor").value,
    infrastructure_cost_monthly: Number(document.getElementById("customInfra").value),
    ops_cost_monthly: Number(document.getElementById("customOps").value),
  };

  if (!payload.name.trim()) {
    showModelMessage("Model name is required.", false);
    return;
  }

  const response = await apiPost("/api/models/custom", payload);
  if (response.error) {
    showModelMessage(response.error, false);
    return;
  }

  models = response.models || models;
  selectedModelKeys = response.selected_models || selectedModelKeys;
  renderModelSelection();
  populateModelDropdowns();
  showModelMessage(`Added custom model "${payload.name}" and saved it in persistence storage.`);
}

async function runCost() {
  renderCost((await apiPost("/api/cost", { ...commonPayload(), models: selectedOrFallback() })).results);
}
async function runSelection() { renderSelection(await apiPost("/api/select", { model: selectionModel.value })); }
async function runBenchmark() { renderBenchmark(await apiPost("/api/benchmark", { models: selectedOrFallback(), iterations: Number(iterationsInput.value || 3) })); }
async function runDecision() {
  renderDecision(
    await apiPost("/api/decision", {
      accuracy_requirement: Number(document.getElementById("accuracyReq").value),
      latency_requirement_ms: Number(document.getElementById("latencyReq").value),
      budget_per_month: Number(document.getElementById("budgetReq").value),
      use_case: document.getElementById("useCaseReq").value,
      requests_per_day: Number(requestsInput.value),
    }),
  );
}
async function runCanary() { renderCanary(await apiPost("/api/canary", { current_model: currentModel.value, new_model: newModel.value })); }


function renderRouter(data) {
  routerSummary.innerHTML = `<div class="card"><strong>Suggested model:</strong> ${data.suggested_best_model_name} <span class="badge">${data.suggested_best_model}</span> <span class="badge">Critic: ${data.critic_model}</span></div>
  <div class="card">Priority: ${data.priority} → Quality ${(data.priority_weights.quality * 100).toFixed(0)}% | Cost ${(data.priority_weights.cost * 100).toFixed(0)}% | Latency ${(data.priority_weights.latency * 100).toFixed(0)}%</div>`;

  routerResults.innerHTML = data.results
    .map((row) => `
      <div class="card">
        <strong>${row.model_name}</strong> <small>(${row.provider})</small>
        <div>Weighted score: <strong>${row.priority_scores.weighted}</strong> | Quality: ${row.judge.quality_score} | Cost fit: ${row.priority_scores.cost} | Latency fit: ${row.priority_scores.latency}</div>
        <div>Tokens → in: ${row.tokens.input}, out: ${row.tokens.output} | Estimated cost: $${row.cost.estimated} | Latency: ${row.latency_ms}ms</div>
        <div><strong>Output:</strong> ${row.output}</div>
      </div>
    `)
    .join("");
}

function renderRouterHistory(data) {
  const entries = data.entries || [];
  if (!entries.length) {
    routerHistory.innerHTML = '<div class="card">No saved evaluations yet. Run a router test to save one.</div>';
    return;
  }

  routerHistory.innerHTML = entries
    .map((entry) => `
      <div class="card">
        <div><strong>${entry.label}</strong> <small>${new Date(entry.created_at).toLocaleString()}</small></div>
        <div>Priority: ${entry.priority} | Last suggested model: ${entry.last_suggested_model_name || "-"}</div>
        <div>Prompt: ${entry.prompt}</div>
        <div>Golden output: ${entry.golden_output}</div>
        <button class="rerun-router-case" data-case-id="${entry.id}">Re-run Evaluation</button>
      </div>
    `)
    .join("");

  document.querySelectorAll(".rerun-router-case").forEach((button) => {
    button.addEventListener("click", async () => {
      const caseId = button.dataset.caseId;
      const result = await apiPost("/api/router/retest", {
        case_id: caseId,
        models: selectedOrFallback(),
        critic_model: criticModel.value,
      });
      if (result.error) {
        routerSummary.innerHTML = `<div class="card">❌ ${result.error}</div>`;
        return;
      }
      routerPrompt.value = result.prompt;
      routerGolden.value = result.golden_output;
      routerPriority.value = result.priority;
      renderRouter(result);
      await loadRouterHistory();
    });
  });
}

async function loadRouterHistory() {
  renderRouterHistory(await (await fetch("/api/router/history")).json());
}

async function runRouterLab() {
  const prompt = routerPrompt.value.trim();
  const golden = routerGolden.value.trim();
  if (!prompt || !golden) {
    routerSummary.innerHTML = '<div class="card">❌ Prompt and golden output are required.</div>';
    routerResults.innerHTML = '';
    return;
  }

  renderRouter(
    await apiPost("/api/router/test", {
      prompt,
      golden_output: golden,
      models: selectedOrFallback(),
      critic_model: criticModel.value,
      priority: routerPriority.value,
    }),
  );
  await loadRouterHistory();
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(btn.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });
}

document.getElementById("saveModelSelection").addEventListener("click", saveModelSelection);
document.getElementById("addCustomModel").addEventListener("click", addCustomModel);
document.getElementById("runCost").addEventListener("click", runCost);
document.getElementById("runSelection").addEventListener("click", runSelection);
document.getElementById("runBenchmark").addEventListener("click", runBenchmark);
document.getElementById("runDecision").addEventListener("click", runDecision);
document.getElementById("runCanary").addEventListener("click", runCanary);
document.getElementById("runRouterLab").addEventListener("click", runRouterLab);
document.getElementById("refreshRouterHistory").addEventListener("click", loadRouterHistory);

(async function init() {
  setupTabs();
  await loadModels();
  await runCost();
  await runSelection();
  await runBenchmark();
  await runDecision();
  await runCanary();
  await loadRouterHistory();
  routerPrompt.value = "Classify sentiment for: I am happy with this product.";
  routerGolden.value = "positive";
  await runRouterLab();
})();

const requestsInput = document.getElementById("requestsPerDay");
const inputTokens = document.getElementById("inputTokens");
const outputTokens = document.getElementById("outputTokens");
const iterationsInput = document.getElementById("iterations");

const selectionModel = document.getElementById("selectionModel");
const currentModel = document.getElementById("currentModel");
const newModel = document.getElementById("newModel");

const costTable = document.getElementById("costTable");
const selectionSummary = document.getElementById("selectionSummary");
const selectionTests = document.getElementById("selectionTests");
const benchmarkRankings = document.getElementById("benchmarkRankings");
const exampleOutput = document.getElementById("exampleOutput");
const decisionResult = document.getElementById("decisionResult");
const canaryResult = document.getElementById("canaryResult");
const ecommerceResult = document.getElementById("ecommerceResult");
const mistakesResult = document.getElementById("mistakesResult");
const triggersResult = document.getElementById("triggersResult");

const costCanvas = document.getElementById("costChart");
const benchmarkCanvas = document.getElementById("benchmarkChart");

let models = [];
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

function renderCost(results) {
  const rows = results.map((r) => `<tr><td>${r.model_name}</td><td>$${r.total_monthly}</td><td>${(r.quality_score * 100).toFixed(1)}%</td><td>${r.speed_ms}ms</td></tr>`).join("");
  costTable.innerHTML = `<table class="table"><thead><tr><th>Model</th><th>Total Monthly</th><th>Quality</th><th>Latency</th></tr></thead><tbody>${rows}</tbody></table>`;
  if (costChart) costChart.destroy();
  costChart = new Chart(costCanvas, { type: "bar", data: { labels: results.map((r) => r.model_name), datasets: [{ label: "Monthly Cost", data: results.map((r) => r.total_monthly) }] } });
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

function renderExample(data) {
  exampleOutput.innerHTML = `
    ${data.comparison.map((c) => `<div class="card"><strong>${c.model}</strong><br/>Accuracy: ${c.accuracy}<br/>Speed: ${c.speed}<br/>Consistency: ${c.consistency}<br/>Monthly cost: ${c.monthly_cost}</div>`).join("")}
    <div class="card"><strong>Recommendation: ${data.recommendation.model}</strong><ul>${data.recommendation.reasoning.map((r) => `<li>${r}</li>`).join("")}</ul></div>
  `;
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

function renderEcommerce(data) {
  const cost = data.cost_comparison;
  ecommerceResult.innerHTML = `<div class="card"><strong>Decision:</strong> ${data.decision.recommended_model_name || data.decision.recommendation}</div>
  <div class="card"><strong>Monthly savings:</strong> $${cost.monthly_savings} | <strong>Annual savings:</strong> $${cost.annual_savings}</div>`;
}


function renderMistakes(data) {
  mistakesResult.innerHTML = data.mistakes
    .map((m) => `<div class="card"><strong>${m.title}</strong><br/>${m.anti_pattern}<br/>${m.recommended}</div>`)
    .join("");
}

function renderTriggers(data) {
  triggersResult.innerHTML = Object.entries(data)
    .map(([key, value]) => `<div class="card"><strong>${key}</strong>: ${value}</div>`)
    .join("");
}

async function loadModels() {
  models = await (await fetch("/api/models")).json();
  const opts = models.map((m) => `<option value="${m.key}">${m.name}</option>`).join("");
  selectionModel.innerHTML = opts;
  currentModel.innerHTML = opts;
  newModel.innerHTML = opts;
  currentModel.value = "claude_opus";
  newModel.value = "claude_sonnet";
}

async function runCost() { renderCost((await apiPost("/api/cost", { ...commonPayload(), models: models.map((m) => m.key) })).results); }
async function runSelection() { renderSelection(await apiPost("/api/select", { model: selectionModel.value })); }
async function runBenchmark() { renderBenchmark(await apiPost("/api/benchmark", { models: models.map((m) => m.key), iterations: Number(iterationsInput.value || 3) })); }
async function loadExample() { renderExample(await (await fetch("/api/example-output")).json()); }
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
async function runEcommerce() { renderEcommerce(await (await fetch("/api/ecommerce-example")).json()); }
async function loadMistakes() { renderMistakes(await (await fetch("/api/mistakes")).json()); }
async function loadTriggers() { renderTriggers(await (await fetch("/api/reevaluation-triggers")).json()); }

document.getElementById("runCost").addEventListener("click", runCost);
document.getElementById("runSelection").addEventListener("click", runSelection);
document.getElementById("runBenchmark").addEventListener("click", runBenchmark);
document.getElementById("loadExample").addEventListener("click", loadExample);
document.getElementById("runDecision").addEventListener("click", runDecision);
document.getElementById("runCanary").addEventListener("click", runCanary);
document.getElementById("runEcommerce").addEventListener("click", runEcommerce);
document.getElementById("loadMistakes").addEventListener("click", loadMistakes);
document.getElementById("loadTriggers").addEventListener("click", loadTriggers);

(async function init() {
  await loadModels();
  await runCost();
  await runSelection();
  await runBenchmark();
  await loadExample();
  await runDecision();
  await runCanary();
  await runEcommerce();
  await loadMistakes();
  await loadTriggers();
})();

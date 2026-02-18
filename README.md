# LLM Selection Workbench

Interactive web workbench and API implementation of the **full 8-part model-selection workflow** from the blog outline, including cost analysis, selection scoring, benchmarking, decision matrix, canary rollout, real-world example, common mistakes, and re-evaluation triggers.

## What this project includes

1. **Total cost analysis**: API + hidden costs (hallucination correction, churn, infra/ops).
2. **Selection framework**: scenario-based model scoring.
3. **Benchmarking**: multi-run comparisons + rankings.
4. **Decision matrix**: choose model from explicit constraints.
5. **Canary deployment simulation**: progressive rollout with quality gates and rollback.
6. **E-commerce example**: end-to-end recommendation + savings summary.
7. **Common mistakes guide**: anti-patterns and corrected practices.
8. **Re-evaluation triggers**: objective conditions to re-benchmark model choice.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open: `http://localhost:8000`

## Run on Windows (single command)

Use the included batch file to launch backend service(s) and open the UI automatically:

```bat
run_all_services_ui.bat
```

What it does:
- starts the primary backend/UI server (`python app.py`)
- starts `app_secondary.py` as a second backend service if that file exists
- opens the UI in your default browser (`http://localhost:8000`)

## UI walkthrough (what to click, input, and output)

The home page is split into 8 sections that map directly to the 8 workflow parts.

### Global inputs (top panel)

These values are shared by cost, benchmark, and decision workflows:

- **Requests / day** (`requestsPerDay`)
- **Avg input tokens** (`inputTokens`)
- **Avg output tokens** (`outputTokens`)
- **Benchmark iterations** (`iterations`)

### Part-by-part UI behavior

Utility panel:

- **Example Output**
  - Action: click **Load Example Output**
  - Output: formatted sample recommendation payload

Workflow panels:

1. **Part 1: Total Monthly Cost Breakdown**
   - Input: request volume + token settings (global panel)
   - Action: click **Run Cost Analysis**
   - Output: cost chart + table of monthly totals per model

2. **Part 2: Selection Framework**
   - Input: selected model from dropdown + built-in scenario set
   - Action: click **Evaluate Use Case**
   - Output: pass/fail style evaluation summary and scenario-level results

3. **Part 3: Benchmark Models**
   - Input: benchmark iterations + default scenario test set
   - Action: click **Run Benchmark**
   - Output: ranking + benchmark chart across models

4. **Part 4: Decision Matrix**
   - Input: accuracy, latency, budget, and use-case constraints
   - Action: click **Recommend Model**
   - Output: recommended model + explanation of tradeoffs

5. **Part 5: Canary Deployment**
   - Input: current model, new model, rollout target
   - Action: click **Simulate Progressive Rollout**
   - Output: staged rollout plan and simulated gate/rollback results

6. **Part 6: E-Commerce End-to-End Example**
   - Action: click **Run Real-World Example**
   - Output: complete recommendation + estimated savings summary

7. **Part 7: Common Mistakes to Avoid**
   - Action: click **Load Mistakes Guide**
   - Output: list of anti-patterns and corrected practices

8. **Part 8: Re-Evaluation Triggers**
   - Action: click **Load Re-Evaluation Triggers**
   - Output: trigger checklist indicating when to rerun evaluation/benchmarking

## API reference

### GET endpoints

- `GET /api/models` → available models and metadata
- `GET /api/scenarios` → default scenario list used by selection/benchmark
- `GET /api/example-output` → sample structured output
- `GET /api/ecommerce-example` → full end-to-end recommendation example
- `GET /api/mistakes` → common mistakes + fixes
- `GET /api/reevaluation-triggers` → re-evaluation trigger report

### POST endpoints

- `POST /api/cost`
  - Input JSON:
    ```json
    {
      "models": ["claude_opus", "claude_sonnet"],
      "requests_per_day": 100000,
      "avg_input_tokens": 500,
      "avg_output_tokens": 300
    }
    ```
  - Output JSON: `{ "results": [...] }` sorted by total monthly cost

- `POST /api/select`
  - Input JSON:
    ```json
    {
      "model": "claude_sonnet",
      "scenarios": []
    }
    ```
  - Output JSON: model-use-case evaluation summary + scenario outcomes

- `POST /api/benchmark`
  - Input JSON:
    ```json
    {
      "models": ["claude_opus", "claude_sonnet", "claude_haiku"],
      "test_cases": [],
      "iterations": 3
    }
    ```
  - Output JSON: benchmark metrics and model rankings

- `POST /api/decision`
  - Input JSON:
    ```json
    {
      "accuracy_requirement": 0.85,
      "latency_requirement_ms": 1000,
      "budget_per_month": 12000,
      "use_case": "customer_support",
      "requests_per_day": 100000
    }
    ```
  - Output JSON: recommended model decision and reasoning

- `POST /api/canary`
  - Input JSON:
    ```json
    {
      "current_model": "claude_opus",
      "new_model": "claude_sonnet",
      "final_traffic_percent": 100
    }
    ```
  - Output JSON: rollout stages, quality gates, and rollout result

## Run tests

```bash
python -m pytest -q
```

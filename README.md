# LLM Selection Workbench

A complete project implementing the full 8-part workflow from your model-selection blog outline.

## Implemented parts

1. **Total cost analysis**: API + hidden costs (hallucination correction, churn, infra/ops).
2. **Selection framework**: scenario-based model scoring.
3. **Benchmarking**: multi-run comparisons + rankings.
4. **Decision matrix**: choose model from explicit constraints.
5. **Canary deployment simulation**: progressive rollout with quality gates and rollback.
6. **E-commerce example**: end-to-end recommendation + savings summary.
7. **Common mistakes guide**: anti-patterns and corrected practices.
8. **Re-evaluation triggers**: objective conditions to re-benchmark model choice.

## API

- `GET /api/models`
- `GET /api/scenarios`
- `GET /api/example-output`
- `GET /api/ecommerce-example`
- `GET /api/mistakes`
- `GET /api/reevaluation-triggers`
- `POST /api/cost`
- `POST /api/select`
- `POST /api/benchmark`
- `POST /api/decision`
- `POST /api/canary`

## Run

```bash
python app.py
```

## Tests

```bash
python -m pytest -q
```

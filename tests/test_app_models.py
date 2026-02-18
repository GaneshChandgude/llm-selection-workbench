import json

import app


def test_refresh_model_services_includes_custom_model(tmp_path, monkeypatch):
    store = tmp_path / "user_models.json"
    store.write_text(
        json.dumps(
            {
                "custom_models": {
                    "acme_reasoner": {
                        "name": "Acme Reasoner",
                        "provider": "Acme",
                        "input_cost_per_1k": 0.001,
                        "output_cost_per_1k": 0.002,
                        "speed_ms": 123,
                        "quality_score": 0.91,
                        "hallucination_rate": 0.03,
                        "context_window": 64000,
                        "best_for": "internal support",
                    }
                },
                "selected_models": ["acme_reasoner"],
            }
        )
    )
    monkeypatch.setattr(app, "USER_MODELS_PATH", store)

    models, selected = app._refresh_model_services()

    assert "acme_reasoner" in models
    assert selected == ["acme_reasoner"]


def test_slugify_returns_safe_key():
    assert app._slugify(" My Fancy/Model ") == "my_fancy_model"


def test_refresh_updates_routing_judge_models(tmp_path, monkeypatch):
    store = tmp_path / "user_models.json"
    store.write_text('{"custom_models": {"x_model": {"name": "X", "provider": "Acme"}}, "selected_models": ["x_model"]}')
    monkeypatch.setattr(app, "USER_MODELS_PATH", store)

    models, _ = app._refresh_model_services()

    assert "x_model" in app.ROUTING_JUDGE.models
    assert app.ROUTING_JUDGE.models["x_model"].name == models["x_model"].name

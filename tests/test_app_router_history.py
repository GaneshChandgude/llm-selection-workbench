import app


def test_append_router_case_persists_and_can_be_found(tmp_path):
    original_path = app.ROUTER_HISTORY_PATH
    app.ROUTER_HISTORY_PATH = tmp_path / "router_history.json"
    try:
        app._append_router_case(
            prompt="Summarize this contract",
            golden_output="A concise legal summary",
            priority="balanced",
            critic_model="claude_sonnet",
            result={"suggested_best_model_name": "Claude Sonnet 4.5"},
        )

        payload = app._load_router_history()
        assert len(payload["entries"]) == 1
        saved = payload["entries"][0]
        assert saved["prompt"] == "Summarize this contract"
        assert saved["golden_output"] == "A concise legal summary"

        found = app._find_router_case(saved["id"])
        assert found is not None
        assert found["id"] == saved["id"]
    finally:
        app.ROUTER_HISTORY_PATH = original_path

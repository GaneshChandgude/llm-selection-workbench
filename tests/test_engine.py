from engine import (
    CanaryDeployment,
    DEFAULT_MODELS,
    DecisionMatrix,
    ModelBenchmark,
    ModelCostBreakdown,
    ModelSelectionFramework,
    generate_example_output,
    run_ecommerce_example,
    CommonMistakesGuide,
    ModelReevaluationTriggers,
)


def test_cost_breakdown_includes_hidden_costs():
    result = ModelCostBreakdown(DEFAULT_MODELS).calculate_monthly_cost("claude_haiku", requests_per_day=10000)
    assert result["error_correction"] > 0
    assert result["total_monthly"] >= result["api_cost"]


def test_selection_framework_returns_per_scenario_results():
    scenarios = [{"name": "basic", "input": "approve refund", "expected": "approve if policy allows", "pass_criteria": {"min_accuracy": 0.1}}]
    result = ModelSelectionFramework(DEFAULT_MODELS).evaluate_model_for_use_case("claude_sonnet", scenarios)
    assert result["total"] == 1
    assert "overall_score" in result


def test_benchmark_produces_rankings():
    out = ModelBenchmark(DEFAULT_MODELS).run_benchmark(["claude_opus", "claude_sonnet"], [{"name": "t1", "input": "hello", "expected": "hello"}], iterations=2)
    assert len(out["rankings"]["by_accuracy"]) == 2


def test_decision_matrix_recommends_sonnet_for_sample_constraints():
    result = DecisionMatrix(DEFAULT_MODELS).recommend_model(0.85, 1000, 12000, "customer_support", requests_per_day=100000)
    assert result["recommended_model"] == "claude_sonnet"


def test_canary_rollout_completes_for_opus_to_sonnet():
    result = CanaryDeployment(DEFAULT_MODELS).progressive_rollout("claude_opus", "claude_sonnet")
    assert result["status"] == "completed"


def test_example_and_ecommerce_helpers_return_expected_shapes():
    sample = generate_example_output()
    ecommerce = run_ecommerce_example()
    assert "comparison" in sample and "recommendation" in sample
    assert "cost_comparison" in ecommerce and "decision" in ecommerce


def test_common_mistakes_and_triggers_have_expected_entries():
    mistakes = CommonMistakesGuide().list_mistakes()
    triggers = ModelReevaluationTriggers().check_if_reevaluation_needed()
    assert len(mistakes["mistakes"]) == 5
    assert len(triggers) == 6

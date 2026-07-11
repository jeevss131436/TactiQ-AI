"""Single structured call to Claude that reasons over already-computed
match stats like a professional football analyst. Deliberately not a
multi-agent setup — one prompt, one forced tool call, one schema.

Model note: the spec named claude-3-5-sonnet, which has since been
retired. This uses claude-sonnet-5, the current Sonnet-tier model.
"""

from __future__ import annotations

import os

import anthropic

MODEL = "claude-sonnet-5"

SYSTEM_PROMPT = """\
You are a professional football (soccer) tactical analyst. You are given \
already-computed match statistics (possession, xG, shots, touches, \
zone-based passing, pressing success) for both teams in a single match — \
never raw event-by-event data. Reason over these numbers the way an \
analyst would brief a coaching staff: identify real patterns the stats \
imply, not generic commentary. Every claim must be traceable to a number \
you were given. Do not invent statistics, player details, or moments that \
aren't supported by the provided data."""

# Forces Claude's response into this exact JSON shape via tool use — no
# free-text parsing required on our side.
ANALYSIS_TOOL = {
    "name": "provide_tactical_analysis",
    "description": (
        "Submit the structured tactical analysis for this match, reasoned "
        "over the provided aggregated stats."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "A few sentences on how the match unfolded tactically.",
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": "What each team did well, grounded in the given stats.",
            },
            "weaknesses": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Where each team fell short, grounded in the given stats.",
            },
            "turning_points": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Moments the stats suggest shifted the match.",
            },
            "mvp": {
                "type": "string",
                "description": "The team judged most influential based on the stats (open data here is team-level, not player-level).",
            },
            "man_of_the_match_reasoning": {
                "type": "string",
                "description": "Two sentences justifying the MVP pick using specific numbers.",
            },
            "match_storyline_headline": {
                "type": "string",
                "description": "A single punchy, newspaper-style headline for this match.",
            },
            "key_stat_callouts": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Short, specific stat-driven observations worth surfacing in the UI.",
            },
        },
        "required": [
            "summary",
            "strengths",
            "weaknesses",
            "turning_points",
            "mvp",
            "man_of_the_match_reasoning",
            "match_storyline_headline",
            "key_stat_callouts",
        ],
        "additionalProperties": False,
    },
    "strict": True,
}


def _client() -> anthropic.Anthropic:
    # anthropic.Anthropic() already reads ANTHROPIC_API_KEY from the
    # environment; this just gives a clearer error if it's missing.
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY is not set — copy backend/.env.example to .env")
    return anthropic.Anthropic()


def _build_prompt(match: dict, team_stats: dict[str, dict]) -> str:
    home = match["home_team"]["team_name"]
    away = match["away_team"]["team_name"]
    return f"""\
Match: {home} {match['home_score']} - {match['away_score']} {away}
Competition stage: {match['competition_stage']}
Date: {match['match_date']}

Computed stats:
{home}: {team_stats.get(home, {})}
{away}: {team_stats.get(away, {})}

Analyze this match using only the stats above."""


def generate_tactical_analysis(match: dict, team_stats: dict[str, dict]) -> dict:
    """Calls Claude once, forced to respond via the provide_tactical_analysis
    tool, and returns its validated input dict directly as the analysis.
    """
    client = _client()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            tools=[ANALYSIS_TOOL],
            tool_choice={"type": "tool", "name": "provide_tactical_analysis"},
            messages=[{"role": "user", "content": _build_prompt(match, team_stats)}],
        )
    except anthropic.AuthenticationError as exc:
        raise RuntimeError(
            "Claude API rejected the request — check ANTHROPIC_API_KEY in backend/.env"
        ) from exc
    except anthropic.APIStatusError as exc:
        raise RuntimeError(f"Claude API error ({exc.status_code}): {exc.message}") from exc
    except anthropic.APIConnectionError as exc:
        raise RuntimeError(f"Could not reach the Claude API: {exc}") from exc

    for block in response.content:
        if block.type == "tool_use" and block.name == "provide_tactical_analysis":
            return block.input

    raise RuntimeError("Claude did not return the expected tool call")

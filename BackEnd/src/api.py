from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.analyze import run_regression
from src.supabase_client import supabase
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/regression")
def get_regression(user_id: str = ""):
    if not user_id:
        return {
            "r2": 0.25,
            "coefficients": {
                "Tackles": -0.34,
                "Progressive Passes": -0.28,
                "Interceptions": -0.23
            }
        }

    user = supabase.table("users").select("team_id").eq("id", user_id).single().execute()
    if not user.data:
        return {"error": "User not found"}

    team_id = user.data["team_id"]
    players = supabase.table("players").select("id").eq("team_id", team_id).execute()
    player_ids = [p["id"] for p in players.data]

    if not player_ids:
        return {"error": "No players for this team"}

    result = supabase.table("player_match_stats").select("*").in_("player_id", player_ids).execute()
    df = pd.DataFrame(result.data)

    if df.empty:
        return {"error": "No data found"}

    y_column = "goals_conceded"
    exclude_cols = [y_column, "player_id", "date", "id", "team_id"]
    x_columns = [col for col in df.columns if col not in exclude_cols]
    df[x_columns + [y_column]] = df[x_columns + [y_column]].apply(pd.to_numeric, errors="coerce").fillna(0)

    coefs, r2, mspr = run_regression(df, x_columns, y_column)
    return {
        "r2": r2,
        "mspr": mspr,
        "coefficients": coefs.to_dict()
    }

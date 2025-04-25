# src/api.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analyze import run_regression  # som returnerar koefficienter
from supabase_client import supabase
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # byt till din frontend-url sen
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/regression")
def get_regression():
    result = supabase.table("player_match_stats").select("*").execute()
    df = pd.DataFrame(result.data)
    if df.empty:
        return {"error": "No data found"}

    y_column = "goals_conceded"
    x_columns = [col for col in df.columns if col != y_column and col != "player_id" and col != "date"]
    df[x_columns + [y_column]] = df[x_columns + [y_column]].apply(pd.to_numeric, errors="coerce").fillna(0)
    
    coefs = run_regression(df, x_columns, y_column)
    return coefs.to_dict()

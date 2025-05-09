from supabase_client import supabase
from analyze import run_regression
import pandas as pd

def main():
    user_id = "4772002f-614f-4086-87e3-f76e583ff29f"
    team_id = supabase.table("users").select("team_id").eq("id", user_id).single().execute().data.get("team_id")

    players_res = supabase.table("players").select("id").eq("team_id", team_id).execute()
    player_ids = [p["id"] for p in players_res.data]
    result = supabase.table("player_match_stats").select("*").in_("player_id", player_ids).execute()
    df = pd.DataFrame(result.data)

    y_column = "goals_conceded"
    x_columns = [col for col in df.columns if col not in [y_column, "player_id", "date", "id"]]
    df[x_columns + [y_column]] = df[x_columns + [y_column]].apply(pd.to_numeric, errors='coerce').fillna(0)

    coefs, r2, mspr, ssr = run_regression(df, x_columns, y_column)

    print(f"\n🧠 R²: {r2:.3f}")
    print(f"📉 MSPR: {mspr:.4f}")
    print(f"📦 SSR (Sum of Squared Residuals): {ssr:.2f}")
    print("📈 Koef:")
    print(coefs[coefs != 0].sort_values(key=abs, ascending=False))

if __name__ == "__main__":
    main()

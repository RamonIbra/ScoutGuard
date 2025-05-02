from supabase_client import supabase
from analyze import run_regression
import pandas as pd

def main():
    print("🔍 Hämtar användarens team_id från Supabase...")

    user_id = "4772002f-614f-4086-87e3-f76e583ff29f"
    user_res = supabase.table("users").select("team_id").eq("id", user_id).single().execute()
    team_id = user_res.data.get("team_id")
    print(f"team_id: {team_id}")

    print("👥 Hämtar spelare i teamet...")
    players_res = supabase.table("players").select("id").eq("team_id", team_id).execute()
    player_ids = [p["id"] for p in players_res.data]

    if not player_ids:
        print("Inga spelare hittades för detta team.")
        return

    print("📦 Hämtar matchstatistik för lagets spelare...")
    result = supabase.table("player_match_stats").select("*").in_("player_id", player_ids).execute()
    df = pd.DataFrame(result.data)

    if df.empty:
        print("Ingen statistik hittades.")
        return

    y_column = "goals_conceded"
    x_columns = [col for col in df.columns if col not in [y_column, "player_id", "date", "id"]]

    missing = [col for col in x_columns + [y_column] if col not in df.columns]
    if missing:
        print(f"Saknade kolumner i datan: {missing}")
        return

    df[x_columns + [y_column]] = df[x_columns + [y_column]].apply(pd.to_numeric, errors='coerce').fillna(0)

    coefs, r2 = run_regression(df, x_columns, y_column)

    print("\n Modellens förklaringsgrad (R²):", round(r2, 3))
    print("📈 Regressionkoefficienter (Elastic Net):")
    print(coefs[coefs != 0].sort_values(key=abs, ascending=False))

if __name__ == "__main__":
    main()

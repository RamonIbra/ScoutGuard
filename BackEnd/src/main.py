from supabase_client import supabase
from analyze import run_regression
import pandas as pd

def main():
    print("Hämtar spelardata från Supabase...")

    result = supabase.table("player_match_stats").select("*").execute()
    df = pd.DataFrame(result.data)

    if df.empty:
        print("Ingen data hittades.")
        return

    print("📊 Kör regression på actions vs goals_conceded...")

    # Justerade kolumnnamn för att matcha Supabase/SQL
    y_column = "goals_conceded"
    x_columns = [col for col in df.columns if col != y_column and col != "player_id" and col != "date"]


    # Kontrollera att alla kolumner finns
    missing = [col for col in x_columns + [y_column] if col not in df.columns]
    if missing:
        print(f"Saknade kolumner i datan: {missing}")
        return

    # Konvertera till numeriska typer och ersätt NaN med 0
    df[x_columns + [y_column]] = df[x_columns + [y_column]].apply(pd.to_numeric, errors='coerce').fillna(0)

    # Kör regression
    coefficients = run_regression(df, x_columns, y_column)

    print("\n📈 Regressionkoefficienter (påverkan på goals_conceded):")
    print(coefficients)

if __name__ == "__main__":
    main()

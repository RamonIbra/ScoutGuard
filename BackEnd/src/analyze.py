import pandas as pd
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import statsmodels.api as sm

def run_regression(df: pd.DataFrame, x_cols: list[str], y_col: str, alpha=1, l1_ratio=0.1):
    X = df[x_cols]
    y = df[y_col]

    # Standardisera för train/test split
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/test split för att beräkna MSPR
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    model_test = ElasticNet(alpha=alpha, l1_ratio=l1_ratio)
    model_test.fit(X_train, y_train)

    y_pred_train = model_test.predict(X_train)
    y_pred_test = model_test.predict(X_test)

    r2 = r2_score(y_train, y_pred_train)
    mspr = mean_squared_error(y_test, y_pred_test)

    # Träna ny modell på hela datan för koefficienterna
    model_all = ElasticNet(alpha=alpha, l1_ratio=l1_ratio)
    model_all.fit(X_scaled, y)
    coefficients = pd.Series(model_all.coef_, index=x_cols)

    # Beräkna Cook’s Distance med OLS för hela datan
    X_ols = sm.add_constant(X_scaled)
    ols_model = sm.OLS(y, X_ols).fit()
    influence = ols_model.get_influence()
    cooks_d = influence.cooks_distance[0]

    # Topp 5 mest inflytelserika observationer
    cooks_series = pd.Series(cooks_d, index=df.index)
    top_outliers = cooks_series.sort_values(ascending=False).head(5)

    print("\n Topp 5 observationer med högst Cook's Distance:")
    print(top_outliers)

    return coefficients, r2, mspr

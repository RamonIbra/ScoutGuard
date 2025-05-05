import pandas as pd
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score

def run_regression(df: pd.DataFrame, x_cols: list[str], y_col: str, alpha=1, l1_ratio=0.1):
    X = df[x_cols]
    y = df[y_col]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = ElasticNet(alpha=alpha, l1_ratio=l1_ratio)
    model.fit(X_scaled, y)

    y_pred = model.predict(X_scaled)
    r2 = r2_score(y, y_pred)

    return pd.Series(model.coef_, index=x_cols), r2

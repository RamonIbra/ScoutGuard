import pandas as pd
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import StandardScaler

def run_regression(df: pd.DataFrame, x_cols: list[str], y_col: str, alpha=0.01, l1_ratio=0.5):
    X = df[x_cols]
    y = df[y_col]

    # Skala features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = ElasticNet(alpha=alpha, l1_ratio=l1_ratio)
    model.fit(X_scaled, y)

    return pd.Series(model.coef_, index=x_cols)

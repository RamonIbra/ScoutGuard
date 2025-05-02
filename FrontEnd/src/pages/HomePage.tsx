import React, { useEffect, useState } from "react";
import RegressionChart from "@/components/ui/RegressionChart";

type Stat = {
  name: string;
  weight: number;
};

const DashboardPage = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [r2, setR2] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/regression")
      .then((res) => res.json())
      .then((data) => {
        if (!data.coefficients) return;

        const entries = Object.entries(data.coefficients)
          .map(([name, weight]) => ({ name, weight: Number(weight) }))
          .filter((entry) => entry.weight !== 0)
          .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

        setStats(entries);
        setR2(data.r2 ?? null);
      })
      .catch((err) => {
        console.error("Kunde inte hämta regression:", err);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard</h1>
      <p className="text-muted-foreground mb-2">
        These player actions show the strongest statistical correlation with the number of goals conceded by the team, based on our regression analysis.
      </p>
      {r2 !== null && (
        <p className="text-sm text-gray-500 mb-6">
          Model explanatory power (R² = {r2.toFixed(3)}): This means the model explains about {(r2 * 100).toFixed(1)}% of the variation in goals conceded using the selected stats.
        </p>
      )}

      <RegressionChart stats={stats} />
    </div>
  );
};

export default DashboardPage;

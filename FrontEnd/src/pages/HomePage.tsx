import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RegressionChart from "@/components/ui/RegressionChart";

type Stat = { name: string; weight: number };

const DashboardPage = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [r2, setR2] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user_id = session?.user?.id ?? "";

      const res = await fetch(`http://localhost:8000/regression?user_id=${user_id}`);
      const data = await res.json();

      if (!data.coefficients) return;

      const entries = Object.entries(data.coefficients)
        .map(([name, weight]) => ({ name, weight: Number(weight) }))
        .filter((entry) => Math.abs(entry.weight) >= 0.001)
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

      setStats(entries);
      setR2(data.r2 ?? null);
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard</h1>
      <p className="text-muted-foreground mb-2">
        These player actions show the strongest statistical correlation with the number of goals conceded by the team.
      </p>
      {r2 !== null && (
        <p className="text-sm text-gray-500 mb-6">
          Model explanatory power (R² = {r2.toFixed(3)}): explains about {(r2 * 100).toFixed(1)}% of the variance.
        </p>
      )}
      <RegressionChart stats={stats} />
    </div>
  );
};

export default DashboardPage;

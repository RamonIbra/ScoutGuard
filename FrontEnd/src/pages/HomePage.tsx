import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import RegressionChart from "@/components/ui/RegressionChart";

type Stat = { name: string; weight: number };

const DashboardPage = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [r2, setR2] = useState<number | null>(null);
  const [mspr, setMspr] = useState<number | null>(null);
  const [ssr, setSsr] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      setMspr(data.mspr ?? null);
      setSsr(data.ssr ?? null);
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
        <p className="text-sm text-gray-500 mb-1">
          <strong>R²: {r2.toFixed(3)}</strong> - proportion of variance in goals conceded explained by the model.
        </p>
      )}
      {mspr !== null && (
        <p className="text-sm text-gray-500 mb-1">
          <strong>MSPR: {mspr.toFixed(4)}</strong> - average prediction error on unseen data.
        </p>
      )}
      {ssr !== null && (
        <p className="text-sm text-gray-500 mb-4">
          <strong>SSR: {ssr.toFixed(2)}</strong> - total squared residuals on the training data.
        </p>
      )}

      <RegressionChart stats={stats} />
    </div>
  );
};

export default DashboardPage;

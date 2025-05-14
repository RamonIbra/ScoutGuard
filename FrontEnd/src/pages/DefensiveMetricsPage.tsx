import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const DefensiveMetricsPage = () => {
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    const fetchColumnNames = async () => {
      const { data, error } = await supabase
        .from("player_match_stats")
        .select("*")
        .limit(1);

      if (error) {
        console.error("Fel vid hämtning:", error.message);
      } else if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        setColumns(keys);
      }
    };

    fetchColumnNames();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Available Statistics
      </h1>
      <p className="mb-6 text-gray-700">
        These stat types represent different player actions that can affect a
        team's defensive performance. By analyzing these metrics, we can
        identify which of them contribute the most to reducing the number of
        goals conceded.
      </p>

      <div className="bg-white shadow rounded-lg p-4">
        <ul className="space-y-2">
          {columns.map((col) => (
            <li key={col} className="text-sm text-gray-700 border-b pb-1">
              {col.replace(/_/g, " ").toUpperCase()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DefensiveMetricsPage;

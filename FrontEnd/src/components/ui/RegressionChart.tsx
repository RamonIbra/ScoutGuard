"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

type Stat = {
  name: string;
  weight: number;
};

type Props = {
  stats: Stat[];
};

export default function RegressionChart({ stats }: Props) {
    // Filtrerar bort insignifikanta värden
    const filteredStats = stats.filter((s) => Math.abs(s.weight) >= 0.001);
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={filteredStats}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <XAxis
            type="number"
            domain={[-0.5, 0.5]}
            tickFormatter={(tick) => tick.toFixed(3)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            interval={0}
          />

          <Tooltip formatter={(value: number) => value.toFixed(3)} />
          <Bar dataKey="weight" isAnimationActive={false}>
            <LabelList
              dataKey="weight"
              position="right"
              formatter={(val: number) => val.toFixed(3)}
            />
            {filteredStats.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.weight < 0 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  

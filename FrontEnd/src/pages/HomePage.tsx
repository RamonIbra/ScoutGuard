import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const mockStats = [
  { name: "Tackles", weight: 0.72 },
  { name: "Progressive Passes", weight: 0.64 },
  { name: "Blocks", weight: 0.51 },
];

const DashboardPage = () => {
  const [stats] = useState(mockStats);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Dessa defensiva statistiktyper har störst påverkan på lagets insläppta
        mål enligt vår analys.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>{stat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stat.weight * 100} />
              <p className="text-sm mt-2 text-gray-500">
                Vikt: {(stat.weight * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;

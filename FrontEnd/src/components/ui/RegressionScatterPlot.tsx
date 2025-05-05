"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line
} from "recharts";

type DataPoint = { x: number; y: number };

type Props = {
  points: DataPoint[];
  regressionLine: DataPoint[]; // The predicted line
};

export default function RegressionScatterPlot({ points, regressionLine }: Props) {
  return (
    <ScatterChart width={600} height={400}>
      <CartesianGrid />
      <XAxis dataKey="x" type="number" />
      <YAxis dataKey="y" type="number" />
      <Tooltip />
      <Legend />
      <Scatter name="Data points" data={points} fill="red" />
      <Line
        name="Regression line"
        type="linear"
        dataKey="y"
        data={regressionLine}
        stroke="blue"
        dot={false}
      />
    </ScatterChart>
  );
}

"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ActivityTimelineProps {
  data: Array<{
    date: string;
    insert: number;
    update: number;
    delete: number;
  }>;
}

const timelineConfig = {
  insert: {
    label: "Created",
    color: "var(--chart-1)",
  },
  update: {
    label: "Updated",
    color: "var(--chart-2)",
  },
  delete: {
    label: "Deleted",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function ActivityTimeline({ data }: ActivityTimelineProps) {
  // Calculate trend
  const recentTotal = data.slice(-3).reduce((acc, d) => acc + d.insert + d.update + d.delete, 0);
  const previousTotal = data.slice(0, 3).reduce((acc, d) => acc + d.insert + d.update + d.delete, 0);
  const trendPercent = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;
  const TrendIcon = trendPercent > 0 ? TrendingUp : trendPercent < 0 ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Daily system activities over the past 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={timelineConfig} className="h-[200px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("id-ID", { weekday: "short" });
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="delete"
              type="monotone"
              fill="var(--color-delete)"
              fillOpacity={0.2}
              stroke="var(--color-delete)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="update"
              type="monotone"
              fill="var(--color-update)"
              fillOpacity={0.3}
              stroke="var(--color-update)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="insert"
              type="monotone"
              fill="var(--color-insert)"
              fillOpacity={0.4}
              stroke="var(--color-insert)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trendPercent > 0 ? "Trending up" : trendPercent < 0 ? "Trending down" : "Stable"} by{" "}
              {Math.abs(trendPercent).toFixed(1)}% this week
              <TrendIcon className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">Last 7 days activity</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

interface ActionDistributionProps {
  data: {
    insert: number;
    update: number;
    delete: number;
  };
}

const distributionConfig = {
  count: {
    label: "Count",
  },
  insert: {
    label: "Created",
    color: "hsl(142, 76%, 36%)",
  },
  update: {
    label: "Updated",
    color: "hsl(217, 91%, 60%)",
  },
  delete: {
    label: "Deleted",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

export function ActionDistribution({ data }: ActionDistributionProps) {
  const total = data.insert + data.update + data.delete;

  const chartData = [
    { action: "insert", count: data.insert, fill: "var(--color-insert)" },
    { action: "update", count: data.update, fill: "var(--color-update)" },
    { action: "delete", count: data.delete, fill: "var(--color-delete)" },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Action Distribution</CardTitle>
        <CardDescription>Breakdown by operation type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={distributionConfig} className="mx-auto aspect-square max-h-[180px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="count" nameKey="action" innerRadius={50} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-4 leading-none">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>{data.insert} created</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>{data.update} updated</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>{data.delete} deleted</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

interface EntityActivityProps {
  data: Array<{
    entity: string;
    insert: number;
    update: number;
    delete: number;
    total: number;
  }>;
}

const entityConfig = {
  insert: {
    label: "Created",
    color: "hsl(142, 76%, 36%)",
  },
  update: {
    label: "Updated",
    color: "hsl(217, 91%, 60%)",
  },
  delete: {
    label: "Deleted",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

export function EntityActivityChart({ data }: EntityActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity by Entity</CardTitle>
        <CardDescription>Operations breakdown per table</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={entityConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis
              dataKey="entity"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={80}
              tickFormatter={(value) => value.replace("_", " ")}
            />
            <XAxis type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="insert" stackId="a" fill="var(--color-insert)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="update" stackId="a" fill="var(--color-update)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="delete" stackId="a" fill="var(--color-delete)" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

interface HourlyActivityProps {
  data: Array<{
    hour: string;
    count: number;
  }>;
}

const hourlyConfig = {
  count: {
    label: "Activities",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function HourlyActivityChart({ data }: HourlyActivityProps) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Activity</CardTitle>
        <CardDescription>Activity distribution by hour (last 24h)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={hourlyConfig} className="h-[120px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(217, 91%, ${60 + (1 - entry.count / maxCount) * 30}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </CardContent>
    </Card>
  );
}

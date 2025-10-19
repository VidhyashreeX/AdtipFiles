import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const data = [
  { date: "Mon", earnings: 120 },
  { date: "Tue", earnings: 150 },
  { date: "Wed", earnings: 135 },
  { date: "Thu", earnings: 180 },
  { date: "Fri", earnings: 165 },
  { date: "Sat", earnings: 200 },
  { date: "Sun", earnings: 190 },
];

export function EarningsChart() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Earnings Overview</h3>
        <p className="text-sm text-muted-foreground">Last 7 days performance</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [`₹${value}`, "Earnings"]}
            />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorEarnings)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

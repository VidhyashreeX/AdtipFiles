import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: MetricCardProps) {
  const changeColors = {
    positive: "text-green-600 dark:text-green-400",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-primary/10 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

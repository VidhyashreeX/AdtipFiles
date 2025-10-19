import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const adModels = [
  { name: "Skip Ad", views: 20000, ecpm: 25, earnings: 500, share: 20 },
  { name: "Non-Skip", views: 10000, ecpm: 40, earnings: 400, share: 15 },
  { name: "Non-Skip + Lead", views: 5000, ecpm: 75, earnings: 375, share: 10 },
  { name: "Reward Ad", views: 15000, ecpm: 60, earnings: 900, share: 30 },
  { name: "Native", views: 8000, ecpm: 20, earnings: 160, share: 5 },
  { name: "Banner", views: 30000, ecpm: 10, earnings: 300, share: 20 },
];

export function AdModelsTable() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Ad Model Performance</h3>
        <p className="text-sm text-muted-foreground">Compare revenue by ad format</p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ad Model</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">eCPM</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead>Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adModels.map((model) => (
              <TableRow key={model.name}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className="text-right">
                  {model.views.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">₹{model.ecpm}</TableCell>
                <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                  ₹{model.earnings.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={model.share} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-12 text-right">
                      {model.share}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

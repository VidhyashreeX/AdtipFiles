import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Globe, MoreVertical, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const apps = [
  {
    id: 1,
    name: "AdTip Video Player",
    platform: "Android",
    appId: "23Xk92A",
    status: "active",
    views: 45000,
    earnings: 1750,
  },
  {
    id: 2,
    name: "News Portal",
    platform: "Web",
    appId: "98Zm34B",
    status: "active",
    views: 32000,
    earnings: 1280,
  },
  {
    id: 3,
    name: "Gaming Hub",
    platform: "Android",
    appId: "45Qw78C",
    status: "active",
    views: 28000,
    earnings: 1120,
  },
];

export function AppsTable() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">My Apps</h3>
          <p className="text-sm text-muted-foreground">Manage your integrated applications</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          Add New App
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>App Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>App ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {app.platform === "Android" ? (
                      <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-primary" />
                    )}
                    <span>{app.platform}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{app.appId}</TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {app.views.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                  ₹{app.earnings.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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

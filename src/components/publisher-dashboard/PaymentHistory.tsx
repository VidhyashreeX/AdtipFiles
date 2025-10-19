import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";

const payments = [
  {
    id: 1,
    date: "5 Oct 2025",
    method: "UPI",
    amount: 1500,
    status: "completed",
  },
  {
    id: 2,
    date: "20 Sept 2025",
    method: "Bank Transfer",
    amount: 2000,
    status: "completed",
  },
  {
    id: 3,
    date: "5 Sept 2025",
    method: "UPI",
    amount: 1750,
    status: "completed",
  },
  {
    id: 4,
    date: "20 Aug 2025",
    method: "Bank Transfer",
    amount: 1200,
    status: "completed",
  },
];

export function PaymentHistory() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Payment History</h3>
          <p className="text-sm text-muted-foreground">Your recent transactions</p>
        </div>
        <Button variant="outline">Request Payout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
          <p className="text-2xl font-bold text-foreground">₹3,450</p>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-muted-foreground mb-1">Withdrawable</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹3,450</p>
        </Card>
        <Card className="p-4 bg-primary/10">
          <p className="text-sm text-muted-foreground mb-1">Lifetime Earnings</p>
          <p className="text-2xl font-bold text-primary">₹8,200</p>
        </Card>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.date}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell className="text-right font-semibold">
                  ₹{payment.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="default" className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

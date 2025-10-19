import { MetricCard } from "@/components/publisher-dashboard/MetricCard";
import { EarningsChart } from "@/components/publisher-dashboard/EarningsChart";
import { AppsTable } from "@/components/publisher-dashboard/AppsTable";
import { AdModelsTable } from "@/components/publisher-dashboard/AdModelsTable";
import { PaymentHistory } from "@/components/publisher-dashboard/PaymentHistory";
import { Eye, DollarSign, TrendingUp, Users, Target, Percent } from "lucide-react";

const PublisherDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Publisher Dashboard</h1>
          <p className="text-muted-foreground">Monitor your earnings and app performance in real-time</p>
        </div>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              title="Total Views"
              value="120K"
              change="+12.5% from last month"
              changeType="positive"
              icon={Eye}
              iconColor="text-primary"
            />
            <MetricCard
              title="Total Earnings"
              value="₹4,250"
              change="+8.2% from last month"
              changeType="positive"
              icon={DollarSign}
              iconColor="text-green-600 dark:text-green-400"
            />
            <MetricCard
              title="Today's Earnings"
              value="₹105"
              change="+15 from yesterday"
              changeType="positive"
              icon={TrendingUp}
              iconColor="text-accent"
            />
            <MetricCard
              title="Active Users"
              value="1,450"
              change="+5.3% from last week"
              changeType="positive"
              icon={Users}
              iconColor="text-primary"
            />
            <MetricCard
              title="Avg. eCPM"
              value="₹35"
              change="+₹2 from last month"
              changeType="positive"
              icon={Target}
              iconColor="text-green-600 dark:text-green-400"
            />
            <MetricCard
              title="CTR"
              value="2.8%"
              change="+0.4% from last month"
              changeType="positive"
              icon={Percent}
              iconColor="text-accent"
            />
          </div>

          {/* Earnings Chart */}
          <EarningsChart />

          {/* Apps Table */}
          <AppsTable />

          {/* Ad Models Performance */}
          <AdModelsTable />

          {/* Payment History */}
          <PaymentHistory />
        </div>
      </div>
    </div>
  );
};

export default PublisherDashboard;

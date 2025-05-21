
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  Bar, 
  Line 
} from "recharts";
import { Users, ShoppingBag, UserCircle, Megaphone } from "lucide-react";

const generateMockData = (numPoints: number) => {
  const data = [];
  for (let i = 0; i < numPoints; i++) {
    const month = new Date(2025, i % 12, 1).toLocaleString('default', { month: 'short' });
    data.push({
      name: month,
      consumers: Math.floor(Math.random() * 1000) + 500,
      contentCreators: Math.floor(Math.random() * 500) + 100,
      sellers: Math.floor(Math.random() * 300) + 50,
      advertisers: Math.floor(Math.random() * 200) + 20,
    });
  }
  return data;
};

const chartData = generateMockData(12);

const Analysis = () => {
  const [activeTab, setActiveTab] = useState("consumers");

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-8">Platform Analytics</h1>

      <Tabs defaultValue="consumers" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="consumers" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Consumers
          </TabsTrigger>
          <TabsTrigger value="contentCreators" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" /> Content Creators
          </TabsTrigger>
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Sellers
          </TabsTrigger>
          <TabsTrigger value="advertisers" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Advertisers
          </TabsTrigger>
        </TabsList>
        
        {/* Consumers Tab */}
        <TabsContent value="consumers">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Consumer Growth</CardTitle>
                <CardDescription>Monthly active consumers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="consumers" stroke="#2dd4bf" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Consumer Statistics</CardTitle>
                <CardDescription>Key consumer metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Total Consumers</p>
                    <p className="text-2xl font-bold">8,745</p>
                    <p className="text-green-500 text-xs mt-1">↑ 12.3% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Average Time Spent</p>
                    <p className="text-2xl font-bold">14.2 min</p>
                    <p className="text-green-500 text-xs mt-1">↑ 3.5% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Purchase Conversion Rate</p>
                    <p className="text-2xl font-bold">3.8%</p>
                    <p className="text-red-500 text-xs mt-1">↓ 0.2% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Content Creators Tab */}
        <TabsContent value="contentCreators">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Content Creator Growth</CardTitle>
                <CardDescription>Monthly active content creators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="contentCreators" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Creator Statistics</CardTitle>
                <CardDescription>Key creator metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Total Creators</p>
                    <p className="text-2xl font-bold">2,134</p>
                    <p className="text-green-500 text-xs mt-1">↑ 8.7% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Avg Content Posted</p>
                    <p className="text-2xl font-bold">5.3 / week</p>
                    <p className="text-green-500 text-xs mt-1">↑ 2.1% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Avg Engagement Rate</p>
                    <p className="text-2xl font-bold">4.2%</p>
                    <p className="text-green-500 text-xs mt-1">↑ 0.5% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Sellers Tab */}
        <TabsContent value="sellers">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Seller Performance</CardTitle>
                <CardDescription>Monthly active sellers and sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="sellers" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Seller Statistics</CardTitle>
                <CardDescription>Key seller metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Total Sellers</p>
                    <p className="text-2xl font-bold">975</p>
                    <p className="text-green-500 text-xs mt-1">↑ 5.3% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Avg Products Per Seller</p>
                    <p className="text-2xl font-bold">12.7</p>
                    <p className="text-green-500 text-xs mt-1">↑ 1.2% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Avg Monthly Sales</p>
                    <p className="text-2xl font-bold">$1,352</p>
                    <p className="text-green-500 text-xs mt-1">↑ 7.8% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Advertisers Tab */}
        <TabsContent value="advertisers">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Advertiser Growth</CardTitle>
                <CardDescription>Monthly active advertisers and ad spend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="advertisers" stroke="#0ea5e9" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Advertiser Statistics</CardTitle>
                <CardDescription>Key advertiser metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Total Advertisers</p>
                    <p className="text-2xl font-bold">348</p>
                    <p className="text-green-500 text-xs mt-1">↑ 15.2% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Avg Ad Spend</p>
                    <p className="text-2xl font-bold">$2,780</p>
                    <p className="text-green-500 text-xs mt-1">↑ 9.4% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-sm">Avg CTR</p>
                    <p className="text-2xl font-bold">2.8%</p>
                    <p className="text-green-500 text-xs mt-1">↑ 0.3% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;

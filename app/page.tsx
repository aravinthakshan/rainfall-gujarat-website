import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RainfallChart } from "@/components/rainfall-chart"
import { RegionalTable } from "@/components/regional-table"
import { DashboardHeader } from "@/components/dashboard-header"
import { Cloud, Droplets, TrendingUp, AlertTriangle } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex flex-col w-full">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-green-600">+2 from last year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rainfall (24h)</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22.67mm</div>
              <p className="text-xs text-red-600">-8% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10.46%</div>
              <p className="text-xs text-green-600">+5.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+0.3 from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Rainfall Volume</CardTitle>
                  <CardDescription>Daily rainfall volume over the past 30 days</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <RainfallChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Regional Distribution</CardTitle>
                  <CardDescription>Rainfall distribution across regions</CardDescription>
                </CardHeader>
                <CardContent>
                  <RegionalTable />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regional" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Regional Analysis</CardTitle>
                <CardDescription>Detailed regional rainfall data</CardDescription>
              </CardHeader>
              <CardContent>
                <RegionalTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and data quality metrics</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <RainfallChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Current weather alerts and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Heavy Rainfall Warning</p>
                      <p className="text-sm text-muted-foreground">North Gujarat - Expected 50mm+ in next 24h</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs">
                      High
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Moderate Rainfall</p>
                      <p className="text-sm text-muted-foreground">East Central - 20-30mm expected</p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs">
                      Medium
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Light Showers</p>
                      <p className="text-sm text-muted-foreground">Saurashtra - Light rainfall expected</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                      Low
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Shell } from "./components/Shell";
import { Dashboard } from "./features/Dashboard";
import { ShadowboardSetup } from "./features/Shadowboard";
import { AuditScheduling } from "./features/AuditScheduling";
import { Reports } from "./features/Reports";
import { Serviceability } from "./features/Serviceability";

export default function App() {
  return (
    <Shell>
      <Tabs defaultValue="dashboard">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="setup">Shadowboard</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="serviceability">Serviceability</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <div className="mt-4 space-y-6">
          <TabsContent value="dashboard"><Dashboard /></TabsContent>
          <TabsContent value="setup"><ShadowboardSetup /></TabsContent>
          <TabsContent value="audits"><AuditScheduling /></TabsContent>
          <TabsContent value="serviceability"><Serviceability /></TabsContent>
          <TabsContent value="reports"><Reports /></TabsContent>
        </div>
      </Tabs>
    </Shell>
  );
}

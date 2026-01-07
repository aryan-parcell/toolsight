import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function Settings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium">High-contrast mode</div>
                        <div className="text-xs text-zinc-500">Improves visibility in bright or dim conditions</div>
                    </div>
                    <Switch />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium">Glove-friendly controls</div>
                        <div className="text-xs text-zinc-500">Increases hit targets to 48–56px</div>
                    </div>
                    <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium">Edge processing</div>
                        <div className="text-xs text-zinc-500">Analyze photos locally when possible</div>
                    </div>
                    <Switch />
                </div>
            </CardContent>
        </Card>
    );
}
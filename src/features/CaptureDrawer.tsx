import { useState } from "react";
import { Camera, ScanLine, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/Pill";
import { MOCK_RESULTS } from "@/data/mock-data";

export function CaptureDrawer() {
    const [analyzing, setAnalyzing] = useState(false);
    const [done, setDone] = useState(false);

    function simulateAnalysis() {
        setAnalyzing(true);
        setDone(false);
        setTimeout(() => { setAnalyzing(false); setDone(true); }, 1200);
    }

    return (
        <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" />Capture Drawer</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-2xl border relative overflow-hidden bg-black/90 aspect-video grid place-items-center">
                        <div className="absolute inset-0 grid place-items-center pointer-events-none">
                            <div className="w-[82%] h-[68%] border-2 border-white/70 rounded-xl">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white/80 text-xs flex items-center gap-2"><ScanLine className="h-4 w-4" /> Align drawer to outline</div>
                            </div>
                        </div>
                        <Button size="lg" onClick={simulateAnalysis} className="z-10">
                            <Camera className="h-4 w-4 mr-2" /> Capture
                        </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        {analyzing && <span className="text-sm text-zinc-500">Analyzing…</span>}
                        {done && <span className="text-sm text-green-600">Analysis complete</span>}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Inventory Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {MOCK_RESULTS.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl border p-3">
                                <div>
                                    <div className="text-sm font-medium">{r.tool}</div>
                                    <div className="text-xs text-zinc-500">{r.sku} • conf {Math.round(r.confidence * 100)}%</div>
                                </div>
                                {r.status === "present" && <Pill color="green">Present</Pill>}
                                {r.status === "missing" && <Pill color="red">Missing</Pill>}
                                {r.status === "uncertain" && <Pill color="amber">Review</Pill>}
                            </div>
                        ))}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="secondary">Override</Button>
                            <Button>Confirm</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
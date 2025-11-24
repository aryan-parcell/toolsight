import { Box, CalendarClock, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/Pill";
import { TOOLBOXES, AUDITS } from "@/data/mock-data";

export function Dashboard() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Box />Active Toolboxes</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {TOOLBOXES.map((tb) => (
                            <Card key={tb.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>{tb.id}</CardTitle>
                                    <CardDescription>{tb.type} • {tb.site}</CardDescription>

                                    {tb.status === "complete" && <Pill color="green">Complete</Pill>}
                                    {tb.status === "missing" && <Pill color="red">Missing</Pill>}
                                    {tb.status === "calibration" && <Pill color="amber">Calibration</Pill>}
                                </CardHeader>

                                <CardContent>
                                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                                        <span>Last audit: {tb.lastAudit}</span>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm">Audit</Button>
                                            <Button size="sm">Open</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Card className="flex items-center justify-center border-dashed">
                            <CardContent className="p-6 text-center">
                                <Button variant="ghost"><Plus className="h-4 w-4 mr-2" /> Add toolbox</Button>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Upcoming Audits</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {AUDITS.map((a) => (
                            <li key={a.id} className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">{a.box}</div>
                                    <div className="text-xs text-zinc-500">{a.freq} • due {a.due} • {a.assignee}</div>
                                </div>
                                <Pill color={a.status === "Due" ? "amber" : "zinc"}>{a.status}</Pill>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
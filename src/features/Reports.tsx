import { BarChart3, FileDown, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Reports() {
    return (
        <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Organization Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-3">
                        {["Discrepancy rate", "MTTR", "Repeat failures (90d)"].map((kpi, i) => (
                            <div key={i} className="rounded-2xl p-4 bg-zinc-100 dark:bg-zinc-900">
                                <div className="text-xs text-zinc-500">{kpi}</div>
                                <div className="text-2xl font-bold">{i === 0 ? "2.1%" : i === 1 ? "6.4h" : "3.7%"}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="secondary"><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
                        <Button><FileDown className="h-4 w-4 mr-2" /> Export PDF</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Label className="w-24">Tray type</Label>
                        <Select>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Any" /></SelectTrigger>
                            <SelectContent>
                                {["TT1", "TT2", "TTX2", "TTX4"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="w-24">Date range</Label>
                        <Select>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Last 30d" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7d</SelectItem>
                                <SelectItem value="30d">Last 30d</SelectItem>
                                <SelectItem value="90d">Last 90d</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end">
                        <Button>Apply</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
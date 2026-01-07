import { CheckCircle2, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/Pill";
import { CALIBRATION } from "@/data/mock-data";

export function CalibrationManagement() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Calibration Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CALIBRATION.map((c, i) => (
                        <Card key={i} className="hover:shadow">
                            <CardContent className="pt-4">
                                <div className="text-sm font-semibold">{c.name}</div>
                                <div className="text-xs text-zinc-500">{c.sku}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    {c.status === "Compliant" && <Pill color="green">Compliant</Pill>}
                                    {c.status === "Due Soon" && <Pill color="amber">Due Soon</Pill>}
                                    {c.status === "Overdue" && <Pill color="red">Overdue</Pill>}
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        <FileDown className="h-4 w-4" /> Cert
                                    </Button>
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">Due {c.due}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
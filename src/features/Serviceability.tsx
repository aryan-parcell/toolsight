import { AlertTriangle, Upload, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionTitle } from "@/components/SectionTitle";

export function Serviceability() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Tool Serviceability</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="rounded-2xl border p-4">
                            <div className="text-sm font-semibold mb-2">Event</div>
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Label className="w-36">Condition</Label>
                                    <Select defaultValue="ok">
                                        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ok">Serviceable</SelectItem>
                                            <SelectItem value="cond">Conditionally Serviceable</SelectItem>
                                            <SelectItem value="unserv">Unserviceable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="w-36">Severity</Label>
                                    <Select defaultValue="low">
                                        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="med">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="w-36">Corrective Action</Label>
                                    <Select defaultValue="inspect">
                                        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inspect">Inspect</SelectItem>
                                            <SelectItem value="replace">Replace</SelectItem>
                                            <SelectItem value="rma">RMA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="secondary"><Upload className="h-4 w-4 mr-2" /> Add Photo</Button>
                                <Button>Save Event</Button>
                            </div>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <div className="text-sm font-semibold mb-2">Quick Flags</div>
                            <div className="grid gap-2">
                                {[
                                    "Dropped calibrated tool",
                                    "Lost/stolen tool",
                                    "Damaged box",
                                    "Dirty",
                                    "Box unsuitable for task",
                                    "AI/App performance",
                                ].map((t, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Checkbox id={`qf-${i}`} />
                                        <Label htmlFor={`qf-${i}`}>{t}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <SectionTitle icon={ClipboardList} title="Recent Events" />
                    <div className="rounded-2xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-100 dark:bg-zinc-900">
                                <tr>
                                    <th className="text-left p-2">Timestamp</th>
                                    <th className="text-left p-2">Tool</th>
                                    <th className="text-left p-2">Condition</th>
                                    <th className="text-left p-2">Severity</th>
                                    <th className="text-left p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t">
                                    <td className="p-2">2025-10-11 09:14</td>
                                    <td className="p-2">Torque Wrench 200Nm</td>
                                    <td className="p-2">Unserviceable</td>
                                    <td className="p-2">High</td>
                                    <td className="p-2">RMA</td>
                                </tr>
                                <tr className="border-t">
                                    <td className="p-2">2025-10-09 15:02</td>
                                    <td className="p-2">3pc Pliers</td>
                                    <td className="p-2">Serviceable</td>
                                    <td className="p-2">Low</td>
                                    <td className="p-2">Inspect</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

import {LucideUserPen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";


export default function EmailManagement() {
    const { appUser } = useAuth();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LucideUserPen className="h-5 w-5" /> Personal Info</CardTitle>
                <CardDescription>Manage your personal information and email preferences.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <div className="font-semibold text-gray-900 dark:text-white">Display Name:</div>
                        <div className="text-sm text-gray-500">{appUser?.displayName || "No name provided"}</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <div className="font-semibold text-gray-900 dark:text-white">Email:</div>
                        <div className="text-sm text-gray-500">{appUser?.email || "No email provided"}</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <div className="font-semibold text-gray-900 dark:text-white">Role:</div>
                        <div className="text-sm text-gray-500">{appUser?.role || "No role provided"}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
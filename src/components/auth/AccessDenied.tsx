import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] animate-in fade-in zoom-in duration-500">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500 max-w-md mb-8">
                You do not have the required permissions (Manager Role) to view this page.
                Please contact your administrator or sign in with a different account.
            </p>
            <Link href="/roadmap">
                <Button variant="outline">Return to Dashboard</Button>
            </Link>
        </div>
    );
}

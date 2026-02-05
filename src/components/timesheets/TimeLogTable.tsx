"use client";

import { TimeLog } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { CheckCircle2, XCircle, Clock, ExternalLink, MessageSquare, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeLogTableProps {
    logs: TimeLog[];
    showApprovalActions?: boolean;
    onApprove?: (id: string) => void;
    onReject?: (id: string, comment: string) => void;
}

export function TimeLogTable({
    logs,
    showApprovalActions = false,
    onApprove,
    onReject
}: TimeLogTableProps) {

    const getStatusBadge = (status: TimeLog['status']) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="w-[120px]">Date</TableHead>
                        {showApprovalActions && <TableHead>Developer</TableHead>}
                        <TableHead>Summary</TableHead>
                        <TableHead className="w-[100px]">Ticket</TableHead>
                        <TableHead className="w-[80px] text-center">Hours</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        {showApprovalActions && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={showApprovalActions ? 7 : 5} className="h-32 text-center text-slate-500 italic">
                                No time logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-medium text-slate-700">
                                    {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </TableCell>
                                {showApprovalActions && (
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium">{log.userName}</span>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-slate-800 line-clamp-2">{log.summary}</p>
                                        {log.managerComment && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" /> {log.managerComment}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5 min-w-[120px]">
                                        {log.jiraTickets && log.jiraTickets.length > 0 ? (
                                            log.jiraTickets.map((ticket) => (
                                                <a
                                                    key={ticket}
                                                    href={`https://jira.company.com/browse/${ticket}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                                                >
                                                    {ticket}
                                                    <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-50" />
                                                </a>
                                            ))
                                        ) : (log as any).jiraTicket ? (
                                            <a
                                                href={`https://jira.company.com/browse/${(log as any).jiraTicket}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
                                            >
                                                {(log as any).jiraTicket}
                                                <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-50" />
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 text-xs">N/A</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-bold text-slate-900">
                                    {log.hours.toFixed(1)}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(log.status)}
                                </TableCell>
                                {showApprovalActions && (
                                    <TableCell className="text-right">
                                        {log.status === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 font-medium"
                                                    onClick={() => {
                                                        const comment = prompt("Enter rejection reason:");
                                                        if (comment && onReject) onReject(log.id, comment);
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 font-medium"
                                                    onClick={() => onApprove && onApprove(log.id)}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Finalized</span>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

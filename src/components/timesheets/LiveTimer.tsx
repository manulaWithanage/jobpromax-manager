"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Play, Pause, RotateCcw, Timer, ExternalLink } from "lucide-react";

interface LiveTimerProps {
    onApplyTime?: (hours: number) => void;
}

export function LiveTimer({ onApplyTime }: LiveTimerProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // Total milliseconds
    const [accumulatedTime, setAccumulatedTime] = useState(0); // Time from previous sessions
    const [startTime, setStartTime] = useState<number | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        const savedAccumulated = localStorage.getItem("stopwatch_accumulatedTime");
        const savedStartTime = localStorage.getItem("stopwatch_startTime");
        const savedIsRunning = localStorage.getItem("stopwatch_isRunning") === "true";

        let initialAccumulated = parseInt(savedAccumulated || "0", 10);
        setAccumulatedTime(initialAccumulated);

        if (savedIsRunning && savedStartTime) {
            const start = parseInt(savedStartTime, 10);
            setStartTime(start);
            setIsRunning(true);
            setElapsedTime(initialAccumulated + (Date.now() - start));
        } else {
            setElapsedTime(initialAccumulated);
        }
    }, []);

    // Tick logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && startTime) {
            interval = setInterval(() => {
                setElapsedTime(accumulatedTime + (Date.now() - startTime));
            }, 100);
        }

        return () => clearInterval(interval);
    }, [isRunning, startTime, accumulatedTime]);

    const handleStart = () => {
        const now = Date.now();
        setStartTime(now);
        setIsRunning(true);
        localStorage.setItem("stopwatch_startTime", now.toString());
        localStorage.setItem("stopwatch_isRunning", "true");
    };

    const handlePause = () => {
        const now = Date.now();
        const currentSessionDuration = startTime ? now - startTime : 0;
        const newAccumulated = accumulatedTime + currentSessionDuration;

        setAccumulatedTime(newAccumulated);
        setElapsedTime(newAccumulated);
        setIsRunning(false);
        setStartTime(null);

        localStorage.setItem("stopwatch_accumulatedTime", newAccumulated.toString());
        localStorage.removeItem("stopwatch_startTime");
        localStorage.setItem("stopwatch_isRunning", "false");
    };

    const handleReset = () => {
        setIsRunning(false);
        setElapsedTime(0);
        setAccumulatedTime(0);
        setStartTime(null);
        localStorage.clear(); // Or specifically remove stopwatch items
        localStorage.removeItem("stopwatch_startTime");
        localStorage.removeItem("stopwatch_accumulatedTime");
        localStorage.removeItem("stopwatch_isRunning");
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatElapsedTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || h > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);

        return parts.join(' ');
    };

    const hoursDecimal = (elapsedTime / (1000 * 60 * 60)).toFixed(2);

    return (
        <Card className="border-blue-100 shadow-md bg-white overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm font-medium">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Timer className="h-4 w-4 text-blue-600" /> Live Stopwatch
                    </div>
                    {elapsedTime > 0 && (
                        <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                            {formatElapsedTime(elapsedTime)} ({hoursDecimal}h)
                        </div>
                    )}
                </div>

                <div className="text-3xl font-mono font-bold text-slate-900 text-center py-2">
                    {formatTime(elapsedTime)}
                </div>

                <div className="flex gap-2">
                    {isRunning ? (
                        <Button
                            variant="outline"
                            className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50"
                            onClick={handlePause}
                        >
                            <Pause className="h-4 w-4 mr-2" /> Pause
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={handleStart}
                        >
                            <Play className="h-4 w-4 mr-2" /> {elapsedTime > 0 ? "Resume" : "Start"}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        onClick={handleReset}
                        disabled={elapsedTime === 0 && !isRunning}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>

                    {onApplyTime && (
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                                handlePause();
                                const rawHours = elapsedTime / (1000 * 60 * 60);
                                // Round to nearest 0.5, minimum 0.5 if any time elapsed
                                const roundedHours = Math.max(0.5, Math.round(rawHours * 2) / 2);
                                onApplyTime(roundedHours);
                            }}
                            disabled={elapsedTime <= 0}
                        >
                            Apply to Form
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

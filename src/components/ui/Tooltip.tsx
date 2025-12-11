"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);

    // Clone children to pass open state and handlers
    // This is a simplified tooltip that requires specific structure: Trigger then Content
    const childrenArray = React.Children.toArray(children);
    const trigger = childrenArray[0];
    const content = childrenArray[1];

    return (
        <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            {trigger}
            {open && content}
        </div>
    );
};

const TooltipTrigger = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, { ref, ...props, className: cn((children as React.ReactElement<any>).props.className, className) });
    }
    return (
        <div ref={ref} className={className} {...props}>
            {children}
        </div>
    );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "absolute z-50 overflow-hidden rounded-md border bg-slate-900 px-3 py-1.5 text-xs text-slate-50 transition-all animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 bottom-full left-1/2 -translate-x-1/2 mb-1.5",
            className
        )}
        {...props}
    />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogContextType {
    onClose: () => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

const Dialog = ({
    children,
    open,
    onOpenChange,
    containerClassName,
}: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    containerClassName?: string;
}) => {
    if (!open) return null;

    const onClose = () => onOpenChange?.(false);

    return (
        <DialogContext.Provider value={{ onClose }}>
            <div className={cn("fixed inset-0 z-50 flex items-center justify-center", containerClassName)}>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
                {/* Dialog Container */}
                <div className="relative z-50 animate-in fade-in zoom-in-95 duration-200">
                    {children}
                </div>
            </div>
        </DialogContext.Provider>
    );
};

const DialogContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, ref) => {
    const context = React.useContext(DialogContext);

    return (
        <div
            ref={ref}
            className={cn(
                "relative w-full rounded-xl bg-white p-6 shadow-2xl",
                className
            )}
            {...props}
        >
            {children}
            {!hideClose && context && (
                <button
                    onClick={context.onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
                    type="button"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
        </div>
    );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
        {...props}
    />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
        {...props}
    />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-slate-500", className)}
        {...props}
    />
));
DialogDescription.displayName = "DialogDescription";

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};

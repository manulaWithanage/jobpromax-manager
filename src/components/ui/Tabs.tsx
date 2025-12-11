"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }
>(({ className, defaultValue, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue || "")

    // Clone children to pass activeTab and setActiveTab props
    const enhancedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
        }
        return child
    })

    return (
        <div ref={ref} className={className} {...props}>
            {enhancedChildren}
        </div>
    )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { activeTab?: string; setActiveTab?: (value: string) => void }
>(({ className, children, activeTab, setActiveTab, ...props }, ref) => {

    const enhancedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
        }
        return child
    })

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
                className
            )}
            {...props}
        >
            {enhancedChildren}
        </div>
    )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; activeTab?: string; setActiveTab?: (value: string) => void }
>(({ className, value, activeTab, setActiveTab, onClick, ...props }, ref) => {
    const isActive = activeTab === value;
    return (
        <button
            ref={ref}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={(e) => {
                if (setActiveTab) setActiveTab(value);
                if (onClick) onClick(e);
            }}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive && "bg-white text-slate-950 shadow-sm",
                className
            )}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string; activeTab?: string }
>(({ className, value, activeTab, ...props }, ref) => {
    if (value !== activeTab) return null;
    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

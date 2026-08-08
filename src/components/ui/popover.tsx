"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type PopoverContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PopoverContext = React.createContext<PopoverContextType | null>(null);

export function Popover({
  open: controlledOpen,
  onOpenChange,
  className,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextOpen = typeof value === "function" ? value(open) : value;
      setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [open, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className={cn("relative w-full text-left", className)}>{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(PopoverContext);
  if (!context) return null;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    children.props.onClick?.(e);
    context.setOpen((prev) => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      "aria-expanded": context.open,
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button type="button" onClick={handleClick} aria-expanded={context.open} {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({
  className,
  align = "end",
  children,
  ...props
}: {
  className?: string;
  align?: "start" | "end" | "center";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(PopoverContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!context?.open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        context.setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        context.setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [context]);

  if (!context?.open) return null;

  const alignStyles =
    align === "end"
      ? "right-0 origin-top-right"
      : align === "start"
      ? "left-0 origin-top-left"
      : "left-1/2 -translate-x-1/2 origin-top";

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full mt-2 z-50 rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 outline-none animate-in fade-in-0 zoom-in-95 duration-150",
        alignStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

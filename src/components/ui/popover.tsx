"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type PopoverContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
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
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextOpen = typeof value === "function" ? value(open) : value;
      setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [open, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
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
      ref: (node: HTMLElement | null) => {
        context.triggerRef.current = node;
        const childRef = (children as any).ref;
        if (typeof childRef === "function") childRef(node);
        else if (childRef) childRef.current = node;
      },
      onClick: handleClick,
      "aria-expanded": context.open,
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      ref={(node) => {
        context.triggerRef.current = node;
      }}
      type="button"
      onClick={handleClick}
      aria-expanded={context.open}
      {...props}
    >
      {children}
    </button>
  );
}

export function PopoverContent({
  className,
  align = "start",
  children,
  ...props
}: {
  className?: string;
  align?: "start" | "end" | "center";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(PopoverContext);
  const ref = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (context?.triggerRef.current) {
      const rect = context.triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [context?.triggerRef]);

  React.useEffect(() => {
    if (!context?.open) return;
    updatePosition();

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        context.triggerRef.current &&
        !context.triggerRef.current.contains(e.target as Node)
      ) {
        context.setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        context.setOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [context?.open, updatePosition]);

  if (!context?.open || !mounted) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      className={cn(
        "z-[9999] rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 outline-none animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}


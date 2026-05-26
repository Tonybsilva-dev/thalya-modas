import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/55 data-[state=closed]:animate-nitro-fade-out data-[state=open]:animate-nitro-fade-in",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

const drawerContentVariants = cva(
  "fixed z-50 flex flex-col border-border bg-card text-card-foreground shadow-lg outline-none",
  {
    variants: {
      side: {
        bottom:
          "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-none border-t data-[state=closed]:animate-nitro-drawer-out-bottom data-[state=open]:animate-nitro-drawer-in-bottom",
        left: "inset-y-0 left-0 h-full w-[340px] max-w-[calc(100vw-2rem)] border-r data-[state=closed]:animate-nitro-drawer-out-left data-[state=open]:animate-nitro-drawer-in-left",
        right:
          "inset-y-0 right-0 h-full w-[340px] max-w-[calc(100vw-2rem)] border-l data-[state=closed]:animate-nitro-drawer-out-right data-[state=open]:animate-nitro-drawer-in-right",
        top: "inset-x-0 top-0 max-h-[85vh] w-full rounded-none border-b data-[state=closed]:animate-nitro-drawer-out-top data-[state=open]:animate-nitro-drawer-in-top",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type DrawerContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof drawerContentVariants>;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(drawerContentVariants({ side }), className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = DialogPrimitive.Content.displayName;

function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border p-[18px]",
        className,
      )}
      {...props}
    />
  );
}

function DrawerBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid flex-1 content-start gap-2.5 overflow-y-auto p-[18px]", className)}
      {...props}
    />
  );
}

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col-reverse gap-2.5 border-t border-border p-[18px] sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-tight text-foreground", className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

const DrawerCloseButton = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      "inline-flex size-8 shrink-0 items-center justify-center border border-border bg-muted text-foreground outline-none transition-[background-color,border-color,color,transform] duration-fast ease-nitro hover:bg-accent active:scale-95 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
));
DrawerCloseButton.displayName = "DrawerCloseButton";

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  drawerContentVariants,
};
export type { DrawerContentProps };

import * as React from "react";

import { Button } from "./button";
import { Input } from "./input";
import { cn } from "../lib/utils";

function DataTable({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid gap-4 rounded-none border border-border bg-card p-4", className)}
      {...props}
    />
  );
}

function DataTableToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)} {...props} />
  );
}

function DataTableSearch({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn("max-w-xs", className)} placeholder="Search..." {...props} />;
}

function DataTableFooter({
  className,
  selectedCount = 0,
  totalCount = 0,
  ...props
}: React.ComponentProps<"div"> & {
  selectedCount?: number;
  totalCount?: number;
}) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 text-sm text-muted-foreground", className)}
      {...props}
    >
      <span>
        {selectedCount} of {totalCount} row(s) selected.
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost">
          Previous
        </Button>
        <Button size="sm" variant="ghost">
          Next
        </Button>
      </div>
    </div>
  );
}

export { DataTable, DataTableToolbar, DataTableSearch, DataTableFooter };

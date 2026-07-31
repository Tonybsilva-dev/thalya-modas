import type { MouseEventHandler } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@thalya-modas/ui";

export function SupplierBreadcrumb({
  basePath,
  currentLabel,
  onRootClick,
  rootLabel,
}: {
  basePath: string;
  currentLabel: string;
  onRootClick?: MouseEventHandler<HTMLAnchorElement>;
  rootLabel: string;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1.5 text-xs font-bold">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={basePath}
              onClick={onRootClick}
            >
              {rootLabel}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-xs font-bold">
            {currentLabel}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

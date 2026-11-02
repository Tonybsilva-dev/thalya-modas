import type { MouseEventHandler } from "react";
import Link from "next/link";
import { Breadcrumb } from "@store-flow/ui";

export function SupplierBreadcrumb({ basePath, currentLabel, onRootClick, rootLabel }: {
  basePath: string;
  currentLabel: string;
  onRootClick?: MouseEventHandler<HTMLAnchorElement>;
  rootLabel: string;
}) {
  return <Breadcrumb
    aria-label="Navegação de fornecedores"
    items={[{ label: rootLabel, href: basePath }, { label: currentLabel }]}
    renderLink={(item, className) => <Link href={item.href!} className={className} onClick={onRootClick}>{item.label}</Link>}
  />;
}

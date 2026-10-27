"use client";
import { useState } from "react";
import { Button, Pagination, PaginationContent, PaginationItem } from "@store-flow/ui";

export function useRemotePage(resetKey = "") {
 const [selection,setSelection] = useState({page:1,key:resetKey});
 return {page:selection.key===resetKey ? selection.page : 1,onPageChange:(page:number)=>setSelection({page,key:resetKey})};
}

export function ListPagination({ total, page, perPage = 20, totalPages, onPageChange }: {
  total: number; page: number; perPage?: number; totalPages: number; onPageChange: (page: number) => void;
}) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
    <p className="text-sm text-muted-foreground" role="status">{total === 0 || (page - 1) * perPage >= total ? "0" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)}`} de {total} · Página {page} de {Math.max(1,totalPages)}</p>
    <Pagination aria-label="Paginação da lista" className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem><Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button></PaginationItem>
        <PaginationItem><Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Próxima</Button></PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>;
}

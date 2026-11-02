"use client";
import { useState } from "react";
import { Pagination } from "@store-flow/ui";

export function useRemotePage(resetKey = "") {
 const [selection,setSelection] = useState({page:1,key:resetKey});
 return {page:selection.key===resetKey ? selection.page : 1,onPageChange:(page:number)=>setSelection({page,key:resetKey})};
}

export function ListPagination({ total, page, perPage = 20, totalPages, onPageChange, disabled = false }: {
  total: number; page: number; perPage?: number; totalPages: number; onPageChange: (page: number) => void; disabled?: boolean;
}) {
  return <Pagination
    page={page} pageSize={perPage} total={total} onPageChange={onPageChange}
    disabled={disabled}
    showSizeChanger={false} showTotal={false}
    aria-label="Paginação da lista"
    className="flex flex-wrap items-center justify-between gap-3 border-t p-3"
  >
    <span className="text-sm text-muted-foreground" role="status">{total === 0 || (page - 1) * perPage >= total ? "0" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)}`} de {total} · Página {page} de {Math.max(1,totalPages)}</span>
    <div className="flex gap-2"><Pagination.Prev labelPrev="Anterior" /><Pagination.Next labelNext="Próxima" /></div>
  </Pagination>;
}

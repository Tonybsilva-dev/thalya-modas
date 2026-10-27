"use client";
import { useState } from 'react';
import { Button } from '@store-flow/ui';
import { ApiRequestError } from '../api/http-client';
export function ErrorReference({ error }: { error: unknown }) {
  const [copied, setCopied] = useState(false);
  if (!(error instanceof ApiRequestError) || !error.payload.traceId) return null;
  const reference = `${error.payload.code} · ${error.payload.traceId}`;
  return <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="break-all">Referência: {reference}</span><Button size="sm" variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(reference); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Copiado' : 'Copiar referência'}</Button><span role="status" className="sr-only">{copied ? 'Referência copiada' : ''}</span></div>;
}

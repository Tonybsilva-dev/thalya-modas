"use client";
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, Input, Label } from '@store-flow/ui';
import { apiRequest } from '@/src/shared/api/http-client';
import { BrandMark } from '@/src/shared/ui/brand-mark';
import { MutationError } from '@/src/features/backoffice/presentation/shared';
import { useOnboardingStore } from '../../onboarding/application/onboarding-store';
import { clearLastStoreCookie } from '@/src/shared/store/last-store-cookie';
export function RegisterRoute() {
  const router = useRouter(); const client = useQueryClient();
  const reset = useOnboardingStore(state => state.resetDraft);
  const [validation, setValidation] = useState('');
  const registration = useMutation({ mutationFn: (input: { name: string; email: string; password: string }) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(input) }), onSuccess: () => { client.clear(); reset(); clearLastStoreCookie(); router.replace('/onboarding'); router.refresh(); } });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get('password') ?? '');
    if (password !== data.get('confirmation')) { setValidation('As senhas não conferem.'); return; }
    setValidation(''); registration.mutate({ name: String(data.get('name') ?? ''), email: String(data.get('email') ?? '').trim(), password });
  }
  return <main className="grid min-h-screen place-items-center bg-background p-5"><section className="grid w-full max-w-[400px] gap-6"><BrandMark showContext={false} /><Card><CardContent className="grid gap-5 p-6"><header className="space-y-2"><h1 className="text-2xl font-semibold">Crie sua conta</h1><p className="text-sm text-muted-foreground">Depois, configure sua loja e escolha seu plano.</p></header><form onSubmit={submit} className="grid gap-4" aria-busy={registration.isPending}>
    {([['name', 'Nome', 'text', 'name'], ['email', 'E-mail', 'email', 'email'], ['password', 'Senha', 'password', 'new-password'], ['confirmation', 'Confirmar senha', 'password', 'new-password']] as const).map(([name, label, type, autoComplete]) => <div className="grid gap-1.5" key={name}><Label htmlFor={`register-${name}`}>{label}</Label><Input id={`register-${name}`} name={name} type={type} autoComplete={autoComplete} required minLength={type === 'password' ? 8 : name === 'name' ? 2 : undefined} className="h-11" /></div>)}
    <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>{validation && <p role="alert" className="text-sm text-destructive">{validation}</p>}<MutationError error={registration.error} /><Button type="submit" disabled={registration.isPending} className="h-11">{registration.isPending ? 'Criando conta…' : 'Criar conta'}</Button>
  </form><p className="text-center text-sm text-muted-foreground">Já tem uma conta? <Link href="/auth/login" className="text-primary hover:underline">Entrar</Link></p></CardContent></Card></section></main>;
}

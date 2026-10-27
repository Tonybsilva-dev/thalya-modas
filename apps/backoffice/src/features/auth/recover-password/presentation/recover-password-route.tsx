"use client";
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button, Card, CardContent, Input, Label } from '@store-flow/ui';
import { apiRequest } from '@/src/shared/api/http-client';
import { BrandMark } from '@/src/shared/ui/brand-mark';
import { MutationError } from '@/src/features/backoffice/presentation/shared';
import { useRecoveryState } from '../application/recovery-state';
import type { RecoverPasswordStep } from '../domain/recover-password-content';
export function RecoverPasswordRoute({ brandName, step }: { brandName?: string; step: RecoverPasswordStep }) {
  const router = useRouter(); const t = useTranslations('recoverPassword'); const state = useRecoveryState();
  const [remaining, setRemaining] = useState(0); const [validation, setValidation] = useState('');
  useEffect(() => {
    if ((step === 'code' && !state.email) || (step === 'reset' && !state.resetToken)) router.replace('/recover-password');
  }, [step, state.email, state.resetToken, router]);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((state.resendAt - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [state.resendAt]);
  const mutation = useMutation({ mutationFn: async (data: FormData) => {
    if (step === 'request') {
      const email = String(data.get('email') ?? '').trim();
      const result = await apiRequest<{ resendAvailableIn: number }>('/auth/password-recovery/request', { method: 'POST', body: JSON.stringify({ email }) });
      state.update({ email, resetToken: '', resendAt: Date.now() + result.resendAvailableIn * 1000 }); router.push('/recover-password/code');
    } else if (step === 'code') {
      const result = await apiRequest<{ resetToken: string }>('/auth/password-recovery/verify-code', { method: 'POST', body: JSON.stringify({ email: state.email, code: String(data.get('code') ?? '') }) });
      state.update({ resetToken: result.resetToken }); router.push('/recover-password/reset');
    } else if (step === 'reset') {
      await apiRequest('/auth/password-recovery/reset', { method: 'POST', body: JSON.stringify({ resetToken: state.resetToken, password: data.get('password'), passwordConfirmation: data.get('confirmation') }) });
      state.clear(); router.replace('/recover-password/success');
    }
  } });
  const resend = useMutation({ mutationFn: async () => {
    const result = await apiRequest<{ resendAvailableIn: number }>('/auth/password-recovery/resend-code', { method: 'POST', body: JSON.stringify({ email: state.email }) });
    state.update({ resendAt: Date.now() + result.resendAvailableIn * 1000 });
  } });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setValidation(''); const data = new FormData(event.currentTarget);
    if (step === 'reset' && data.get('password') !== data.get('confirmation')) { setValidation('As senhas não conferem.'); return; }
    mutation.mutate(data);
  }
  return <main className="grid min-h-screen place-items-center bg-background px-5 py-8"><section className="grid w-full max-w-[400px] gap-6"><BrandMark name={brandName} showContext={false} /><Card><CardContent className="grid gap-5 p-6"><header className="space-y-2"><h1 className="text-2xl font-semibold">{t(`${step}.title`)}</h1><p className="text-sm text-muted-foreground">{step === 'code' ? `Informe o código de seis dígitos para ${state.email}.` : step === 'request' ? 'Informe o e-mail da sua conta para solicitar a recuperação.' : step === 'success' ? 'Sua senha foi atualizada. Entre novamente para continuar.' : t('reset.description')}</p></header>
    {step !== 'success' && <form onSubmit={submit} className="grid gap-4" aria-busy={mutation.isPending}>
      {step === 'request' && <div className="grid gap-1.5"><Label htmlFor="recovery-email">{t('request.emailLabel')}</Label><Input id="recovery-email" name="email" type="email" autoComplete="email" required className="h-11" /></div>}
      {step === 'code' && <div className="grid gap-1.5"><Label htmlFor="recovery-code">Código</Label><Input id="recovery-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required className="h-11" /></div>}
      {step === 'reset' && <>{(['password', 'confirmation'] as const).map(name => <div className="grid gap-1.5" key={name}><Label htmlFor={`recovery-${name}`}>{t(name === 'password' ? 'reset.passwordLabel' : 'reset.confirmPasswordLabel')}</Label><Input id={`recovery-${name}`} name={name} type="password" autoComplete="new-password" minLength={8} pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}" required className="h-11" /></div>)}<p className="text-xs text-muted-foreground">{t('reset.hint')}</p></>}
      {validation && <p role="alert" className="text-sm text-destructive">{validation}</p>}<MutationError error={mutation.error} /><Button type="submit" disabled={mutation.isPending} className="h-11">{mutation.isPending ? 'Aguarde…' : step === 'request' ? 'Solicitar recuperação' : t(`${step}.primaryAction`)}</Button>
    </form>}
    {(step === 'request' || step === 'code') && <p className="text-xs text-muted-foreground">A entrega de códigos por e-mail ainda não está disponível. A recuperação depende da ativação desse serviço.</p>}
    {step === 'code' && <><Button variant="outline" disabled={remaining > 0 || resend.isPending || mutation.isPending} onClick={() => resend.mutate()}>{remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar código'}</Button>{resend.isSuccess && <p role="status" className="text-xs text-muted-foreground">Nova solicitação registrada.</p>}<MutationError error={resend.error} /></>}
    <Button asChild variant="link"><Link href="/auth/login">{t('shared.backToLogin')}</Link></Button>
  </CardContent></Card></section></main>;
}

import { create } from 'zustand';
// Secrets remain in memory; a reload restarts recovery. Never persist reset tokens.
export const useRecoveryState = create<{ email: string; resetToken: string; resendAt: number; update: (value: Partial<{ email: string; resetToken: string; resendAt: number }>) => void; clear: () => void }>(set => ({ email: '', resetToken: '', resendAt: 0, update: value => set(value), clear: () => set({ email: '', resetToken: '', resendAt: 0 }) }));

import { create } from "zustand";

import type {
  SupplierFormInput,
  SupplierResponsibleInput,
} from "../domain/supplier-flow-schemas";

type SupplierFlowState = {
  assignedResponsibleId?: string;
  responsibleDraft: Partial<SupplierResponsibleInput>;
  responsibles: Array<SupplierResponsibleInput & { id: string }>;
  supplierDraft: Partial<SupplierFormInput>;
  assignResponsible: (responsibleId: string) => void;
  deleteResponsible: (responsibleId: string) => void;
  saveResponsible: (responsible: SupplierResponsibleInput & { id?: string }) => void;
  resetResponsibleDraft: () => void;
  resetSupplierDraft: () => void;
  setResponsibleDraft: (draft: Partial<SupplierResponsibleInput>) => void;
  setSupplierDraft: (draft: Partial<SupplierFormInput>) => void;
};

export const useSupplierFlowStore = create<SupplierFlowState>((set) => ({
  assignedResponsibleId: undefined,
  responsibleDraft: {},
  responsibles: [],
  supplierDraft: {},
  assignResponsible: (responsibleId) =>
    set({ assignedResponsibleId: responsibleId }),
  deleteResponsible: (responsibleId) =>
    set((state) => ({
      assignedResponsibleId:
        state.assignedResponsibleId === responsibleId
          ? undefined
          : state.assignedResponsibleId,
      responsibles: state.responsibles.filter((item) => item.id !== responsibleId),
    })),
  saveResponsible: (responsible) =>
    set((state) => {
      const id = responsible.id ?? crypto.randomUUID();
      const nextResponsible = { ...responsible, id };
      const currentResponsibles = state.responsibles.some((item) => item.id === id)
        ? state.responsibles.map((item) =>
            item.id === id ? nextResponsible : item,
          )
        : [...state.responsibles, nextResponsible];
      const responsibles = nextResponsible.isPrimary
        ? currentResponsibles.map((item) => ({
            ...item,
            isPrimary: item.id === id,
          }))
        : currentResponsibles;
      const assignedResponsibleId = nextResponsible.isPrimary
        ? id
        : state.assignedResponsibleId === id
          ? undefined
          : state.assignedResponsibleId;

      return {
        assignedResponsibleId,
        responsibles,
      };
    }),
  resetResponsibleDraft: () => set({ responsibleDraft: {} }),
  resetSupplierDraft: () => set({ supplierDraft: {} }),
  setResponsibleDraft: (draft) =>
    set((state) => ({
      responsibleDraft: {
        ...state.responsibleDraft,
        ...draft,
      },
    })),
  setSupplierDraft: (draft) =>
    set((state) => ({
      supplierDraft: {
        ...state.supplierDraft,
        ...draft,
      },
    })),
}));

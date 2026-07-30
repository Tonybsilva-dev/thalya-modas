import { create } from "zustand";

export type PurchaseOrderDraftItem = {
  id: string;
  name: string;
  quantity: string;
  sku: string;
  unitCost: string;
};

type PurchaseOrderFlowState = {
  items: PurchaseOrderDraftItem[];
  addItem: () => void;
  removeItem: (itemId: string) => void;
  reset: () => void;
  updateItem: (
    itemId: string,
    input: Partial<Omit<PurchaseOrderDraftItem, "id">>,
  ) => void;
};

function createDraftItem(): PurchaseOrderDraftItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: "",
    sku: "",
    unitCost: "",
  };
}

export const usePurchaseOrderFlowStore = create<PurchaseOrderFlowState>((set) => ({
  items: [createDraftItem()],
  addItem: () => set((state) => ({ items: [...state.items, createDraftItem()] })),
  removeItem: (itemId) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== itemId);

      return { items: items.length > 0 ? items : [createDraftItem()] };
    }),
  reset: () => set({ items: [createDraftItem()] }),
  updateItem: (itemId, input) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, ...input } : item,
      ),
    })),
}));

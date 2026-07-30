import { z } from "zod";

import {
  supplierCategoryOptions,
  supplierTermOptions,
} from "./supplier-options";

const optionalText = z.string().trim().optional();

export const supplierFormSchema = z.object({
  category: z.enum(supplierCategoryOptions),
  contactName: optionalText,
  deliveryTerm: z.enum(supplierTermOptions),
  document: z.string().trim().min(14, "Informe um CNPJ valido."),
  email: z.string().trim().email("Informe um e-mail valido."),
  minimumOrder: z.string().trim().min(1, "Informe o pedido minimo."),
  name: z.string().trim().min(2, "Informe o nome fantasia."),
  notes: optionalText,
  paymentTerm: z.enum(supplierTermOptions),
  phone: z.string().trim().min(14, "Informe um telefone valido."),
  status: z.enum(["active", "inactive"]),
});

export const supplierResponsibleSchema = z.object({
  contactType: z.enum(["orders", "delivery", "financial"]),
  email: z.string().trim().email("Informe um e-mail valido."),
  isPrimary: z.boolean(),
  name: z.string().trim().min(2, "Informe o nome do responsavel."),
  phone: z.string().trim().min(14, "Informe um telefone valido."),
  role: z.string().trim().min(2, "Informe o cargo."),
  status: z.enum(["active", "inactive"]),
});

const numberFromInput = z
  .string()
  .trim()
  .min(1, "Informe um valor.")
  .transform((value) => Number(value.replace(/\./g, "").replace(",", ".")))
  .pipe(z.number().finite().nonnegative("Informe um valor valido."));

const positiveIntegerFromInput = z
  .string()
  .trim()
  .min(1, "Informe a quantidade.")
  .transform((value) => Number(value))
  .pipe(z.number().int().positive("Informe uma quantidade valida."));

export const purchaseOrderFormSchema = z.object({
  expectedDeliveryAt: z.string().trim().min(1, "Informe a previsao de entrega."),
  invoiceNumber: optionalText,
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().trim().min(2, "Informe o item."),
        productId: z.string().uuid().optional(),
        quantity: positiveIntegerFromInput,
        sku: z.string().trim().min(2, "Informe o SKU."),
        unitCost: numberFromInput,
      }),
    )
    .min(1, "Adicione pelo menos um item."),
  notes: optionalText,
  paymentTerm: z.enum(supplierTermOptions),
  status: z.enum(["draft", "confirmed"]),
  supplierId: z.string().uuid("Selecione um fornecedor."),
});

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;
export type PurchaseOrderFormInput = z.infer<typeof purchaseOrderFormSchema>;
export type SupplierResponsibleInput = z.infer<typeof supplierResponsibleSchema>;

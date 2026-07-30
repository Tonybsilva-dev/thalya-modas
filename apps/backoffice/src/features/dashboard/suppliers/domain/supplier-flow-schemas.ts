import { z } from "zod";

import {
  supplierCategoryOptions,
  supplierTermOptions,
} from "./supplier-options";

const optionalText = z.string().trim().optional();
const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => [10, 11].includes(value.replace(/\D/g, "").length),
    "Informe um telefone valido.",
  );

export const supplierFormSchema = z.object({
  category: z.enum(supplierCategoryOptions),
  contactName: optionalText,
  deliveryTerm: z.enum(supplierTermOptions),
  document: z
    .string()
    .trim()
    .refine(isValidCnpj, "Informe um CNPJ valido."),
  email: z.string().trim().email("Informe um e-mail valido."),
  minimumOrder: z
    .string()
    .trim()
    .refine(
      (value) => Number(value.replace(/\D/g, "")) > 0,
      "Informe o pedido minimo.",
    ),
  name: z.string().trim().min(2, "Informe o nome fantasia."),
  notes: optionalText,
  paymentTerm: z.enum(supplierTermOptions),
  phone: phoneSchema,
  status: z.enum(["active", "inactive"]),
});

export const supplierResponsibleSchema = z.object({
  contactType: z.enum(["orders", "delivery", "financial"]),
  email: z.string().trim().email("Informe um e-mail valido."),
  isPrimary: z.boolean(),
  name: z.string().trim().min(2, "Informe o nome do responsavel."),
  phone: phoneSchema,
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

function isValidCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;

  const calculateDigit = (length: number) => {
    let factor = length - 7;
    let total = 0;
    for (let index = 0; index < length; index += 1) {
      total += Number(digits[index]) * factor;
      factor -= 1;
      if (factor === 1) factor = 9;
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    calculateDigit(12) === Number(digits[12]) &&
    calculateDigit(13) === Number(digits[13])
  );
}

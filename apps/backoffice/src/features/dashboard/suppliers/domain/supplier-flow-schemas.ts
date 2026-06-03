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

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;
export type SupplierResponsibleInput = z.infer<typeof supplierResponsibleSchema>;

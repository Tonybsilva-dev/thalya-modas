import { z } from "zod";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const storeProfileSchema = z.object({
  storeName: z.string().trim().min(2, "Nome da loja deve ter pelo menos 2 caracteres."),
  phone: z
    .string()
    .transform(digitsOnly)
    .refine((value) => value.length >= 10 && value.length <= 11, {
      message: "Telefone deve conter 10 ou 11 digitos.",
    }),
  document: z
    .string()
    .transform(digitsOnly)
    .refine((value) => value.length === 11 || value.length === 14, {
      message: "Documento deve conter CPF ou CNPJ valido.",
    }),
  segment: z.enum(["fashion", "accessories", "footwear", "mixed"], {
    message: "Selecione um segmento.",
  }),
});

export const storeAddressSchema = z.object({
  zipCode: z
    .string()
    .transform(digitsOnly)
    .refine((value) => value.length === 8, {
      message: "CEP deve conter 8 digitos.",
    }),
  street: z.string().trim().min(1, "Rua e obrigatoria."),
  number: z.string().trim().min(1, "Numero e obrigatorio."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(1, "Bairro e obrigatorio."),
  city: z.string().trim().min(1, "Cidade e obrigatoria."),
  state: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), {
      message: "UF deve conter 2 letras.",
    }),
  country: z.string().trim().default("BR"),
});

export const storePreferencesSchema = z
  .object({
    currency: z.enum(["BRL"]),
    language: z.enum(["pt-BR", "en", "es"]),
    timezone: z.enum(["America/Fortaleza", "America/Sao_Paulo"]),
    openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
      message: "Horario de abertura invalido.",
    }),
    closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
      message: "Horario de fechamento invalido.",
    }),
  })
  .refine((value) => toMinutes(value.openingTime) < toMinutes(value.closingTime), {
    message: "Horario de abertura deve ser anterior ao fechamento.",
    path: ["closingTime"],
  });

export type StoreProfileInput = z.infer<typeof storeProfileSchema>;
export type StoreAddressInput = z.infer<typeof storeAddressSchema>;
export type StorePreferencesInput = z.infer<typeof storePreferencesSchema>;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

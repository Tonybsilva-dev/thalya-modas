export type CepAddress = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export async function lookupAddressByCep(zipCode: string): Promise<CepAddress | null> {
  const digits = zipCode.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;

  const payload = (await response.json()) as ViaCepResponse;
  if (payload.erro) return null;

  return {
    zipCode: digits,
    street: payload.logradouro ?? "",
    neighborhood: payload.bairro ?? "",
    city: payload.localidade ?? "",
    state: payload.uf ?? "",
  };
}

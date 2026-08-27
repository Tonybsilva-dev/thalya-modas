import { useQuery } from "@tanstack/react-query";

import { ApiRequestError, apiRequest } from "@/src/shared/api/http-client";
import { convertImageFileToWebp } from "@/src/shared/files/image-to-webp";

export type ProductInventoryControl = "tracked" | "untracked";

export type ProductImage = {
  contentType: "image/webp";
  createdAt: string;
  fileName: string;
  id: string;
  key: string;
  productId: string;
  publicUrl?: string;
  size: number;
};

export type Product = {
  barcode?: string;
  costPrice?: number;
  createdAt: string;
  currentStock: number;
  description?: string;
  id: string;
  images: ProductImage[];
  inventoryControl: ProductInventoryControl;
  minimumStock: number;
  name: string;
  salePrice?: number;
  sku: string;
  status: "active" | "inactive";
  supplierId?: string;
  updatedAt: string;
};

export type ProductInput = {
  barcode?: string;
  costPrice?: number;
  currentStock?: number;
  description?: string;
  inventoryControl: ProductInventoryControl;
  minimumStock?: number;
  name: string;
  salePrice?: number;
  status?: Product["status"];
  supplierId?: string;
};

export function useProductsQuery(query: { q?: string; page?: number; perPage?: number } = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  params.set("page", String(query.page ?? 1));
  params.set("perPage", String(query.perPage ?? 100));

  return useQuery({
    placeholderData: (previous) => previous,
    queryKey: ["products", query],
    queryFn: () => apiRequest<Product[]>(`/products?${params.toString()}`),
    staleTime: 30_000,
  });
}

export function getProduct(productId: string) {
  return apiRequest<Product>(`/products/${productId}`);
}

export async function findProductByBarcode(barcode: string) {
  try {
    return await apiRequest<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export function createProduct(input: ProductInput) {
  return apiRequest<Product>("/products", {
    body: JSON.stringify(toProductPayload(input)),
    method: "POST",
  });
}

export function updateProduct(productId: string, input: ProductInput) {
  return apiRequest<Product>(`/products/${productId}`, {
    body: JSON.stringify(toProductPayload(input)),
    method: "PATCH",
  });
}

export async function uploadProductImage(productId: string, source: File) {
  const file = await convertImageFileToWebp(source);
  const prepared = await apiRequest<{
    asset: ProductImage;
    upload: {
      headers: Record<string, string>;
      method: "PUT";
      url: string;
    };
  }>(`/products/${productId}/assets/upload`, {
    body: JSON.stringify({
      contentType: "image/webp",
      fileName: file.name,
      size: file.size,
    }),
    method: "POST",
  });
  try {
    const response = await fetch(prepared.upload.url, {
      body: file,
      headers: prepared.upload.headers,
      method: prepared.upload.method,
    });

    if (!response.ok) throw new Error("Falha no envio da imagem.");
  } catch {
    await apiRequest<void>(
      `/products/${productId}/assets/${prepared.asset.id}`,
      { method: "DELETE" },
    ).catch(() => undefined);
    throw new Error("O produto foi salvo, mas não foi possível enviar uma das fotos.");
  }

  return prepared.asset;
}

function toProductPayload(input: ProductInput) {
  const isTracked = input.inventoryControl === "tracked";
  return {
    barcode: input.barcode?.trim() || undefined,
    costPrice: input.costPrice,
    currentStock: isTracked ? input.currentStock : 0,
    description: input.description?.trim() || undefined,
    inventoryControl: input.inventoryControl,
    minimumStock: isTracked ? input.minimumStock : 0,
    name: input.name.trim(),
    salePrice: input.salePrice,
    status: input.status,
    supplierId: input.supplierId || undefined,
  };
}

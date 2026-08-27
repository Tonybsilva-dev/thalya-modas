"use client";

import type { FormEvent, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import {
  ArrowLeft,
  Barcode,
  Camera,
  FloppyDisk,
  ImageSquare,
  Info,
  Package,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@thalya-modas/ui";

import { ApiRequestError } from "@/src/shared/api/http-client";
import {
  listAllSuppliers,
  type Supplier,
} from "@/src/features/dashboard/suppliers/application/suppliers-api";

import { DashboardShell } from "../../shared/presentation/dashboard-shell";
import {
  createProduct,
  findProductByBarcode,
  getProduct,
  type Product,
  type ProductInput,
  updateProduct,
  uploadProductImage,
} from "../application/products-api";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";

type ProductFormValues = {
  barcode: string;
  costPrice: string;
  currentStock: string;
  description: string;
  inventoryControl: ProductInput["inventoryControl"];
  minimumStock: string;
  name: string;
  salePrice: string;
  sku: string;
  status: Product["status"];
  supplierId: string;
};

const emptyValues: ProductFormValues = {
  barcode: "",
  costPrice: "",
  currentStock: "0",
  description: "",
  inventoryControl: "tracked",
  minimumStock: "0",
  name: "",
  salePrice: "",
  sku: "",
  status: "active",
  supplierId: "none",
};

function useInventoryBasePath() {
  const params = useParams<{ role?: string }>();
  return `/${params.role ?? "manager"}/dashboard/inventory`;
}

function productToValues(product: Product): ProductFormValues {
  return {
    barcode: product.barcode ?? "",
    costPrice: product.costPrice?.toString() ?? "",
    currentStock: product.currentStock.toString(),
    description: product.description ?? "",
    inventoryControl: product.inventoryControl,
    minimumStock: product.minimumStock.toString(),
    name: product.name,
    salePrice: product.salePrice?.toString() ?? "",
    sku: product.sku,
    status: product.status,
    supplierId: product.supplierId ?? "none",
  };
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInput(values: ProductFormValues): ProductInput {
  return {
    barcode: values.barcode || undefined,
    costPrice: toOptionalNumber(values.costPrice),
    currentStock: toOptionalNumber(values.currentStock),
    description: values.description || undefined,
    inventoryControl: values.inventoryControl,
    minimumStock: toOptionalNumber(values.minimumStock),
    name: values.name,
    salePrice: toOptionalNumber(values.salePrice),
    status: values.status,
    supplierId: values.supplierId === "none" ? undefined : values.supplierId,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) return error.payload.userMessage;
  if (error instanceof Error) return error.message;
  return "Não foi possível salvar o produto.";
}

function ProductBreadcrumb({ basePath, isEdit }: { basePath: string; isEdit: boolean }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1.5 text-xs font-semibold">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={basePath}>
              Estoque
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{isEdit ? "Editar produto" : "Novo produto"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Field({
  children,
  hint,
  id,
  label,
  required,
}: {
  children: React.ReactNode;
  hint?: string;
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>
        {label}{required ? " *" : ""}
      </Label>
      {children}
      {hint && <p className="text-xs leading-5 text-muted-foreground" id={`${id}-description`}>{hint}</p>}
    </div>
  );
}

export function ProductCreateRoute() {
  const [barcode] = useQueryState("barcode");
  return <ProductFlow initialBarcode={barcode ?? ""} />;
}

export function ProductEditRoute() {
  const params = useParams<{ productId: string }>();
  const [uploadError] = useQueryState("uploadError");
  return <ProductFlow initialPhotoError={uploadError === "1"} productId={params.productId} />;
}

function ProductFlow({
  initialBarcode = "",
  initialPhotoError = false,
  productId,
}: {
  initialBarcode?: string;
  initialPhotoError?: boolean;
  productId?: string;
}) {
  const basePath = useInventoryBasePath();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(productId);
  const [editedValues, setEditedValues] = useState<ProductFormValues | null>(
    isEdit ? null : { ...emptyValues, barcode: initialBarcode },
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>();
  const [checkingBarcode, setCheckingBarcode] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(
    initialPhotoError
      ? "O produto foi salvo, mas uma ou mais fotos não foram enviadas. Selecione-as novamente para tentar o upload."
      : undefined,
  );
  const [savedWithPhotoError, setSavedWithPhotoError] = useState(initialPhotoError);
  const productQuery = useQuery({
    enabled: isEdit,
    queryKey: ["products", productId],
    queryFn: () => getProduct(productId as string),
  });
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "product-options"],
    queryFn: () => listAllSuppliers({ status: "active" }),
    staleTime: 60_000,
  });

  const loadedValues = productQuery.data
    ? productToValues(productQuery.data)
    : { ...emptyValues, barcode: initialBarcode };
  const values = editedValues ?? loadedValues;

  function setFormValues(action: SetStateAction<ProductFormValues>) {
    setEditedValues((current) => {
      const base = current ?? loadedValues;
      return typeof action === "function" ? action(base) : action;
    });
  }

  const previews = useMemo(
    () => photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [photos],
  );
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  async function checkBarcode(code: string) {
    const normalized = code.trim().toUpperCase();
    setValue("barcode", normalized);
    setExistingProduct(undefined);
    if (normalized.length < 4) return;
    setCheckingBarcode(true);
    try {
      const found = await findProductByBarcode(normalized);
      setExistingProduct(found?.id === productId ? null : found);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setCheckingBarcode(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const input = toInput(values);
      const product = productId
        ? await updateProduct(productId, input)
        : await createProduct(input);
      const results = await Promise.allSettled(
        photos.map((photo) => uploadProductImage(product.id, photo)),
      );
      return {
        photoFailed: results.some((result) => result.status === "rejected"),
        product,
      };
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
      window.scrollTo({ behavior: "smooth", top: 0 });
    },
    onSuccess: async ({ photoFailed, product }) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      if (photoFailed) {
        setSavedWithPhotoError(true);
        setFormError("O produto foi salvo, mas uma ou mais fotos não foram enviadas. Você pode tentar novamente na edição.");
        router.replace(`${basePath}/products/${product.id}/edit?uploadError=1`);
        window.scrollTo({ behavior: "smooth", top: 0 });
        return;
      }
      router.push(`${basePath}?selected=${product.id}`);
    },
  });

  function setValue<Key extends keyof ProductFormValues>(key: Key, value: ProductFormValues[Key]) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    if (values.name.trim().length < 2) {
      setFormError("Informe o nome do produto.");
      window.scrollTo({ behavior: "smooth", top: 0 });
      return;
    }
    if (existingProduct) {
      setFormError("Este código de barras já pertence a outro produto.");
      window.scrollTo({ behavior: "smooth", top: 0 });
      return;
    }
    mutation.mutate();
  }

  const isTracked = values.inventoryControl === "tracked";
  const isLoading = isEdit && productQuery.isLoading;
  const currentImages = productQuery.data?.images ?? [];

  return (
    <DashboardShell activeItem="Inventory" operatorRole="Gestão de catálogo" status="Produtos e estoque">
      <ProductBreadcrumb basePath={basePath} isEdit={isEdit} />

      <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid min-w-0 gap-1.5">
          <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-[28px]">
            {isEdit ? "Editar produto" : "Cadastrar produto"}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Identifique o item, defina como o estoque será tratado e associe suas fotos e fornecedor.
          </p>
        </div>
        <Button asChild className="h-10 self-start" variant="outline">
          <Link href={basePath}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar ao estoque
          </Link>
        </Button>
      </header>

      {formError && (
        <Alert role="alert" variant={savedWithPhotoError ? "warning" : "destructive"}>
          <WarningCircle aria-hidden="true" />
          <div>
            <AlertTitle>{savedWithPhotoError ? "Produto salvo com ressalva" : "Revise o cadastro"}</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Carregando produto…</CardContent></Card>
      ) : (
        <form className="grid min-w-0 gap-5" onSubmit={handleSubmit}>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid min-w-0 gap-5">
              <Card>
                <CardContent className="grid gap-5 p-4 sm:p-6">
                  <div className="grid gap-1">
                    <h2 className="text-lg font-semibold text-foreground">Identificação</h2>
                    <p className="text-sm text-muted-foreground">Dados usados na busca, etiqueta e venda.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field id="product-name" label="Nome do produto" required>
                      <Input
                        autoFocus={!isEdit}
                        id="product-name"
                        maxLength={120}
                        onChange={(event) => setValue("name", event.target.value)}
                        placeholder="Ex.: Vestido midi canelado"
                        required
                        value={values.name}
                      />
                    </Field>
                    <Field
                      hint={isEdit ? "Identificador interno permanente. Ele não pode ser alterado." : "Será criado automaticamente e permanecerá o mesmo durante toda a vida do produto."}
                      id="product-sku"
                      label="SKU interno"
                    >
                      <Input
                        aria-describedby="product-sku-description"
                        className="font-mono"
                        disabled
                        id="product-sku"
                        placeholder="Gerado automaticamente ao salvar"
                        readOnly
                        value={values.sku}
                      />
                    </Field>
                  </div>
                  <Field
                    hint="Use a câmera, um leitor USB ou informe o número presente na etiqueta."
                    id="product-barcode"
                    label="Código de barras"
                  >
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="relative">
                        <Barcode aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          autoComplete="off"
                          className="pl-10"
                          id="product-barcode"
                          inputMode="numeric"
                          onBlur={() => void checkBarcode(values.barcode)}
                          onChange={(event) => {
                            setValue("barcode", event.target.value.toUpperCase());
                            setExistingProduct(undefined);
                          }}
                          placeholder="Ex.: 7891234567890"
                          value={values.barcode}
                        />
                      </div>
                      <Button className="h-10" onClick={() => setScannerOpen(true)} type="button" variant="secondary">
                        <Camera aria-hidden="true" className="size-4" />
                        Escanear
                      </Button>
                    </div>
                    {checkingBarcode && <p className="text-xs text-muted-foreground">Verificando código…</p>}
                    {existingProduct && (
                      <Alert variant="warning">
                        <Info aria-hidden="true" />
                        <AlertDescription>
                          Código já usado por <strong>{existingProduct.name}</strong>.{" "}
                          <Link className="font-semibold underline underline-offset-4" href={`${basePath}/products/${existingProduct.id}/edit`}>
                            Abrir produto
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}
                  </Field>
                  <Field id="product-description" label="Descrição">
                    <Textarea
                      id="product-description"
                      maxLength={500}
                      onChange={(event) => setValue("description", event.target.value)}
                      placeholder="Modelo, material, cor ou observações úteis para a equipe."
                      rows={4}
                      value={values.description}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="grid gap-5 p-4 sm:p-6">
                  <div className="grid gap-1">
                    <h2 className="text-lg font-semibold text-foreground">Compra e venda</h2>
                    <p className="text-sm text-muted-foreground">Vincule o fornecedor e registre os valores de referência.</p>
                  </div>
                  <Field id="product-supplier" label="Fornecedor">
                    <Select onValueChange={(value) => setValue("supplierId", value)} value={values.supplierId}>
                      <SelectTrigger id="product-supplier"><SelectValue placeholder="Sem fornecedor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem fornecedor associado</SelectItem>
                        {(suppliersQuery.data ?? []).map((supplier: Supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="product-cost" label="Custo de referência">
                      <Input id="product-cost" min="0" onChange={(event) => setValue("costPrice", event.target.value)} placeholder="0,00" step="0.01" type="number" value={values.costPrice} />
                    </Field>
                    <Field id="product-sale" label="Preço de venda">
                      <Input id="product-sale" min="0" onChange={(event) => setValue("salePrice", event.target.value)} placeholder="0,00" step="0.01" type="number" value={values.salePrice} />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="grid gap-5 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-1">
                      <h2 className="text-lg font-semibold text-foreground">Controle de estoque</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Desative para itens avulsos que podem ser vendidos sem limite de saldo.
                      </p>
                    </div>
                    <Switch
                      aria-label="Controlar estoque deste produto"
                      checked={isTracked}
                      onCheckedChange={(checked) =>
                        setFormValues((current) => ({
                          ...current,
                          currentStock: checked ? current.currentStock : "0",
                          inventoryControl: checked ? "tracked" : "untracked",
                          minimumStock: checked ? current.minimumStock : "0",
                        }))
                      }
                    />
                  </div>
                  {isTracked ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field hint={isEdit ? "Alterações futuras deverão ser feitas por movimentação de estoque." : "Saldo registrado na criação do cadastro."} id="product-current-stock" label={isEdit ? "Saldo atual" : "Estoque inicial"}>
                        <Input disabled={isEdit} id="product-current-stock" min="0" onChange={(event) => setValue("currentStock", event.target.value)} step="1" type="number" value={values.currentStock} />
                      </Field>
                      <Field id="product-minimum-stock" label="Estoque mínimo">
                        <Input id="product-minimum-stock" min="0" onChange={(event) => setValue("minimumStock", event.target.value)} step="1" type="number" value={values.minimumStock} />
                      </Field>
                    </div>
                  ) : (
                    <Alert variant="default">
                      <Info aria-hidden="true" />
                      <AlertDescription>
                        O produto aparecerá como <strong>(U) {values.name || "Nome do produto"}</strong>. As vendas serão registradas sem reduzir estoque ou gerar alertas de reposição.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="grid min-w-0 content-start gap-5">
              <Card>
                <CardContent className="grid gap-4 p-4 sm:p-5">
                  <div className="grid gap-1">
                    <h2 className="text-lg font-semibold text-foreground">Fotos</h2>
                    <p className="text-sm leading-6 text-muted-foreground">Até 5 imagens. Elas serão otimizadas em WebP.</p>
                  </div>
                  <label className="grid min-h-36 cursor-pointer place-items-center border border-dashed border-border bg-muted/30 p-5 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-within:ring-2 focus-within:ring-ring">
                    <input
                      accept="image/*"
                      className="sr-only"
                      multiple
                      onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, 5))}
                      type="file"
                    />
                    <span className="grid justify-items-center gap-2 text-sm text-muted-foreground">
                      <UploadSimple aria-hidden="true" className="size-6" />
                      <strong className="text-foreground">Selecionar ou fotografar</strong>
                      PNG, JPEG ou WebP
                    </span>
                  </label>
                  {(currentImages.length > 0 || previews.length > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      {currentImages.map((image) => (
                        <div
                          aria-label={`Foto cadastrada de ${values.name}`}
                          className="aspect-square border border-border bg-muted bg-cover bg-center"
                          key={image.id}
                          role="img"
                          style={image.publicUrl?.startsWith("http") ? { backgroundImage: `url(${image.publicUrl})` } : undefined}
                        >
                          {!image.publicUrl?.startsWith("http") && <ImageSquare aria-hidden="true" className="m-auto mt-[40%] size-6 text-muted-foreground" />}
                        </div>
                      ))}
                      {previews.map((preview) => (
                        <div aria-label={`Nova foto ${preview.file.name}`} className="aspect-square border border-primary bg-cover bg-center" key={preview.url} role="img" style={{ backgroundImage: `url(${preview.url})` }} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="grid gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center bg-muted text-muted-foreground">
                      {isTracked ? <Package aria-hidden="true" className="size-5" /> : <span className="font-semibold">U</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{isTracked ? values.name || "Produto controlado" : `(U) ${values.name || "Produto avulso"}`}</p>
                      <p className="truncate text-xs text-muted-foreground">{values.sku || "SKU gerado ao salvar"}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Tipo</span><strong>{isTracked ? "Estoque controlado" : "Sem controle"}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Status</span><strong>{values.status === "active" ? "Ativo" : "Inativo"}</strong></div>
                  </div>
                  {isEdit && (
                    <Field id="product-status" label="Status do cadastro">
                      <Select onValueChange={(value) => setValue("status", value as Product["status"])} value={values.status}>
                        <SelectTrigger id="product-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-border bg-background/95 p-4 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end">
            <Button asChild className="h-11" variant="outline"><Link href={basePath}>Cancelar</Link></Button>
            <Button className="h-11" disabled={mutation.isPending || Boolean(existingProduct)} type="submit">
              {mutation.isPending ? <span>Salvando…</span> : <><FloppyDisk aria-hidden="true" className="size-4" />{isEdit ? "Salvar alterações" : "Cadastrar produto"}</>}
            </Button>
          </div>
        </form>
      )}

      <BarcodeScannerDialog onCode={(code) => void checkBarcode(code)} onOpenChange={setScannerOpen} open={scannerOpen} />
    </DashboardShell>
  );
}

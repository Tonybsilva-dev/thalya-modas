"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import {
  ArrowLeft,
  CurrencyDollar,
  EnvelopeSimple,
  FloppyDisk,
  Hash,
  Info,
  Phone,
  Plus,
  Storefront,
  Trash,
  UserPlus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@thalya-modas/ui";
import { z } from "zod";

import { ApiRequestError } from "@/src/shared/api/http-client";
import { normalizeLocale } from "@/src/shared/i18n/locales";
import { MaskedInput } from "@/src/shared/ui/masked-input";

import {
  createSupplierResponsible,
  createSupplier,
  deleteSupplier,
  deleteSupplierResponsible,
  getSupplier,
  listPurchaseOrders,
  listReceivings,
  listSupplierResponsibles,
  type PurchaseOrder,
  type Receiving,
  type Supplier,
  updateSupplierResponsible,
  updateSupplier,
} from "../application/suppliers-api";
import { useSupplierFlowStore } from "../application/supplier-flow-store";
import {
  supplierFormSchema,
  supplierResponsibleSchema,
  type SupplierFormInput,
  type SupplierResponsibleInput,
} from "../domain/supplier-flow-schemas";
import {
  supplierCategoryOptions,
  supplierTermOptions,
  type SupplierCategory,
  type SupplierTerm,
} from "../domain/supplier-options";
import { suppliersContentByLocale } from "../domain/suppliers-content";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";

type FieldErrors = Record<string, string>;
type IconComponent = ComponentType<{ className?: string }>;

const supplierDefaults: SupplierFormInput = {
  category: "women_fashion",
  deliveryTerm: "+7",
  document: "",
  email: "",
  minimumOrder: "",
  name: "",
  notes: "",
  paymentTerm: "+30",
  phone: "",
  status: "active",
};

const supplierPlaceholders = {
  document: "12.345.678/0001-90",
  email: "compras@modabrasil.com",
  minimumOrder: "R$ 1.500,00",
  name: "Moda Brasil Atacado",
  notes: "Fornecedor ativo com pedidos abertos e historico de compras.",
  phone: "(85) 98888-1200",
};

function useSupplierBasePath() {
  const params = useParams<{ role?: string }>();
  const role = params.role ?? "manager";

  return `/${role}/dashboard/suppliers`;
}

function useSupplierShellContent() {
  return suppliersContentByLocale[normalizeLocale(useLocale())];
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return error.payload.userMessage ?? error.payload.message ?? fallback;
  }

  return fallback;
}

const supplierModalParser = parseAsStringLiteral([
  "delete",
  "responsible",
] as const);

function getFormData(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function getZodErrors(error: z.ZodError) {
  return error.issues.reduce<FieldErrors>((acc, issue) => {
    const key = String(issue.path[0] ?? "");
    if (key && !acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

function isUuid(value: string) {
  return z.string().uuid().safeParse(value).success;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SupplierCreateRoute() {
  return <SupplierFormRoute mode="create" />;
}

export function SupplierEditRoute() {
  return <SupplierFormRoute mode="edit" />;
}

function SupplierFormRoute({ mode }: { mode: "create" | "edit" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const basePath = useSupplierBasePath();
  const params = useParams<{ supplierId?: string }>();
  const content = useSupplierShellContent();
  const t = useTranslations("dashboard.suppliers.flow");
  const assignedResponsibleId = useSupplierFlowStore((state) => state.assignedResponsibleId);
  const localResponsibles = useSupplierFlowStore((state) => state.responsibles);
  const setSupplierDraft = useSupplierFlowStore((state) => state.setSupplierDraft);
  const resetFlow = useSupplierFlowStore((state) => state.resetFlow);
  const [section, setSection] = useQueryState("section", parseAsString.withDefault("data"));
  const [modal, setModal] = useQueryState("modal", supplierModalParser);
  const [categoryOverride, setCategory] = useState<SupplierCategory>();
  const [deliveryTermOverride, setDeliveryTerm] = useState<SupplierTerm>();
  const [paymentTermOverride, setPaymentTerm] = useState<SupplierTerm>();
  const [statusOverride, setStatus] =
    useState<SupplierFormInput["status"]>();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formAlertRef = useRef<HTMLDivElement>(null);
  const isEdit = mode === "edit";
  const supplierId = params.supplierId;
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const supplierQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId],
    queryFn: () => getSupplier(supplierId as string),
  });
  const responsiblesQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId, "responsibles"],
    queryFn: () => listSupplierResponsibles(supplierId as string),
  });
  const ordersQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["purchase-orders", "supplier", supplierId],
    queryFn: () =>
      listPurchaseOrders({ page: 1, perPage: 100, supplierId }),
  });
  const receivingsQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["receivings", "supplier", supplierId],
    queryFn: () => listReceivings({ page: 1, perPage: 100, supplierId }),
  });
  const responsibles = responsiblesQuery.data ?? localResponsibles;
  const primaryResponsibleId =
    responsibles.find((responsible) => responsible.id === assignedResponsibleId)?.id ??
    responsibles.find((responsible) => responsible.isPrimary)?.id;
  const assignedResponsible = responsibles.find(
    (responsible) => responsible.id === primaryResponsibleId,
  );
  const persistedSupplier = supplierQuery.data;
  const category =
    categoryOverride ??
    persistedSupplier?.category ??
    supplierDefaults.category;
  const deliveryTerm =
    deliveryTermOverride ??
    persistedSupplier?.deliveryTerm ??
    supplierDefaults.deliveryTerm;
  const paymentTerm =
    paymentTermOverride ??
    persistedSupplier?.paymentTerm ??
    supplierDefaults.paymentTerm;
  const status =
    statusOverride ?? persistedSupplier?.status ?? supplierDefaults.status;

  useEffect(() => {
    if (mode === "create") resetFlow();
  }, [mode, resetFlow]);

  const values = {
    ...supplierDefaults,
    ...(persistedSupplier ?? {}),
    category,
    contactName: assignedResponsible?.name,
    deliveryTerm,
    paymentTerm,
    status,
  };

  const mutation = useMutation({
    mutationFn: async (input: SupplierFormInput) => {
      if (isEdit && supplierId && isUuid(supplierId)) {
        const supplier = await updateSupplier({ ...input, supplierId });
        return { responsibleFailures: 0, supplier };
      }

      if (isEdit) {
        throw new Error("Invalid supplier identifier.");
      }

      const supplier = await createSupplier(input);
      const responsibleResults = await Promise.allSettled(
        localResponsibles.map((responsible) =>
          createSupplierResponsible(supplier.id, responsible),
        ),
      );
      return {
        responsibleFailures: responsibleResults.filter(
          (result) => result.status === "rejected",
        ).length,
        supplier,
      };
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, t("errors.save")));
      revealFormAlert();
    },
    onSuccess: ({ responsibleFailures, supplier }) => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      resetFlow();
      const notice = isEdit
        ? "updated"
        : responsibleFailures > 0
          ? "createdPartial"
          : "created";
      router.push(`${basePath}?notice=${notice}&supplier=${supplier.id}`);
    },
  });

  function handleDraftChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (!isEdit) {
      setSupplierDraft({ [target.name]: target.value });
    }
    clearFieldError(target.name);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = supplierFormSchema.safeParse({
      ...getFormData(event.currentTarget),
      status,
    });

    if (!result.success) {
      setErrors(getZodErrors(result.error));
      revealFormAlert();
      return;
    }

    setErrors({});
    mutation.mutate(result.data);
  }

  function clearFieldError(field: string) {
    setFormError(null);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function revealFormAlert() {
    requestAnimationFrame(() => {
      formAlertRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      formAlertRef.current?.focus({ preventScroll: true });
    });
  }

  if (isEdit && !isPersistedSupplier) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={t("errors.invalidId")}
        title={t("errors.notFound")}
      />
    );
  }

  if (isEdit && supplierQuery.isPending) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={t("loadingDescription")}
        loading
        title={t("loading")}
      />
    );
  }

  if (isEdit && supplierQuery.isError) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={getApiErrorMessage(supplierQuery.error, t("errors.load"))}
        onRetry={() => void supplierQuery.refetch()}
        title={t("errors.notFound")}
      />
    );
  }

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={content.sidebar.operatorRole}
      status={content.sidebar.status}
    >
      <>
        <form
          key={persistedSupplier?.updatedAt ?? mode}
          className="grid gap-5"
          onChange={handleDraftChange}
          onSubmit={handleSubmit}
        >
          <SupplierFormHeader
            basePath={basePath}
            isPending={mutation.isPending}
            mode={mode}
            section={section}
            setSection={setSection}
          />

          {formError || Object.keys(errors).length > 0 ? (
            <div
              ref={formAlertRef}
              aria-live="assertive"
              className="flex items-start gap-3 border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              role="alert"
              tabIndex={-1}
            >
              <WarningCircle className="mt-0.5 size-5 shrink-0" />
              <div className="grid gap-1">
                <h2 className="text-sm font-bold">
                  {formError
                    ? t("errors.saveTitle")
                    : t("errors.validationTitle")}
                </h2>
                <p className="text-sm leading-5">
                  {formError ??
                    t("errors.validationDescription", {
                      count: Object.keys(errors).length,
                    })}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-5">
              <SupplierDataCard
                assignedResponsible={assignedResponsible}
                errors={errors}
                onCategoryChange={(value) => {
                  if (!isEdit) setSupplierDraft({ category: value });
                  setCategory(value);
                  clearFieldError("category");
                }}
                values={values}
              />
              <SupplierCommercialCard
                errors={errors}
                onDeliveryTermChange={(value) => {
                  if (!isEdit) setSupplierDraft({ deliveryTerm: value });
                  setDeliveryTerm(value);
                  clearFieldError("deliveryTerm");
                }}
                onPaymentTermChange={(value) => {
                  if (!isEdit) setSupplierDraft({ paymentTerm: value });
                  setPaymentTerm(value);
                  clearFieldError("paymentTerm");
                }}
                onStatusChange={(value) => {
                  setStatus(value);
                  clearFieldError("status");
                }}
                status={status}
                values={values}
              />
              <SupplierNotesCard errors={errors} values={values} />
            </div>

            {isEdit ? (
              <SupplierPerformanceRail
                orders={(ordersQuery.data ?? []).filter(
                  (order) => order.supplierId === supplierId,
                )}
                onOpenDelete={() => void setModal("delete")}
                onOpenResponsible={() => void setModal("responsible")}
                receivings={(receivingsQuery.data ?? []).filter(
                  (receiving) => receiving.supplierId === supplierId,
                )}
                supplier={persistedSupplier}
              />
            ) : (
              <SupplierCreateSummary
                onOpenResponsible={() => void setModal("responsible")}
                responsiblesCount={responsibles.length}
              />
            )}
          </div>

        </form>

        {modal === "delete" ? (
          <SupplierDeleteModal
            onClose={() => void setModal(null)}
            onDeleted={() => router.push(basePath)}
            supplier={persistedSupplier}
            supplierId={supplierId}
          />
        ) : null}
        {modal === "responsible" ? (
          <SupplierResponsibleModal
            onClose={() => void setModal(null)}
            supplier={persistedSupplier}
            supplierId={supplierId}
          />
        ) : null}
      </>
    </DashboardShell>
  );
}

function SupplierRouteState({
  basePath,
  content,
  description,
  loading = false,
  onRetry,
  title,
}: {
  basePath: string;
  content: ReturnType<typeof useSupplierShellContent>;
  description: string;
  loading?: boolean;
  onRetry?: () => void;
  title: string;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={content.sidebar.operatorRole}
      status={content.sidebar.status}
    >
      <Card>
        <CardContent className="grid min-h-[360px] place-items-center p-6 text-center">
          <div className="grid max-w-md justify-items-center gap-4">
            <div
              className={cn(
                "flex size-12 items-center justify-center bg-muted text-muted-foreground",
                loading && "animate-pulse",
              )}
            >
              {loading ? (
                <ArrowLeft className="size-5 animate-pulse" />
              ) : (
                <WarningCircle className="size-5" />
              )}
            </div>
            <div className="grid gap-1">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {!loading ? (
              <div className="flex flex-wrap justify-center gap-2">
                {onRetry ? (
                  <Button onClick={onRetry} type="button" variant="outline">
                    {t("tryAgain")}
                  </Button>
                ) : null}
                <Button asChild>
                  <Link href={basePath}>{t("backToList")}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function SupplierFormHeader({
  basePath,
  isPending,
  mode,
  section,
  setSection,
}: {
  basePath: string;
  isPending: boolean;
  mode: "create" | "edit";
  section: string;
  setSection: (value: string) => unknown;
}) {
  const isEdit = mode === "edit";
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="grid gap-1.5">
        <p className="text-xs font-bold text-muted-foreground">
          {isEdit ? t("breadcrumbEdit") : t("breadcrumbCreate")}
        </p>
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-[28px]">
          {isEdit ? t("editTitle") : t("createTitle")}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {isEdit ? t("editDescription") : t("createDescription")}
        </p>
        <div className="mt-2 flex w-fit gap-1 border border-border bg-card p-1">
          {[
            ["data", t("dataTitle")],
            ["commercial", t("commercialTitle")],
            ["notes", t("notesTitle")],
          ].map(([value, label]) => (
            <button
              key={value}
              className={cn(
                "h-8 px-3 text-xs font-semibold text-muted-foreground transition-colors",
                section === value && "bg-secondary text-secondary-foreground",
              )}
              onClick={() => {
                void setSection(value);
                document
                  .getElementById(`supplier-section-${value}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="h-10 px-4" variant="outline">
          <Link href={basePath}>
            <ArrowLeft className="size-4" />
            {t("cancel")}
          </Link>
        </Button>
        <Button className="h-10 px-4" disabled={isPending} type="submit">
          {isEdit ? <FloppyDisk className="size-4" /> : <Plus className="size-4" />}
          {isPending ? t("saving") : isEdit ? t("saveChanges") : t("saveSupplier")}
        </Button>
      </div>
    </header>
  );
}

function SupplierDataCard({
  assignedResponsible,
  errors,
  onCategoryChange,
  values,
}: {
  assignedResponsible?: SupplierResponsibleInput & { id: string };
  errors: FieldErrors;
  onCategoryChange: (category: SupplierCategory) => void;
  values: SupplierFormInput;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <Card id="supplier-section-data" className="scroll-mt-6">
      <CardContent className="grid gap-4 p-5">
        <SectionHeading
          description={t("dataDescription")}
          title={t("dataTitle")}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            defaultValue={values.name}
            error={errors.name}
            icon={Storefront}
            label={t("fields.name")}
            name="name"
            placeholder={supplierPlaceholders.name}
          />
          <FormField
            defaultValue={values.document}
            error={errors.document}
            icon={Hash}
            label={t("fields.document")}
            mask="00.000.000/0000-00"
            name="document"
            placeholder={supplierPlaceholders.document}
          />
          <FormField
            defaultValue={values.phone}
            error={errors.phone}
            icon={Phone}
            label={t("fields.phone")}
            mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
            name="phone"
            placeholder={supplierPlaceholders.phone}
          />
          <FormField
            defaultValue={values.email}
            error={errors.email}
            icon={EnvelopeSimple}
            label={t("fields.email")}
            name="email"
            placeholder={supplierPlaceholders.email}
            type="email"
          />
          <SelectField
            label={t("fields.category")}
            name="category"
            onValueChange={(value) => onCategoryChange(value as SupplierCategory)}
            options={supplierCategoryOptions.map((value) => ({
              label: t(`categories.${value}`),
              value,
            }))}
            value={values.category}
          />
          {assignedResponsible ? (
            <div className="grid gap-1.5 md:col-span-2">
              <Label>{t("fields.contactName")}</Label>
              <input name="contactName" type="hidden" value={assignedResponsible.name} />
              <div className="flex items-center gap-3 border border-border bg-card p-3">
                <div className="flex size-9 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                  {getInitials(assignedResponsible.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {assignedResponsible.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {assignedResponsible.role} - {assignedResponsible.email}
                  </p>
                </div>
                <Badge variant="secondary">{t("responsibleModal.assigned")}</Badge>
              </div>
            </div>
          ) : null}
          {errors.contactName ? (
            <p className="text-xs text-destructive md:col-span-2">
              {errors.contactName}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierCommercialCard({
  errors,
  onDeliveryTermChange,
  onPaymentTermChange,
  onStatusChange,
  status,
  values,
}: {
  errors: FieldErrors;
  onDeliveryTermChange: (term: SupplierTerm) => void;
  onPaymentTermChange: (term: SupplierTerm) => void;
  onStatusChange: (status: SupplierFormInput["status"]) => unknown;
  status: SupplierFormInput["status"];
  values: SupplierFormInput;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <Card id="supplier-section-commercial" className="scroll-mt-6">
      <CardContent className="grid gap-4 p-5">
        <SectionHeading
          description={t("commercialDescription")}
          title={t("commercialTitle")}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            error={errors.deliveryTerm}
            label={t("fields.deliveryTerm")}
            name="deliveryTerm"
            onValueChange={(value) => onDeliveryTermChange(value as SupplierTerm)}
            options={supplierTermOptions.map((value) => ({
              label: t(`terms.${value}`),
              value,
            }))}
            value={values.deliveryTerm}
          />
          <SelectField
            error={errors.paymentTerm}
            label={t("fields.paymentTerm")}
            name="paymentTerm"
            onValueChange={(value) => onPaymentTermChange(value as SupplierTerm)}
            options={supplierTermOptions.map((value) => ({
              label: t(`terms.${value}`),
              value,
            }))}
            value={values.paymentTerm}
          />
          <FormField
            defaultValue={values.minimumOrder}
            error={errors.minimumOrder}
            icon={CurrencyDollar}
            label={t("fields.minimumOrder")}
            name="minimumOrder"
            placeholder={supplierPlaceholders.minimumOrder}
          />
          <SelectField
            error={errors.status}
            label={t("fields.status")}
            name="status"
            onValueChange={(value) => onStatusChange(value as SupplierFormInput["status"])}
            options={[
              { label: t("status.active"), value: "active" },
              { label: t("status.inactive"), value: "inactive" },
            ]}
            value={status}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierNotesCard({
  errors,
  values,
}: {
  errors: FieldErrors;
  values: SupplierFormInput;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <Card id="supplier-section-notes" className="scroll-mt-6">
      <CardContent className="grid gap-4 p-5">
        <SectionHeading
          description={t("notesDescription")}
          title={t("notesTitle")}
        />
        <div className="grid gap-2">
          <Label htmlFor="notes">{t("fields.notes")}</Label>
          <Textarea
            aria-describedby={errors.notes ? "notes-error" : undefined}
            aria-invalid={Boolean(errors.notes)}
            className="min-h-36 bg-card"
            defaultValue={values.notes}
            id="notes"
            name="notes"
            placeholder={supplierPlaceholders.notes}
          />
          {errors.notes ? (
            <p className="text-xs text-destructive" id="notes-error">
              {errors.notes}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierCreateSummary({
  onOpenResponsible,
  responsiblesCount,
}: {
  onOpenResponsible: () => void;
  responsiblesCount: number;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <aside className="grid content-start gap-4">
      <Card>
        <CardContent className="grid gap-4 p-5">
          <Badge className="w-fit" variant="success">
            {t("summary.badge")}
          </Badge>
          <h2 className="text-base font-bold text-foreground">
            {t("summary.checklist")}
          </h2>
          {[
            t("summary.fiscal"),
            t("summary.contact"),
            t("summary.terms"),
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
          <div className="grid gap-3 border border-border bg-background p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-muted">
                <UserPlus className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">
                  {t("summary.responsibles")}
                </p>
                <Badge variant="secondary">
                  {responsiblesCount > 0
                    ? t("summary.count", { count: responsiblesCount })
                    : t("summary.none")}
                </Badge>
              </div>
            </div>
            <Button
              className="h-9 justify-center"
              onClick={onOpenResponsible}
              type="button"
              variant="outline"
            >
              <UserPlus className="size-4" />
              {t("summary.addResponsible")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function SupplierPerformanceRail({
  orders,
  onOpenDelete,
  onOpenResponsible,
  receivings,
  supplier,
}: {
  orders: PurchaseOrder[];
  onOpenDelete: () => void;
  onOpenResponsible: () => void;
  receivings: Receiving[];
  supplier?: Supplier;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const locale = normalizeLocale(useLocale());
  const openOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  );
  const completedReceivings = receivings.filter(
    (receiving) => receiving.status === "completed" && receiving.receivedAt,
  );
  const onTimeReceivings = completedReceivings.filter(
    (receiving) =>
      new Date(receiving.receivedAt as string).getTime() <=
      new Date(receiving.expectedAt).getTime(),
  );
  const onTimeRate =
    completedReceivings.length > 0
      ? `${Math.round((onTimeReceivings.length / completedReceivings.length) * 100)}%`
      : "-";
  const openValue = openOrders.reduce(
    (total, order) => total + order.totalCost,
    0,
  );
  const metrics = [
    [t("performance.onTime"), onTimeRate],
    [
      t("performance.leadTime"),
      supplier?.deliveryTerm
        ? `${supplier.deliveryTerm} ${locale === "en" ? "days" : "dias"}`
        : "-",
    ],
    [t("performance.openOrders"), String(openOrders.length)],
    [
      t("performance.openValue"),
      new Intl.NumberFormat(locale, {
        currency: "BRL",
        maximumFractionDigits: 0,
        style: "currency",
      }).format(openValue),
    ],
  ];

  return (
    <aside className="grid content-start gap-3">
      {metrics.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="grid gap-1 p-4">
            <p className="text-xs font-bold text-muted-foreground">{label}</p>
            <strong className="text-xl font-bold text-foreground">{value}</strong>
          </CardContent>
        </Card>
      ))}
      <Button
        className="h-10 justify-center"
        onClick={onOpenResponsible}
        type="button"
        variant="outline"
      >
        <UserPlus className="size-4" />
        {t("performance.manageResponsibles")}
      </Button>
      <Button
        className="h-10 justify-center"
        onClick={onOpenDelete}
        type="button"
        variant="destructive"
      >
        <Trash className="size-4" />
        {t("performance.deleteSupplier")}
      </Button>
    </aside>
  );
}

export function SupplierDeleteModalRoute() {
  const basePath = useSupplierBasePath();
  const content = useSupplierShellContent();
  const params = useParams<{ supplierId?: string }>();
  const router = useRouter();
  const t = useTranslations("dashboard.suppliers.flow");
  const supplierId = params.supplierId;
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const supplierQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId],
    queryFn: () => getSupplier(supplierId as string),
  });

  if (!isPersistedSupplier) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={t("errors.invalidId")}
        title={t("errors.notFound")}
      />
    );
  }

  if (supplierQuery.isPending) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={t("loadingDescription")}
        loading
        title={t("loading")}
      />
    );
  }

  if (supplierQuery.isError) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={getApiErrorMessage(supplierQuery.error, t("errors.load"))}
        onRetry={() => void supplierQuery.refetch()}
        title={t("errors.notFound")}
      />
    );
  }

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={content.sidebar.operatorRole}
      status={content.sidebar.status}
    >
      <div className="grid gap-5">
        <p className="text-xs font-bold text-muted-foreground">
          {t("breadcrumbDelete")}
        </p>
        <h1 className="text-2xl font-bold text-foreground md:text-[28px]">
          {t("editTitle")}
        </h1>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              {supplierQuery.data.name} ·{" "}
              {supplierQuery.data.status === "active"
                ? t("status.active")
                : t("status.inactive")}
            </p>
          </CardContent>
        </Card>
      </div>
      <SupplierDeleteModal
        onClose={() => router.push(`${basePath}/${supplierId}/edit`)}
        onDeleted={() => router.push(`${basePath}?notice=deleted`)}
        supplier={supplierQuery.data}
        supplierId={supplierId}
      />
    </DashboardShell>
  );
}

function SupplierDeleteModal({
  onClose,
  onDeleted,
  supplier,
  supplierId,
}: {
  onClose: () => void;
  onDeleted?: () => void;
  supplier?: Supplier;
  supplierId?: string;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const queryClient = useQueryClient();
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      if (!isPersistedSupplier || !supplierId) {
        throw new Error("Invalid supplier identifier.");
      }
      return deleteSupplier(supplierId);
    },
    onError: (error) =>
      setDeleteError(getApiErrorMessage(error, t("errors.delete"))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      if (onDeleted) {
        onDeleted();
        return;
      }

      onClose();
    },
  });

  return (
    <ModalOverlay onClose={onClose}>
      <Card className="w-full max-w-[520px] animate-nitro-scale-in">
        <CardContent className="grid gap-5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center bg-destructive text-destructive-foreground">
              <WarningCircle className="size-5" />
            </div>
            <div className="grid flex-1 gap-1">
              <h2 className="text-[22px] font-bold text-foreground">
                {t("deleteModal.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("deleteModal.description")}
              </p>
            </div>
          </div>
          <div className="grid gap-2 border border-border bg-muted p-4">
            <p className="text-sm font-bold text-foreground">
              {supplier?.name ?? t("deleteModal.unknownSupplier")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("deleteModal.warning")}
            </p>
          </div>
          {deleteError ? <FormError>{deleteError}</FormError> : null}
          <div className="flex justify-end gap-3">
            <Button className="h-10 px-4" onClick={onClose} type="button" variant="outline">
              {t("cancel")}
            </Button>
            <Button
              className="h-10 px-4"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              type="button"
              variant="destructive"
            >
              <Trash className="size-4" />
              {t("deleteModal.confirm")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ModalOverlay>
  );
}

export function SupplierResponsibleModalRoute() {
  const basePath = useSupplierBasePath();
  const content = useSupplierShellContent();
  const params = useParams<{ supplierId?: string }>();
  const router = useRouter();
  const t = useTranslations("dashboard.suppliers.flow");
  const supplierId = params.supplierId;
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const supplierQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId],
    queryFn: () => getSupplier(supplierId as string),
  });

  if (!isPersistedSupplier) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={t("errors.invalidId")}
        title={t("errors.notFound")}
      />
    );
  }

  if (supplierQuery.isPending) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={t("loadingDescription")}
        loading
        title={t("loading")}
      />
    );
  }

  if (supplierQuery.isError) {
    return (
      <SupplierRouteState
        basePath={basePath}
        content={content}
        description={getApiErrorMessage(supplierQuery.error, t("errors.load"))}
        onRetry={() => void supplierQuery.refetch()}
        title={t("errors.notFound")}
      />
    );
  }

  return (
    <DashboardShell
      activeItem="Suppliers"
      operatorRole={content.sidebar.operatorRole}
      status={content.sidebar.status}
    >
      <SupplierResponsibleModal
        onClose={() => router.push(`${basePath}/${supplierId}/edit`)}
        supplier={supplierQuery.data}
        supplierId={supplierId}
      />
    </DashboardShell>
  );
}

function SupplierResponsibleModal({
  onClose,
  supplier,
  supplierId,
}: {
  onClose: () => void;
  supplier?: Supplier;
  supplierId?: string;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const queryClient = useQueryClient();
  const assignedResponsibleId = useSupplierFlowStore((state) => state.assignedResponsibleId);
  const localResponsibles = useSupplierFlowStore((state) => state.responsibles);
  const supplierDraft = useSupplierFlowStore((state) => state.supplierDraft);
  const assignResponsible = useSupplierFlowStore((state) => state.assignResponsible);
  const deleteResponsible = useSupplierFlowStore((state) => state.deleteResponsible);
  const saveResponsible = useSupplierFlowStore((state) => state.saveResponsible);
  const setResponsibleDraft = useSupplierFlowStore((state) => state.setResponsibleDraft);
  const resetResponsibleDraft = useSupplierFlowStore((state) => state.resetResponsibleDraft);
  const [responsibleId, setResponsibleId] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(true);
  const [contactType, setContactType] =
    useState<SupplierResponsibleInput["contactType"]>("orders");
  const [status, setStatus] =
    useState<SupplierFormInput["status"]>("active");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mutationError, setMutationError] = useState<string | null>(null);
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const responsiblesQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId, "responsibles"],
    queryFn: () => listSupplierResponsibles(supplierId as string),
  });
  const responsibles = responsiblesQuery.data ?? localResponsibles;
  const primaryResponsibleId =
    responsibles.find((responsible) => responsible.id === assignedResponsibleId)?.id ??
    responsibles.find((responsible) => responsible.isPrimary)?.id;
  const selectedResponsible = responsibles.find(
    (responsible) => responsible.id === responsibleId,
  );
  const isEditing = responsibleId !== null;
  const saveMutation = useMutation({
    mutationFn: (input: SupplierResponsibleInput & { id?: string }) => {
      if (!isPersistedSupplier || !supplierId) {
        saveResponsible(input);
        return Promise.resolve(null);
      }

      if (input.id && input.id !== "new") {
        return updateSupplierResponsible(supplierId, input.id, input);
      }

      return createSupplierResponsible(supplierId, input);
    },
    onError: (error) =>
      setMutationError(getApiErrorMessage(error, t("errors.responsibleSave"))),
    onSuccess: () => {
      setMutationError(null);
      if (isPersistedSupplier) {
        void queryClient.invalidateQueries({
          queryKey: ["suppliers", supplierId, "responsibles"],
        });
      }
      resetResponsibleDraft();
      setResponsibleId(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (responsibleIdToDelete: string) => {
      if (!isPersistedSupplier || !supplierId) {
        deleteResponsible(responsibleIdToDelete);
        return Promise.resolve(null);
      }

      return deleteSupplierResponsible(supplierId, responsibleIdToDelete);
    },
    onError: (error) =>
      setMutationError(getApiErrorMessage(error, t("errors.responsibleDelete"))),
    onSuccess: () => {
      setMutationError(null);
      if (isPersistedSupplier) {
        void queryClient.invalidateQueries({
          queryKey: ["suppliers", supplierId, "responsibles"],
        });
      }
    },
  });

  function closeModal() {
    resetResponsibleDraft();
    setResponsibleId(null);
    onClose();
  }

  function openCreateForm() {
    resetResponsibleDraft();
    setResponsibleId("new");
    setIsPrimary(false);
    setContactType("orders");
    setStatus("active");
  }

  function openEditForm(responsible: SupplierResponsibleInput & { id: string }) {
    setResponsibleDraft(responsible);
    setResponsibleId(responsible.id);
    setIsPrimary(responsible.isPrimary);
    setContactType(responsible.contactType);
    setStatus(responsible.status);
  }

  function handleDraftChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    setResponsibleDraft({ [target.name]: target.value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMutationError(null);
    const result = supplierResponsibleSchema.safeParse({
      ...getFormData(event.currentTarget),
      contactType,
      isPrimary,
      status,
    });

    if (!result.success) {
      setErrors(getZodErrors(result.error));
      return;
    }

    setErrors({});
    saveMutation.mutate({
      ...result.data,
      id: responsibleId === "new" ? undefined : responsibleId ?? undefined,
    });
    if (!isPersistedSupplier && result.data.isPrimary && responsibleId && responsibleId !== "new") {
      assignResponsible(responsibleId);
    }
  }

  return (
    <ModalOverlay onClose={closeModal}>
      <Card className="w-full max-w-[640px] animate-nitro-scale-in">
        {isEditing ? (
          <form
            key={responsibleId}
            onChange={handleDraftChange}
            onSubmit={handleSubmit}
          >
            <CardContent className="grid gap-5 p-6">
              <SupplierResponsibleModalHeader
                description={t("responsibleModal.description")}
                onClose={closeModal}
                title={
                  selectedResponsible
                    ? t("responsibleModal.editTitle")
                    : t("responsibleModal.title")
                }
              />
              <SupplierResponsibleSupplierSummary
                supplier={supplier}
                supplierDraft={supplierDraft}
              />
              <SupplierResponsibleForm
                contactType={contactType}
                errors={errors}
                isPrimary={isPrimary}
                onContactTypeChange={(value) =>
                  setContactType(value as "orders" | "delivery" | "financial")
                }
                onPrimaryChange={setIsPrimary}
                onStatusChange={(value) =>
                  setStatus(value as SupplierFormInput["status"])
                }
                selectedResponsible={selectedResponsible}
                status={status}
              />
              {mutationError ? <FormError>{mutationError}</FormError> : null}
              <div className="flex justify-end gap-2">
                <Button
                  className="h-9 px-4"
                  onClick={() => setResponsibleId(null)}
                  type="button"
                  variant="outline"
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="h-9 px-4"
                  disabled={saveMutation.isPending}
                  type="submit"
                >
                  {saveMutation.isPending
                    ? t("responsibleModal.saving")
                    : t("responsibleModal.save")}
                </Button>
              </div>
            </CardContent>
          </form>
        ) : (
          <CardContent className="grid gap-5 p-6">
            <SupplierResponsibleModalHeader
              description={t("responsibleModal.listDescription")}
              onClose={closeModal}
              title={t("responsibleModal.listTitle")}
            />
            <SupplierResponsibleSupplierSummary
              supplier={supplier}
              supplierDraft={supplierDraft}
            />
            {mutationError ? <FormError>{mutationError}</FormError> : null}
            {responsiblesQuery.isPending && isPersistedSupplier ? (
              <div
                className="h-20 animate-pulse border border-border bg-muted"
                role="status"
              >
                <span className="sr-only">
                  {t("responsibleModal.loading")}
                </span>
              </div>
            ) : responsiblesQuery.isError ? (
              <FormError>
                {getApiErrorMessage(
                  responsiblesQuery.error,
                  t("errors.responsibleLoad"),
                )}
              </FormError>
            ) : (
              <SupplierResponsibleList
                assignedResponsibleId={primaryResponsibleId}
                onCreate={openCreateForm}
                onDelete={(responsibleIdToDelete) => {
                  if (window.confirm(t("responsibleModal.deleteConfirm"))) {
                    deleteMutation.mutate(responsibleIdToDelete);
                  }
                }}
                onEdit={openEditForm}
                responsibles={responsibles}
              />
            )}
          </CardContent>
        )}
      </Card>
    </ModalOverlay>
  );
}

function SupplierResponsibleModalHeader({
  description,
  onClose,
  title,
}: {
  description: string;
  onClose: () => void;
  title: string;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        aria-label={t("responsibleModal.close")}
        className="size-8 p-0"
        onClick={onClose}
        type="button"
        variant="ghost"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function SupplierResponsibleSupplierSummary({
  supplier,
  supplierDraft,
}: {
  supplier?: Supplier;
  supplierDraft: Partial<SupplierFormInput>;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const name = supplier?.name ?? supplierDraft.name ?? t("responsibleModal.newSupplier");
  const category = supplier?.category ?? supplierDraft.category;
  const status = supplier?.status ?? supplierDraft.status ?? "active";

  return (
    <div className="flex items-center gap-3 bg-muted p-3">
      <div className="flex size-9 items-center justify-center bg-foreground text-xs font-bold text-background">
        {getInitials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {status === "active" ? t("status.active") : t("status.inactive")}
          {category ? ` · ${t(`categories.${category}`)}` : ""}
        </p>
      </div>
    </div>
  );
}

function SupplierResponsibleList({
  assignedResponsibleId,
  onCreate,
  onDelete,
  onEdit,
  responsibles,
}: {
  assignedResponsibleId?: string;
  onCreate: () => void;
  onDelete: (responsibleId: string) => void;
  onEdit: (responsible: SupplierResponsibleInput & { id: string }) => void;
  responsibles: Array<SupplierResponsibleInput & { id: string }>;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        {responsibles.length > 0 ? (
          responsibles.map((responsible) => (
            <div
              key={responsible.id}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 border border-border bg-background p-3 text-left transition-colors hover:border-primary/60 hover:bg-muted sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <div className="flex size-10 items-center justify-center bg-secondary text-xs font-bold text-secondary-foreground">
                {getInitials(responsible.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {responsible.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {responsible.role} - {responsible.email}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:grid sm:justify-items-end">
                {assignedResponsibleId === responsible.id ? (
                  <Badge
                    className="border-primary/20 bg-primary/10 text-primary"
                    variant="outline"
                  >
                    {t("responsibleModal.assigned")}
                  </Badge>
                ) : (
                  <span className="hidden h-6 sm:block" />
                )}
                <span className="flex items-center gap-3">
                  <button
                    className="text-xs font-bold text-primary hover:underline"
                    onClick={() => onEdit(responsible)}
                    type="button"
                  >
                    {t("responsibleModal.edit")}
                  </button>
                  <button
                    aria-label={t("responsibleModal.delete")}
                    className="text-xs font-bold text-destructive hover:underline"
                    onClick={() => {
                      onDelete(responsible.id);
                    }}
                    type="button"
                  >
                    {t("responsibleModal.delete")}
                  </button>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="border border-border bg-background p-4 text-sm text-muted-foreground">
            {t("responsibleModal.empty")}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          {responsibles.length} {t("summary.responsibles").toLowerCase()}
        </p>
        <Button className="h-9 px-4" onClick={onCreate} type="button">
          <UserPlus className="size-4" />
          {t("responsibleModal.addNew")}
        </Button>
      </div>
    </div>
  );
}

function SupplierResponsibleForm({
  contactType,
  errors,
  isPrimary,
  onContactTypeChange,
  onPrimaryChange,
  onStatusChange,
  selectedResponsible,
  status,
}: {
  contactType: SupplierResponsibleInput["contactType"];
  errors: FieldErrors;
  isPrimary: boolean;
  onContactTypeChange: (value: string) => unknown;
  onPrimaryChange: (value: boolean) => void;
  onStatusChange: (value: string) => unknown;
  selectedResponsible?: SupplierResponsibleInput & { id: string };
  status: SupplierFormInput["status"];
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <>
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <PlainField
            defaultValue={selectedResponsible?.name}
            error={errors.name}
            label={t("responsibleModal.name")}
            name="name"
            placeholder={t("responsibleModal.namePlaceholder")}
          />
          <PlainField
            defaultValue={selectedResponsible?.role}
            error={errors.role}
            label={t("responsibleModal.role")}
            name="role"
            placeholder={t("responsibleModal.rolePlaceholder")}
          />
          <PlainField
            defaultValue={selectedResponsible?.phone}
            error={errors.phone}
            label={t("responsibleModal.phone")}
            mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
            name="phone"
            placeholder={t("responsibleModal.phonePlaceholder")}
          />
          <PlainField
            defaultValue={selectedResponsible?.email}
            error={errors.email}
            label={t("responsibleModal.email")}
            name="email"
            placeholder={t("responsibleModal.emailPlaceholder")}
            type="email"
          />
          <SelectField
            label={t("responsibleModal.contactType")}
            name="contactType"
            onValueChange={onContactTypeChange}
            options={[
              { label: t("responsibleModal.orders"), value: "orders" },
              { label: t("responsibleModal.delivery"), value: "delivery" },
              { label: t("responsibleModal.financial"), value: "financial" },
            ]}
            value={contactType}
          />
          <SelectField
            label={t("responsibleModal.status")}
            name="status"
            onValueChange={onStatusChange}
            options={[
              { label: t("status.active"), value: "active" },
              { label: t("status.inactive"), value: "inactive" },
            ]}
            value={status}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 border border-border bg-background p-3">
        <Checkbox
          checked={isPrimary}
          onCheckedChange={(value) => onPrimaryChange(Boolean(value))}
        />
        <span className="grid gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {t("responsibleModal.primary")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("responsibleModal.primaryDescription")}
          </span>
        </span>
      </label>
    </>
  );
}

function FormField({
  defaultValue,
  error,
  icon: Icon,
  label,
  mask,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  icon: IconComponent;
  label: string;
  mask?: string | { mask: string }[];
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {mask ? (
          <MaskedInput
            aria-describedby={error ? `${name}-error` : undefined}
            aria-invalid={Boolean(error)}
            className="h-10 bg-card pl-9"
            defaultValue={defaultValue}
            id={name}
            mask={mask}
            name={name}
            placeholder={placeholder}
            type={type}
          />
        ) : (
          <Input
            aria-describedby={error ? `${name}-error` : undefined}
            aria-invalid={Boolean(error)}
            className="h-10 bg-card pl-9"
            defaultValue={defaultValue}
            id={name}
            name={name}
            placeholder={placeholder}
            type={type}
          />
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PlainField({
  defaultValue,
  error,
  label,
  mask,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  label: string;
  mask?: string | { mask: string }[];
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {mask ? (
        <MaskedInput
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          className="h-10 bg-background"
          defaultValue={defaultValue}
          id={name}
          mask={mask}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      ) : (
        <Input
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          className="h-10 bg-background"
          defaultValue={defaultValue}
          id={name}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      )}
      {error ? (
        <p className="text-xs text-destructive" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  error,
  label,
  name,
  onValueChange,
  options,
  value,
}: {
  error?: string;
  label: string;
  name?: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger
          aria-describedby={error && name ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          className="h-10 bg-card"
          id={name}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-destructive" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="grid gap-1">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FormError({ children }: { children: string }) {
  return (
    <div
      aria-live="assertive"
      className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {children}
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    document.body.style.overflow = "hidden";
    const focusableElements = dialog?.querySelectorAll<HTMLElement>(
      focusableSelector,
    );
    focusableElements?.[0]?.focus();
    if (!focusableElements?.length) dialog?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background/10 p-4 backdrop-blur-sm",
        "animate-nitro-fade-in",
      )}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        aria-modal="true"
        className="flex max-h-[calc(100vh-2rem)] w-full justify-center overflow-y-auto outline-none"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) onClose();
        }}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

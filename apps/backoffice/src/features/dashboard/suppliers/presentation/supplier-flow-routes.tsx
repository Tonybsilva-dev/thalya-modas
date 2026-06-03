"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  parseAsBoolean,
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
  listSupplierResponsibles,
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

const supplierStatusParser = parseAsStringLiteral(["active", "inactive"] as const);
const supplierCategoryParser = parseAsStringLiteral(supplierCategoryOptions);
const supplierTermParser = parseAsStringLiteral(supplierTermOptions);
const responsibleContactTypeParser = parseAsStringLiteral([
  "orders",
  "delivery",
  "financial",
] as const);
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
  const supplierDraft = useSupplierFlowStore((state) => state.supplierDraft);
  const setSupplierDraft = useSupplierFlowStore((state) => state.setSupplierDraft);
  const resetSupplierDraft = useSupplierFlowStore((state) => state.resetSupplierDraft);
  const [section, setSection] = useQueryState("section", parseAsString.withDefault("data"));
  const [modal, setModal] = useQueryState("modal", supplierModalParser);
  const [category, setCategory] = useQueryState(
    "category",
    supplierCategoryParser.withDefault(supplierDefaults.category),
  );
  const [deliveryTerm, setDeliveryTerm] = useQueryState(
    "deliveryTerm",
    supplierTermParser.withDefault(supplierDefaults.deliveryTerm),
  );
  const [paymentTerm, setPaymentTerm] = useQueryState(
    "paymentTerm",
    supplierTermParser.withDefault(supplierDefaults.paymentTerm),
  );
  const [status, setStatus] = useQueryState(
    "status",
    supplierStatusParser.withDefault(supplierDefaults.status),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
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
  const responsibles = responsiblesQuery.data ?? localResponsibles;
  const primaryResponsibleId =
    assignedResponsibleId ?? responsibles.find((responsible) => responsible.isPrimary)?.id;
  const assignedResponsible = responsibles.find(
    (responsible) => responsible.id === primaryResponsibleId,
  );
  const persistedSupplier = supplierQuery.data;

  useEffect(() => {
    if (!persistedSupplier) return;

    setSupplierDraft({
      category: persistedSupplier.category,
      deliveryTerm: persistedSupplier.deliveryTerm,
      document: persistedSupplier.document,
      email: persistedSupplier.email,
      minimumOrder: persistedSupplier.minimumOrder,
      name: persistedSupplier.name,
      notes: persistedSupplier.notes,
      paymentTerm: persistedSupplier.paymentTerm,
      phone: persistedSupplier.phone,
      status: persistedSupplier.status,
    });
    if (persistedSupplier.category) void setCategory(persistedSupplier.category);
    if (persistedSupplier.deliveryTerm) void setDeliveryTerm(persistedSupplier.deliveryTerm);
    if (persistedSupplier.paymentTerm) void setPaymentTerm(persistedSupplier.paymentTerm);
    void setStatus(persistedSupplier.status);
  }, [
    persistedSupplier,
    setCategory,
    setDeliveryTerm,
    setPaymentTerm,
    setStatus,
    setSupplierDraft,
  ]);

  const values = {
    ...supplierDefaults,
    ...supplierDraft,
    category,
    contactName: assignedResponsible?.name,
    deliveryTerm,
    paymentTerm,
    status,
  };

  const mutation = useMutation({
    mutationFn: async (input: SupplierFormInput) => {
      if (isEdit && supplierId && isUuid(supplierId)) {
        return updateSupplier({ ...input, supplierId });
      }

      if (isEdit) {
        return Promise.resolve(null);
      }

      const supplier = await createSupplier(input);
      await Promise.all(
        localResponsibles.map((responsible) =>
          createSupplierResponsible(supplier.id, responsible),
        ),
      );
      return supplier;
    },
    onError: (error) => setFormError(getApiErrorMessage(error, t("errors.save"))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      resetSupplierDraft();
      router.push(basePath);
    },
  });

  function handleDraftChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    setSupplierDraft({ [target.name]: target.value });
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
      return;
    }

    setErrors({});
    mutation.mutate(result.data);
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

          <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-5">
              <SupplierDataCard
                assignedResponsible={assignedResponsible}
                errors={errors}
                onCategoryChange={(value) => {
                  setSupplierDraft({ category: value });
                  void setCategory(value);
                }}
                values={values}
              />
              {isEdit ? (
                <>
                  <SupplierCommercialCard
                    errors={errors}
                    onDeliveryTermChange={(value) => {
                      setSupplierDraft({ deliveryTerm: value });
                      void setDeliveryTerm(value);
                    }}
                    onPaymentTermChange={(value) => {
                      setSupplierDraft({ paymentTerm: value });
                      void setPaymentTerm(value);
                    }}
                    onStatusChange={setStatus}
                    status={status}
                    values={values}
                  />
                  <SupplierNotesCard errors={errors} values={values} />
                </>
              ) : (
                <SupplierCommercialCard
                  errors={errors}
                  onDeliveryTermChange={(value) => {
                    setSupplierDraft({ deliveryTerm: value });
                    void setDeliveryTerm(value);
                  }}
                  onPaymentTermChange={(value) => {
                    setSupplierDraft({ paymentTerm: value });
                    void setPaymentTerm(value);
                  }}
                  onStatusChange={setStatus}
                  status={status}
                  values={values}
                />
              )}
            </div>

            {isEdit ? (
              <SupplierPerformanceRail
                onOpenDelete={() => void setModal("delete")}
                onOpenResponsible={() => void setModal("responsible")}
              />
            ) : (
              <SupplierCreateSummary
                onOpenResponsible={() => void setModal("responsible")}
              />
            )}
          </div>

          {formError ? <FormError>{formError}</FormError> : null}
        </form>

        {modal === "delete" ? (
          <SupplierDeleteModal
            onClose={() => void setModal(null)}
            onDeleted={() => router.push(basePath)}
            supplierId={supplierId}
          />
        ) : null}
        {modal === "responsible" ? (
          <SupplierResponsibleModal
            onClose={() => void setModal(null)}
            supplierId={supplierId}
          />
        ) : null}
      </>
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
              onClick={() => void setSection(value)}
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
    <Card>
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
    <Card>
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
            label={t("fields.status")}
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
    <Card>
      <CardContent className="grid gap-4 p-5">
        <SectionHeading
          description={t("notesDescription")}
          title={t("notesTitle")}
        />
        <div className="grid gap-2">
          <Label htmlFor="notes">{t("fields.notes")}</Label>
          <Textarea
            className="min-h-36 bg-card"
            defaultValue={values.notes}
            id="notes"
            name="notes"
            placeholder={supplierPlaceholders.notes}
          />
          {errors.notes ? <p className="text-xs text-destructive">{errors.notes}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierCreateSummary({
  onOpenResponsible,
}: {
  onOpenResponsible: () => void;
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
                <Badge variant="secondary">{t("summary.none")}</Badge>
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
  onOpenDelete,
  onOpenResponsible,
}: {
  onOpenDelete: () => void;
  onOpenResponsible: () => void;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <aside className="grid content-start gap-3">
      {[
        [t("performance.onTime"), "94%"],
        [t("performance.leadTime"), "4 dias"],
        [t("performance.openOrders"), "3"],
        [t("performance.openValue"), "R$ 8.420"],
      ].map(([label, value]) => (
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
  const t = useTranslations("dashboard.suppliers.flow");

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
              {t("deleteModal.pageDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
      <SupplierDeleteModal
        onClose={() => {
          window.location.href = `${basePath}/moda-brasil/edit`;
        }}
        onDeleted={() => {
          window.location.href = basePath;
        }}
      />
    </DashboardShell>
  );
}

function SupplierDeleteModal({
  onClose,
  onDeleted,
  supplierId,
}: {
  onClose: () => void;
  onDeleted?: () => void;
  supplierId?: string;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const queryClient = useQueryClient();
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const mutation = useMutation({
    mutationFn: () =>
      isPersistedSupplier && supplierId
        ? deleteSupplier(supplierId)
        : Promise.resolve(),
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
    <ModalOverlay>
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
              {t("deleteModal.supplierName")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("deleteModal.warning")}
            </p>
          </div>
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SupplierResponsibleModal
        onClose={() => {
          window.location.href = `${basePath}/moda-brasil/edit`;
        }}
      />
    </main>
  );
}

function SupplierResponsibleModal({
  onClose,
  supplierId,
}: {
  onClose: () => void;
  supplierId?: string;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const queryClient = useQueryClient();
  const assignedResponsibleId = useSupplierFlowStore((state) => state.assignedResponsibleId);
  const localResponsibles = useSupplierFlowStore((state) => state.responsibles);
  const assignResponsible = useSupplierFlowStore((state) => state.assignResponsible);
  const deleteResponsible = useSupplierFlowStore((state) => state.deleteResponsible);
  const saveResponsible = useSupplierFlowStore((state) => state.saveResponsible);
  const setResponsibleDraft = useSupplierFlowStore((state) => state.setResponsibleDraft);
  const resetResponsibleDraft = useSupplierFlowStore((state) => state.resetResponsibleDraft);
  const [responsibleId, setResponsibleId] = useQueryState("responsibleId", parseAsString);
  const [isPrimary, setIsPrimary] = useQueryState(
    "primary",
    parseAsBoolean.withDefault(true),
  );
  const [contactType, setContactType] = useQueryState(
    "contactType",
    responsibleContactTypeParser.withDefault("orders"),
  );
  const [status, setStatus] = useQueryState(
    "status",
    supplierStatusParser.withDefault("active"),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const responsiblesQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId, "responsibles"],
    queryFn: () => listSupplierResponsibles(supplierId as string),
  });
  const responsibles = responsiblesQuery.data ?? localResponsibles;
  const primaryResponsibleId =
    assignedResponsibleId ?? responsibles.find((responsible) => responsible.isPrimary)?.id;
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
    onSuccess: () => {
      if (isPersistedSupplier) {
        void queryClient.invalidateQueries({
          queryKey: ["suppliers", supplierId, "responsibles"],
        });
      }
      resetResponsibleDraft();
      void setResponsibleId(null);
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
    onSuccess: () => {
      if (isPersistedSupplier) {
        void queryClient.invalidateQueries({
          queryKey: ["suppliers", supplierId, "responsibles"],
        });
      }
    },
  });

  function closeModal() {
    resetResponsibleDraft();
    void setResponsibleId(null);
    onClose();
  }

  function openCreateForm() {
    resetResponsibleDraft();
    void setResponsibleId("new");
    void setIsPrimary(false);
    void setContactType("orders");
    void setStatus("active");
  }

  function openEditForm(responsible: SupplierResponsibleInput & { id: string }) {
    setResponsibleDraft(responsible);
    void setResponsibleId(responsible.id);
    void setIsPrimary(responsible.isPrimary);
    void setContactType(responsible.contactType);
    void setStatus(responsible.status);
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
    <ModalOverlay>
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
              <SupplierResponsibleSupplierSummary />
              <SupplierResponsibleForm
                contactType={contactType}
                errors={errors}
                isPrimary={isPrimary}
                onContactTypeChange={(value) =>
                  setContactType(value as "orders" | "delivery" | "financial")
                }
                onPrimaryChange={(value) => void setIsPrimary(value)}
                onStatusChange={(value) =>
                  setStatus(value as SupplierFormInput["status"])
                }
                selectedResponsible={selectedResponsible}
                status={status}
              />
              <div className="flex justify-end gap-2">
                <Button
                  className="h-9 px-4"
                  onClick={() => void setResponsibleId(null)}
                  type="button"
                  variant="outline"
                >
                  {t("cancel")}
                </Button>
                <Button className="h-9 px-4" type="submit">
                  {t("responsibleModal.save")}
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
            <SupplierResponsibleSupplierSummary />
            <SupplierResponsibleList
              assignedResponsibleId={primaryResponsibleId}
                onCreate={openCreateForm}
                onDelete={(responsibleIdToDelete) =>
                  deleteMutation.mutate(responsibleIdToDelete)
                }
                onEdit={openEditForm}
                responsibles={responsibles}
              />
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

function SupplierResponsibleSupplierSummary() {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <div className="flex items-center gap-3 bg-muted p-3">
      <div className="flex size-9 items-center justify-center bg-foreground text-xs font-bold text-background">
        MB
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {t("responsibleModal.supplierName")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {t("responsibleModal.supplierDescription")}
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
            className="h-10 bg-card pl-9"
            defaultValue={defaultValue}
            id={name}
            name={name}
            placeholder={placeholder}
            type={type}
          />
        )}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
          className="h-10 bg-background"
          defaultValue={defaultValue}
          id={name}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
      <Label>{label}</Label>
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="h-10 bg-card">
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
    <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/60 p-4",
        "animate-nitro-fade-in",
      )}
    >
      {children}
    </div>
  );
}

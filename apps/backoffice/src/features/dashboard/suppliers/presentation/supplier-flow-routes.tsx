"use client";

import type {
  ComponentType,
  FocusEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
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
  CheckCircle,
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
import { SupplierBreadcrumb } from "./supplier-breadcrumb";

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

function getZodErrors(
  error: z.ZodError,
  resolveMessage: (field: string, fallback: string) => string = (
    _field,
    fallback,
  ) => fallback,
) {
  return error.issues.reduce<FieldErrors>((acc, issue) => {
    const key = String(issue.path[0] ?? "");
    if (key && !acc[key]) acc[key] = resolveMessage(key, issue.message);
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
  const [isDirty, setIsDirty] = useState(false);
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
  const responsibles = isEdit
    ? (responsiblesQuery.data ?? [])
    : localResponsibles;
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

  useEffect(() => {
    if (!isDirty) return;

    function preventAccidentalExit(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", preventAccidentalExit);
    return () => window.removeEventListener("beforeunload", preventAccidentalExit);
  }, [isDirty]);

  useEffect(() => {
    if (!section || section === "data") return;
    const target = document.getElementById(`supplier-section-${section}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section]);

  const values = {
    ...supplierDefaults,
    ...(persistedSupplier ?? {}),
    ...(!isEdit ? supplierDraft : {}),
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
        throw new Error("Invalid supplier identifier.");
      }

      return createSupplier(input, localResponsibles);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, t("errors.save")));
      revealFormAlert();
    },
    onSuccess: (supplier) => {
      setIsDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      resetFlow();
      const notice = isEdit ? "updated" : "created";
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
    setIsDirty(true);
    clearFieldError(target.name);
  }

  function handleFieldBlur(event: FocusEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    const result = supplierFormSchema.safeParse({
      ...getFormData(event.currentTarget),
      status,
    });
    if (result.success) {
      clearFieldError(target.name);
      return;
    }

    const issue = result.error.issues.find(
      (currentIssue) => currentIssue.path[0] === target.name,
    );
    if (issue) {
      setErrors((current) => ({
        ...current,
        [target.name]: t(`validation.supplier.${target.name}`),
      }));
    }
  }

  function handleFormKeyDown(event: ReactKeyboardEvent<HTMLFormElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = supplierFormSchema.safeParse({
      ...getFormData(event.currentTarget),
      status,
    });

    if (!result.success) {
      setErrors(
        getZodErrors(result.error, (field) =>
          t(`validation.supplier.${field}`),
        ),
      );
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

  function leaveForm() {
    if (isDirty && !window.confirm(t("unsaved.confirm"))) return;
    setIsDirty(false);
    router.push(basePath);
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
          onBlur={handleFieldBlur}
          onChange={handleDraftChange}
          onKeyDown={handleFormKeyDown}
          onSubmit={handleSubmit}
        >
          <SupplierFormHeader
            basePath={basePath}
            isDirty={isDirty}
            mode={mode}
            onCancel={leaveForm}
            section={section}
            setSection={setSection}
            status={status}
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
                errors={errors}
                onCategoryChange={(value) => {
                  if (!isEdit) setSupplierDraft({ category: value });
                  setCategory(value);
                  setIsDirty(true);
                  clearFieldError("category");
                }}
                values={values}
              />
              <SupplierContactsCard
                error={responsiblesQuery.error}
                isLoading={responsiblesQuery.isPending && isPersistedSupplier}
                onOpenResponsible={() => void setModal("responsible")}
                onRetry={() => void responsiblesQuery.refetch()}
                responsibles={responsibles}
              />
              <SupplierCommercialCard
                errors={errors}
                isEdit={isEdit}
                onDeliveryTermChange={(value) => {
                  if (!isEdit) setSupplierDraft({ deliveryTerm: value });
                  setDeliveryTerm(value);
                  setIsDirty(true);
                  clearFieldError("deliveryTerm");
                }}
                onPaymentTermChange={(value) => {
                  if (!isEdit) setSupplierDraft({ paymentTerm: value });
                  setPaymentTerm(value);
                  setIsDirty(true);
                  clearFieldError("paymentTerm");
                }}
                onStatusChange={(value) => {
                  setStatus(value);
                  setIsDirty(true);
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
                receivings={(receivingsQuery.data ?? []).filter(
                  (receiving) => receiving.supplierId === supplierId,
                )}
                supplier={persistedSupplier}
              />
            ) : (
              <SupplierCreateSummary
                onOpenResponsible={() => void setModal("responsible")}
                responsiblesCount={responsibles.length}
                values={values}
              />
            )}
          </div>

          {isEdit ? (
            <SupplierDangerZone onOpenDelete={() => void setModal("delete")} />
          ) : null}

          <SupplierFormActions
            isDirty={isDirty}
            isEdit={isEdit}
            isPending={mutation.isPending}
            onCancel={leaveForm}
          />
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
            onClose={() => {
              if (!isEdit && localResponsibles.length > 0) setIsDirty(true);
              void setModal(null);
            }}
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
  isDirty,
  mode,
  onCancel,
  section,
  setSection,
  status,
}: {
  basePath: string;
  isDirty: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  section: string;
  setSection: (value: string) => unknown;
  status: SupplierFormInput["status"];
}) {
  const isEdit = mode === "edit";
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <header className="grid gap-4">
      <div className="grid gap-1.5">
        <SupplierBreadcrumb
          basePath={basePath}
          currentLabel={isEdit ? t("editTitle") : t("createTitle")}
          onRootClick={(event) => {
            event.preventDefault();
            onCancel();
          }}
          rootLabel={t("breadcrumbRoot")}
        />
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-[28px]">
          {isEdit ? t("editTitle") : t("createTitle")}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {isEdit ? t("editDescription") : t("createDescription")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant={status === "active" ? "success" : "outline"}>
            {status === "active" ? t("status.active") : t("status.inactive")}
          </Badge>
          {isDirty ? (
            <Badge
              className="border-warning/30 bg-warning/10 text-foreground"
              variant="outline"
            >
              {t("unsaved.badge")}
            </Badge>
          ) : null}
        </div>
        <nav
          aria-label={t("sectionNavigation")}
          className="mt-2 flex w-fit max-w-full gap-1 overflow-x-auto border border-border bg-card p-1"
        >
          {[
            ["data", t("dataTitle")],
            ["contacts", t("contacts.title")],
            ["commercial", t("commercialTitle")],
            ["notes", t("notesTitle")],
          ].map(([value, label]) => (
            <button
              aria-current={section === value ? "location" : undefined}
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
        </nav>
      </div>
    </header>
  );
}

function SupplierDataCard({
  errors,
  onCategoryChange,
  values,
}: {
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
            placeholder={t("placeholders.name")}
            required
          />
          <FormField
            defaultValue={values.document}
            error={errors.document}
            icon={Hash}
            label={t("fields.document")}
            mask="00.000.000/0000-00"
            name="document"
            placeholder={t("placeholders.document")}
            required
          />
          <FormField
            defaultValue={values.phone}
            error={errors.phone}
            icon={Phone}
            label={t("fields.phone")}
            mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
            name="phone"
            placeholder={t("placeholders.phone")}
            required
          />
          <FormField
            defaultValue={values.email}
            error={errors.email}
            icon={EnvelopeSimple}
            label={t("fields.email")}
            name="email"
            placeholder={t("placeholders.email")}
            required
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
            required
            value={values.category}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierContactsCard({
  error,
  isLoading,
  onOpenResponsible,
  onRetry,
  responsibles,
}: {
  error: Error | null;
  isLoading: boolean;
  onOpenResponsible: () => void;
  onRetry: () => void;
  responsibles: Array<SupplierResponsibleInput & { id: string }>;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const primary =
    responsibles.find((responsible) => responsible.isPrimary) ?? responsibles[0];

  return (
    <Card id="supplier-section-contacts" className="scroll-mt-6">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading
            description={t("contacts.description")}
            title={t("contacts.title")}
          />
          <Button
            className="h-9 shrink-0 px-3"
            onClick={onOpenResponsible}
            type="button"
            variant="outline"
          >
            <UserPlus className="size-4" />
            {responsibles.length > 0
              ? t("contacts.manage")
              : t("contacts.add")}
          </Button>
        </div>

        {isLoading ? (
          <div
            aria-label={t("responsibleModal.loading")}
            className="h-20 animate-pulse bg-muted"
            role="status"
          />
        ) : error ? (
          <div
            className="grid justify-items-start gap-3 border border-destructive/30 bg-destructive/5 p-4"
            role="alert"
          >
            <div className="grid gap-1">
              <strong className="text-sm text-foreground">
                {t("contacts.loadErrorTitle")}
              </strong>
              <p className="text-sm text-muted-foreground">
                {getApiErrorMessage(error, t("errors.responsibleLoad"))}
              </p>
            </div>
            <Button className="h-9 px-3" onClick={onRetry} type="button" variant="outline">
              {t("tryAgain")}
            </Button>
          </div>
        ) : responsibles.length > 0 ? (
          <div className="grid gap-2">
            {responsibles.map((responsible) => (
              <button
                className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border border-border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                key={responsible.id}
                onClick={onOpenResponsible}
                type="button"
              >
                <div className="flex size-9 items-center justify-center bg-secondary text-xs font-bold text-secondary-foreground">
                  {getInitials(responsible.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-sm text-foreground">
                      {responsible.name}
                    </strong>
                    {(primary?.id === responsible.id || responsible.isPrimary) ? (
                      <Badge variant="secondary">
                        {t("responsibleModal.assigned")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {responsible.role} ·{" "}
                    {t(`responsibleModal.${responsible.contactType}`)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {responsible.email} · {responsible.phone}
                  </p>
                </div>
                <Badge
                  variant={responsible.status === "active" ? "success" : "outline"}
                >
                  {responsible.status === "active"
                    ? t("status.active")
                    : t("status.inactive")}
                </Badge>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid justify-items-start gap-3 border border-dashed border-border bg-muted/40 p-4">
            <div className="flex size-9 items-center justify-center bg-background text-muted-foreground">
              <UserPlus className="size-4" />
            </div>
            <div className="grid gap-1">
              <strong className="text-sm text-foreground">
                {t("contacts.emptyTitle")}
              </strong>
              <p className="text-sm leading-5 text-muted-foreground">
                {t("contacts.emptyDescription")}
              </p>
            </div>
            <Button className="h-9 px-3" onClick={onOpenResponsible} type="button">
              <UserPlus className="size-4" />
              {t("contacts.add")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SupplierCommercialCard({
  errors,
  isEdit,
  onDeliveryTermChange,
  onPaymentTermChange,
  onStatusChange,
  status,
  values,
}: {
  errors: FieldErrors;
  isEdit: boolean;
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
            required
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
            required
            value={values.paymentTerm}
          />
          <FormField
            defaultValue={values.minimumOrder}
            error={errors.minimumOrder}
            icon={CurrencyDollar}
            label={t("fields.minimumOrder")}
            name="minimumOrder"
            placeholder={t("placeholders.minimumOrder")}
            required
          />
          <SelectField
            error={errors.status}
            label={isEdit ? t("fields.status") : t("fields.initialStatus")}
            name="status"
            onValueChange={(value) => onStatusChange(value as SupplierFormInput["status"])}
            options={[
              { label: t("status.active"), value: "active" },
              { label: t("status.inactive"), value: "inactive" },
            ]}
            required
            value={status}
          />
          <p className="text-xs leading-5 text-muted-foreground md:col-span-2">
            {status === "inactive"
              ? t("status.inactiveDescription")
              : t("status.activeDescription")}
          </p>
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
          <Label htmlFor="notes">
            {t("fields.notes")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("optional")})
            </span>
          </Label>
          <Textarea
            aria-describedby={errors.notes ? "notes-error" : undefined}
            aria-invalid={Boolean(errors.notes)}
            className="min-h-36 bg-card"
            defaultValue={values.notes}
            id="notes"
            name="notes"
            placeholder={t("placeholders.notes")}
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
  values,
}: {
  onOpenResponsible: () => void;
  responsiblesCount: number;
  values: SupplierFormInput;
}) {
  const t = useTranslations("dashboard.suppliers.flow");
  const checklist = [
    {
      completed: Boolean(values.name.trim() && values.document.trim()),
      label: t("summary.fiscal"),
    },
    {
      completed: responsiblesCount > 0,
      label: t("summary.contact"),
    },
    {
      completed: Boolean(values.deliveryTerm && values.paymentTerm),
      label: t("summary.terms"),
    },
  ];

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
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.completed ? (
                <CheckCircle className="size-4 text-success" weight="fill" />
              ) : (
                <Info className="size-4 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-sm",
                  item.completed ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
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
  receivings,
  supplier,
}: {
  orders: PurchaseOrder[];
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
        ? t(`terms.${supplier.deliveryTerm}`)
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
    <aside className="grid content-start gap-3 xl:sticky xl:top-5">
      <Card>
        <CardContent className="grid gap-4 p-5">
          <SectionHeading
            description={t("performance.description")}
            title={t("performance.title")}
          />
          <div className="grid grid-cols-2 border-l border-t border-border">
            {metrics.map(([label, value]) => (
              <div
                className="grid gap-1 border-b border-r border-border p-3"
                key={label}
              >
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <strong className="text-lg font-bold text-foreground">{value}</strong>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function SupplierDangerZone({
  onOpenDelete,
}: {
  onOpenDelete: () => void;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("danger.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-5 text-muted-foreground">
            {t("danger.description")}
          </p>
        </div>
        <Button
          className="h-10 shrink-0 px-4"
          onClick={onOpenDelete}
          type="button"
          variant="destructive"
        >
          <Trash className="size-4" />
          {t("performance.deleteSupplier")}
        </Button>
      </CardContent>
    </Card>
  );
}

function SupplierFormActions({
  isDirty,
  isEdit,
  isPending,
  onCancel,
}: {
  isDirty: boolean;
  isEdit: boolean;
  isPending: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations("dashboard.suppliers.flow");

  return (
    <div className="sticky bottom-3 z-20 flex flex-col gap-3 border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {isDirty ? t("unsaved.pending") : t("unsaved.saved")}
        </p>
        <p className="text-xs text-muted-foreground">{t("unsaved.shortcut")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-10 px-4"
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          <ArrowLeft className="size-4" />
          {t("cancel")}
        </Button>
        <Button
          className="h-10 px-4"
          disabled={isPending || (isEdit && !isDirty)}
          type="submit"
        >
          {isEdit ? <FloppyDisk className="size-4" /> : <Plus className="size-4" />}
          {isPending ? t("saving") : isEdit ? t("saveChanges") : t("saveSupplier")}
        </Button>
      </div>
    </div>
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
        <SupplierBreadcrumb
          basePath={basePath}
          currentLabel={t("deleteTitle")}
          rootLabel={t("breadcrumbRoot")}
        />
        <h1 className="text-2xl font-bold text-foreground md:text-[28px]">
          {t("deleteTitle")}
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
  const [mutationNotice, setMutationNotice] = useState<string | null>(null);
  const [responsibleToDelete, setResponsibleToDelete] = useState<
    (SupplierResponsibleInput & { id: string }) | null
  >(null);
  const isPersistedSupplier = Boolean(supplierId && isUuid(supplierId));
  const responsiblesQuery = useQuery({
    enabled: isPersistedSupplier,
    queryKey: ["suppliers", supplierId, "responsibles"],
    queryFn: () => listSupplierResponsibles(supplierId as string),
  });
  const responsibles = isPersistedSupplier
    ? (responsiblesQuery.data ?? [])
    : localResponsibles;
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
      setMutationNotice(t("responsibleModal.saved"));
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
      setMutationNotice(t("responsibleModal.deleted"));
      setResponsibleToDelete(null);
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
    setResponsibleToDelete(null);
    onClose();
  }

  function openCreateForm() {
    resetResponsibleDraft();
    setResponsibleId("new");
    setIsPrimary(false);
    setContactType("orders");
    setStatus("active");
    setMutationNotice(null);
  }

  function openEditForm(responsible: SupplierResponsibleInput & { id: string }) {
    setResponsibleDraft(responsible);
    setResponsibleId(responsible.id);
    setIsPrimary(responsible.isPrimary);
    setContactType(responsible.contactType);
    setStatus(responsible.status);
    setMutationNotice(null);
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
      setErrors(
        getZodErrors(result.error, (field) =>
          t(`validation.responsible.${field}`),
        ),
      );
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
            {mutationNotice ? (
              <div
                className="flex items-center gap-2 border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                <CheckCircle className="size-4 text-success" weight="fill" />
                {mutationNotice}
              </div>
            ) : null}
            {responsibleToDelete ? (
              <div className="grid gap-4 border border-destructive/30 bg-destructive/5 p-4">
                <div className="grid gap-1">
                  <strong className="text-sm text-foreground">
                    {t("responsibleModal.deleteTitle")}
                  </strong>
                  <p className="text-sm leading-5 text-muted-foreground">
                    {t("responsibleModal.deleteDescription", {
                      name: responsibleToDelete.name,
                    })}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    className="h-9 px-3"
                    onClick={() => setResponsibleToDelete(null)}
                    type="button"
                    variant="outline"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    className="h-9 px-3"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(responsibleToDelete.id)}
                    type="button"
                    variant="destructive"
                  >
                    <Trash className="size-4" />
                    {deleteMutation.isPending
                      ? t("responsibleModal.deleting")
                      : t("responsibleModal.delete")}
                  </Button>
                </div>
              </div>
            ) : responsiblesQuery.isPending && isPersistedSupplier ? (
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
                onDelete={(responsibleIdToDelete) =>
                  setResponsibleToDelete(
                    responsibles.find(
                      (responsible) => responsible.id === responsibleIdToDelete,
                    ) ?? null,
                  )
                }
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
            required
          />
          <PlainField
            defaultValue={selectedResponsible?.role}
            error={errors.role}
            label={t("responsibleModal.role")}
            name="role"
            placeholder={t("responsibleModal.rolePlaceholder")}
            required
          />
          <PlainField
            defaultValue={selectedResponsible?.phone}
            error={errors.phone}
            label={t("responsibleModal.phone")}
            mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
            name="phone"
            placeholder={t("responsibleModal.phonePlaceholder")}
            required
          />
          <PlainField
            defaultValue={selectedResponsible?.email}
            error={errors.email}
            label={t("responsibleModal.email")}
            name="email"
            placeholder={t("responsibleModal.emailPlaceholder")}
            required
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
            required
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
            required
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
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  icon: IconComponent;
  label: string;
  mask?: string | { mask: string }[];
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {mask ? (
          <MaskedInput
            aria-describedby={error ? `${name}-error` : undefined}
            aria-invalid={Boolean(error)}
            aria-required={required}
            className="h-10 bg-card pl-9"
            defaultValue={defaultValue}
            id={name}
            mask={mask}
            name={name}
            placeholder={placeholder}
            required={required}
            type={type}
          />
        ) : (
          <Input
            aria-describedby={error ? `${name}-error` : undefined}
            aria-invalid={Boolean(error)}
            aria-required={required}
            className="h-10 bg-card pl-9"
            defaultValue={defaultValue}
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
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
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  label: string;
  mask?: string | { mask: string }[];
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {mask ? (
        <MaskedInput
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          aria-required={required}
          className="h-10 bg-background"
          defaultValue={defaultValue}
          id={name}
          mask={mask}
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
      ) : (
        <Input
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          aria-required={required}
          className="h-10 bg-background"
          defaultValue={defaultValue}
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
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
  required = false,
  value,
}: {
  error?: string;
  label: string;
  name?: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  value: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger
          aria-describedby={error && name ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          aria-required={required}
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

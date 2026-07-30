"use client";

import type { ComponentType, FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import {
  ArrowLeft,
  CalendarBlank,
  CurrencyDollar,
  FileText,
  FloppyDisk,
  Hash,
  NotePencil,
  Package,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import {
  Badge,
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
  Textarea,
  cn,
} from "@thalya-modas/ui";
import { z } from "zod";

import { ApiRequestError } from "@/src/shared/api/http-client";
import { normalizeLocale } from "@/src/shared/i18n/locales";

import {
  createPurchaseOrder,
  listSuppliers,
  type Supplier,
} from "../application/suppliers-api";
import { usePurchaseOrderFlowStore } from "../application/purchase-order-flow-store";
import { purchaseOrderFormSchema } from "../domain/supplier-flow-schemas";
import { supplierTermOptions, type SupplierTerm } from "../domain/supplier-options";
import { suppliersContentByLocale } from "../domain/suppliers-content";
import { DashboardShell } from "../../shared/presentation/dashboard-shell";

type FieldErrors = Record<string, string>;
type IconComponent = ComponentType<{ className?: string }>;

const purchaseOrderSectionParser = parseAsStringLiteral([
  "details",
  "items",
  "review",
] as const);
const purchaseOrderStatusParser = parseAsStringLiteral([
  "draft",
  "confirmed",
] as const);
const supplierTermParser = parseAsStringLiteral(supplierTermOptions);

function useSuppliersBasePath() {
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

function getZodErrors(error: z.ZodError) {
  return error.issues.reduce<FieldErrors>((acc, issue) => {
    const key = issue.path.join(".");
    if (key && !acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

function getFormData(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

export function PurchaseOrderCreateRoute() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const basePath = useSuppliersBasePath();
  const content = useSupplierShellContent();
  const t = useTranslations("dashboard.suppliers.purchaseOrder");
  const [section, setSection] = useQueryState(
    "section",
    purchaseOrderSectionParser.withDefault("details"),
  );
  const [paymentTerm, setPaymentTerm] = useQueryState(
    "paymentTerm",
    supplierTermParser.withDefault("+30"),
  );
  const [status, setStatus] = useQueryState(
    "status",
    purchaseOrderStatusParser.withDefault("confirmed"),
  );
  const items = usePurchaseOrderFlowStore((state) => state.items);
  const addItem = usePurchaseOrderFlowStore((state) => state.addItem);
  const removeItem = usePurchaseOrderFlowStore((state) => state.removeItem);
  const resetItems = usePurchaseOrderFlowStore((state) => state.reset);
  const updateItem = usePurchaseOrderFlowStore((state) => state.updateItem);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", { status: "active" }],
    queryFn: () => listSuppliers({ status: "active" }),
  });
  const suppliers = suppliersQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: createPurchaseOrder,
    onError: (error) => setFormError(getApiErrorMessage(error, t("errors.save"))),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      resetItems();
      router.push(basePath);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const raw = getFormData(event.currentTarget);
    const result = purchaseOrderFormSchema.safeParse({
      ...raw,
      supplierId: raw.supplierId ?? "",
      items,
      paymentTerm,
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
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <PurchaseOrderHeader
          basePath={basePath}
          isPending={mutation.isPending}
          section={section}
          setSection={setSection}
        />

        <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-5">
            <PurchaseOrderDetailsCard
              errors={errors}
              onPaymentTermChange={(value) => void setPaymentTerm(value)}
              onStatusChange={(value) => void setStatus(value)}
              paymentTerm={paymentTerm}
              status={status}
              suppliers={suppliers}
            />
            <PurchaseOrderItemsCard
              addItem={addItem}
              errors={errors}
              items={items}
              removeItem={removeItem}
              updateItem={updateItem}
            />
            <PurchaseOrderNotesCard error={errors.notes} />
          </div>

          <PurchaseOrderSummaryRail items={items} suppliers={suppliers} />
        </div>

        {formError ? <FormError>{formError}</FormError> : null}
      </form>
    </DashboardShell>
  );
}

function PurchaseOrderHeader({
  basePath,
  isPending,
  section,
  setSection,
}: {
  basePath: string;
  isPending: boolean;
  section: string;
  setSection: (value: "details" | "items" | "review") => unknown;
}) {
  const t = useTranslations("dashboard.suppliers.purchaseOrder");

  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="grid gap-1.5">
        <p className="text-xs font-bold text-muted-foreground">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-[28px]">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <div className="mt-2 flex w-fit gap-1 border border-border bg-card p-1">
          {(["details", "items", "review"] as const).map((value) => (
            <button
              key={value}
              className={cn(
                "h-8 px-3 text-xs font-semibold text-muted-foreground transition-colors",
                section === value && "bg-secondary text-secondary-foreground",
              )}
              onClick={() => void setSection(value)}
              type="button"
            >
              {t(`sections.${value}`)}
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
          <FloppyDisk className="size-4" />
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </header>
  );
}

function PurchaseOrderDetailsCard({
  errors,
  onPaymentTermChange,
  onStatusChange,
  paymentTerm,
  status,
  suppliers,
}: {
  errors: FieldErrors;
  onPaymentTermChange: (value: SupplierTerm) => void;
  onStatusChange: (value: "draft" | "confirmed") => void;
  paymentTerm: SupplierTerm;
  status: "draft" | "confirmed";
  suppliers: Supplier[];
}) {
  const t = useTranslations("dashboard.suppliers.purchaseOrder");

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <SectionHeading description={t("detailsDescription")} title={t("detailsTitle")} />
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            error={errors.supplierId}
            label={t("fields.supplier")}
            name="supplierId"
            options={suppliers.map((supplier) => ({
              label: supplier.name,
              value: supplier.id,
            }))}
            placeholder={t("placeholders.supplier")}
          />
          <FormField
            error={errors.expectedDeliveryAt}
            icon={CalendarBlank}
            label={t("fields.expectedDeliveryAt")}
            name="expectedDeliveryAt"
            type="datetime-local"
          />
          <FormField
            error={errors.invoiceNumber}
            icon={FileText}
            label={t("fields.invoiceNumber")}
            name="invoiceNumber"
            placeholder={t("placeholders.invoiceNumber")}
          />
          <SelectField
            label={t("fields.paymentTerm")}
            name="paymentTerm"
            onValueChange={(value) => onPaymentTermChange(value as SupplierTerm)}
            options={supplierTermOptions.map((value) => ({
              label: t(`terms.${value}`),
              value,
            }))}
            value={paymentTerm}
          />
          <SelectField
            label={t("fields.status")}
            name="status"
            onValueChange={(value) => onStatusChange(value as "draft" | "confirmed")}
            options={[
              { label: t("status.confirmed"), value: "confirmed" },
              { label: t("status.draft"), value: "draft" },
            ]}
            value={status}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PurchaseOrderItemsCard({
  addItem,
  errors,
  items,
  removeItem,
  updateItem,
}: {
  addItem: () => void;
  errors: FieldErrors;
  items: Array<{ id: string; name: string; quantity: string; sku: string; unitCost: string }>;
  removeItem: (itemId: string) => void;
  updateItem: (
    itemId: string,
    input: Partial<{ name: string; quantity: string; sku: string; unitCost: string }>,
  ) => void;
}) {
  const t = useTranslations("dashboard.suppliers.purchaseOrder");

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading description={t("itemsDescription")} title={t("itemsTitle")} />
          <Button className="h-9 justify-center px-3" onClick={addItem} type="button" variant="outline">
            <Plus className="size-4" />
            {t("addItem")}
          </Button>
        </div>

        <div className="grid gap-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 border border-border bg-background p-3 xl:grid-cols-[minmax(180px,1fr)_150px_110px_150px_auto]"
            >
              <ControlledField
                error={errors[`items.${index}.name`]}
                icon={Package}
                label={t("fields.itemName")}
                onChange={(value) => updateItem(item.id, { name: value })}
                placeholder={t("placeholders.itemName")}
                value={item.name}
              />
              <ControlledField
                error={errors[`items.${index}.sku`]}
                icon={Hash}
                label={t("fields.sku")}
                onChange={(value) => updateItem(item.id, { sku: value })}
                placeholder={t("placeholders.sku")}
                value={item.sku}
              />
              <ControlledField
                error={errors[`items.${index}.quantity`]}
                label={t("fields.quantity")}
                onChange={(value) => updateItem(item.id, { quantity: value })}
                placeholder="12"
                type="number"
                value={item.quantity}
              />
              <ControlledField
                error={errors[`items.${index}.unitCost`]}
                icon={CurrencyDollar}
                label={t("fields.unitCost")}
                onChange={(value) => updateItem(item.id, { unitCost: value })}
                placeholder="89,90"
                value={item.unitCost}
              />
              <Button
                aria-label={t("removeItem")}
                className="h-10 self-end px-3"
                onClick={() => removeItem(item.id)}
                type="button"
                variant="outline"
              >
                <Trash className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {errors.items ? <p className="text-xs text-destructive">{errors.items}</p> : null}
      </CardContent>
    </Card>
  );
}

function PurchaseOrderNotesCard({ error }: { error?: string }) {
  const t = useTranslations("dashboard.suppliers.purchaseOrder");

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <SectionHeading description={t("notesDescription")} title={t("notesTitle")} />
        <div className="grid gap-1.5">
          <Label htmlFor="notes">{t("fields.notes")}</Label>
          <Textarea
            className="min-h-28 bg-card"
            id="notes"
            name="notes"
            placeholder={t("placeholders.notes")}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function PurchaseOrderSummaryRail({
  items,
  suppliers,
}: {
  items: Array<{ quantity: string; unitCost: string }>;
  suppliers: Supplier[];
}) {
  const t = useTranslations("dashboard.suppliers.purchaseOrder");
  const totalItems = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const totalCost = items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0) *
        Number(item.unitCost.replace(/\./g, "").replace(",", ".") || 0),
    0,
  );

  return (
    <aside className="grid content-start gap-3">
      <Card className="bg-secondary text-secondary-foreground">
        <CardContent className="grid gap-3 p-4">
          <Badge className="w-fit" variant="default">
            {t("summary.badge")}
          </Badge>
          <h2 className="text-lg font-bold">{t("summary.title")}</h2>
          <p className="text-xs leading-5 text-white/80">{t("summary.description")}</p>
          <div className="grid gap-2 pt-2">
            <SummaryRow label={t("summary.suppliers")} value={String(suppliers.length)} />
            <SummaryRow label={t("summary.items")} value={String(totalItems)} />
            <SummaryRow label={t("summary.total")} value={formatMoney(totalCost)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-4">
          <h2 className="text-base font-semibold text-foreground">{t("checklist.title")}</h2>
          {[t("checklist.supplier"), t("checklist.items"), t("checklist.delivery")].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <NotePencil className="size-4 text-primary" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-white/80">{label}</span>
      <strong className="text-sm font-semibold">{value}</strong>
    </div>
  );
}

function FormField({
  error,
  icon: Icon,
  label,
  name,
  placeholder,
  type = "text",
}: {
  error?: string;
  icon: IconComponent;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 bg-card pl-9"
          id={name}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ControlledField({
  error,
  icon: Icon,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  icon?: IconComponent;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        <Input
          className={cn("h-10 bg-card", Icon && "pl-9")}
          min={type === "number" ? 1 : undefined}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </div>
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
  placeholder,
  value,
}: {
  error?: string;
  label: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  value?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {name && value ? <input name={name} type="hidden" value={value} /> : null}
      <Select
        name={value ? undefined : name}
        onValueChange={onValueChange}
        value={value}
      >
        <SelectTrigger className="h-10 bg-card">
          <SelectValue placeholder={placeholder} />
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

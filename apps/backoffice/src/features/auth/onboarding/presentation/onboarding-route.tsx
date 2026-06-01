"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import {
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
  cn,
} from "@thalya-modas/ui";
import {
  BuildingsIcon,
  CalendarBlankIcon,
  CaretRightIcon,
  CheckIcon,
  ClockIcon,
  HashIcon,
  InfoIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PhoneIcon,
  PlusIcon,
  SealCheckIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";

import { lookupAddressByCep } from "@/src/shared/api/cep-client";
import { ApiRequestError } from "@/src/shared/api/http-client";
import { useAppUiStore } from "@/src/shared/state/app-ui-store";
import { MaskedInput } from "@/src/shared/ui/masked-input";

import {
  completeOnboarding,
  saveStoreAddress,
  saveStorePreferences,
  saveStoreProfile,
} from "../application/onboarding-api";
import { useOnboardingStore } from "../application/onboarding-store";
import {
  onboardingContent,
  onboardingRoutes,
  onboardingStepOrder,
  storeCurrencies,
  storeLanguages,
  storeSegments,
  storeTimezones,
  type OnboardingStep,
} from "../domain/onboarding-content";
import {
  storeAddressSchema,
  storePreferencesSchema,
  storeProfileSchema,
  type StoreAddressInput,
  type StoreProfileInput,
} from "../domain/onboarding-schemas";

type FieldErrors = Record<string, string>;

type OnboardingRouteProps = {
  step: OnboardingStep;
};

type FieldIconProps = {
  icon: ComponentType<{ className?: string }>;
};

const stepLabel: Record<OnboardingStep, string> = {
  address: "Endereco",
  completed: "Concluido",
  preferences: "Preferencias",
  profile: "Perfil",
};

function FieldIcon({ icon: Icon }: FieldIconProps) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center text-muted-foreground">
      <Icon className="size-[18px]" />
    </span>
  );
}

function OnboardingShell({
  children,
  step,
}: {
  children: ReactNode;
  step: OnboardingStep;
}) {
  const content = onboardingContent[step];

  return (
    <main className="grid min-h-screen place-items-center bg-muted/70 px-5 py-10 text-foreground sm:px-8 lg:px-16">
      <section className="grid w-full max-w-[560px] gap-[18px]">
        <StepIndicator step={step} />

        <Card className="w-full animate-nitro-slide-up">
          <CardContent className="grid gap-[22px] p-6 sm:p-8">
            <header className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center bg-primary text-primary-foreground">
                <StorefrontIcon className="size-5" weight="bold" />
              </div>
              <div className="grid min-w-0 gap-1">
                <h1 className="text-2xl font-bold leading-tight text-foreground">
                  {content.title}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  {content.description}
                </p>
              </div>
            </header>

            {children}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function StepIndicator({ step }: { step: OnboardingStep }) {
  const activeIndex = onboardingStepOrder.indexOf(step);

  return (
    <div className="flex w-full justify-end gap-2" aria-label="Onboarding progress">
      {onboardingStepOrder.map((item, index) => (
        <div
          key={item}
          className={cn(
            "h-1.5 border border-border bg-muted transition-[width,background-color,border-color] duration-base ease-nitro",
            index <= activeIndex && "border-primary bg-primary",
            index === activeIndex ? "w-14" : "w-[34px]",
          )}
          title={stepLabel[item]}
        />
      ))}
    </div>
  );
}

function Field({
  autoComplete,
  defaultValue,
  error,
  icon,
  inputMode,
  label,
  mask,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  icon?: ComponentType<{ className?: string }>;
  inputMode?: "email" | "numeric" | "tel" | "text";
  label: string;
  mask?: string | { mask: string }[];
  name: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  value?: string;
}) {
  const inputClassName = cn("h-11", icon && "pl-10", error && "border-destructive");

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        {icon ? <FieldIcon icon={icon} /> : null}
        {mask ? (
          <MaskedInput
            id={name}
            name={name}
            autoComplete={autoComplete}
            className={inputClassName}
            inputMode={inputMode}
            mask={mask}
            onValueChange={onChange}
            placeholder={placeholder}
            type={type}
            value={value ?? defaultValue}
          />
        ) : (
          <Input
            id={name}
            name={name}
            autoComplete={autoComplete}
            className={inputClassName}
            defaultValue={defaultValue}
            inputMode={inputMode}
            onChange={onChange ? (event) => onChange(event.target.value) : undefined}
            placeholder={placeholder}
            type={type}
            value={value}
          />
        )}
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
  value,
}: {
  error?: string;
  label: string;
  name: string;
  onValueChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  value: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} onValueChange={onValueChange} value={value}>
        <SelectTrigger id={name} className={cn("h-11", error && "border-destructive")}>
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

function FormError({ children }: { children: ReactNode }) {
  return (
    <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}

function SubmitButton({
  children,
  isPending,
}: {
  children: ReactNode;
  isPending: boolean;
}) {
  return (
    <Button className="h-11 w-full justify-center" disabled={isPending} type="submit">
      {children}
      <CaretRightIcon className="size-4" weight="bold" />
    </Button>
  );
}

function getFormData(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function getZodErrors(error: unknown): FieldErrors {
  if (!error || typeof error !== "object" || !("issues" in error)) return {};

  const issues = (error as { issues: { path: PropertyKey[]; message: string }[] }).issues;
  return issues.reduce<FieldErrors>((acc, issue) => {
    const key = String(issue.path[0] ?? "");
    if (key && !acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.payload.userMessage ?? error.payload.message ?? "Nao foi possivel salvar.";
  }

  return "Nao foi possivel salvar.";
}

function StoreProfileStep() {
  const router = useRouter();
  const content = onboardingContent.profile;
  const profile = useOnboardingStore((state) => state.profile);
  const setProfile = useOnboardingStore((state) => state.setProfile);
  const [segment, setSegment] = useState<StoreProfileInput["segment"]>(profile.segment);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: saveStoreProfile,
    onSuccess: () => router.push(onboardingRoutes.address),
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = storeProfileSchema.safeParse({
      ...getFormData(event.currentTarget),
      segment,
    });

    if (!result.success) {
      setErrors(getZodErrors(result.error));
      return;
    }

    setErrors({});
    setProfile(result.data);
    mutation.mutate(result.data);
  }

  return (
    <OnboardingShell step="profile">
      <form className="grid gap-[22px]" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            defaultValue={profile.storeName}
            error={errors.storeName}
            icon={StorefrontIcon}
            label={content.fields.storeName}
            name="storeName"
          />
          <Field
            defaultValue={profile.phone}
            error={errors.phone}
            icon={PhoneIcon}
            inputMode="tel"
            label={content.fields.phone}
            mask={[{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }]}
            name="phone"
          />
        </div>

        <Field
          defaultValue={profile.document}
          error={errors.document}
          icon={SealCheckIcon}
          inputMode="numeric"
          label={content.fields.document}
          mask={[{ mask: "000.000.000-00" }, { mask: "00.000.000/0000-00" }]}
          name="document"
        />

        <SelectField
          error={errors.segment}
          label={content.fields.segment}
          name="segment"
          onValueChange={(value) => setSegment(value as StoreProfileInput["segment"])}
          options={storeSegments}
          value={segment}
        />

        {formError ? <FormError>{formError}</FormError> : null}

        <SubmitButton isPending={mutation.isPending}>{content.action}</SubmitButton>
      </form>
    </OnboardingShell>
  );
}

function StoreAddressStep() {
  const router = useRouter();
  const content = onboardingContent.address;
  const address = useOnboardingStore((state) => state.address);
  const setAddress = useOnboardingStore((state) => state.setAddress);
  const [cepQuery, setCepQuery] = useQueryState("cep", {
    defaultValue: address.zipCode,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "not-found">("idle");

  const zipDigits = useMemo(() => address.zipCode.replace(/\D/g, ""), [address.zipCode]);

  const mutation = useMutation({
    mutationFn: saveStoreAddress,
    onSuccess: () => router.push(onboardingRoutes.preferences),
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  useEffect(() => {
    if (zipDigits.length !== 8) {
      return;
    }

    let canceled = false;

    lookupAddressByCep(zipDigits)
      .then((address) => {
        if (canceled) return;
        if (!address) {
          setLookupStatus("not-found");
          return;
        }

        setAddress({
          city: address.city,
          neighborhood: address.neighborhood,
          state: address.state,
          street: address.street,
          zipCode: address.zipCode,
        });
        setLookupStatus("idle");
      })
      .catch(() => {
        if (!canceled) setLookupStatus("not-found");
      });

    return () => {
      canceled = true;
    };
  }, [setAddress, zipDigits]);

  useEffect(() => {
    const queryDigits = cepQuery.replace(/\D/g, "");
    if (queryDigits.length === 8 && queryDigits !== zipDigits) {
      setAddress({ zipCode: queryDigits });
    }
  }, [cepQuery, setAddress, zipDigits]);

  function updateValue(name: keyof StoreAddressInput, value: string) {
    if (name === "zipCode") {
      const digits = value.replace(/\D/g, "");
      setLookupStatus(digits.length === 8 ? "loading" : "idle");
      void setCepQuery(digits);
    }

    setAddress({ [name]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = storeAddressSchema.safeParse({
      ...getFormData(event.currentTarget),
      ...address,
    });

    if (!result.success) {
      setErrors(getZodErrors(result.error));
      return;
    }

    setErrors({});
    setAddress(result.data);
    mutation.mutate(result.data);
  }

  const lookupMessage =
    lookupStatus === "loading"
      ? content.lookupLoading
      : lookupStatus === "not-found"
        ? content.lookupNotFound
        : content.lookupIdle;

  return (
    <OnboardingShell step="address">
      <form className="grid gap-[22px]" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            error={errors.zipCode}
            icon={MapPinIcon}
            inputMode="numeric"
            label={content.fields.zipCode}
            mask="00000-000"
            name="zipCode"
            onChange={(value) => updateValue("zipCode", value)}
            value={address.zipCode}
          />
          <Field
            error={errors.number}
            icon={HashIcon}
            inputMode="numeric"
            label={content.fields.number}
            name="number"
            onChange={(value) => updateValue("number", value)}
            value={address.number}
          />
        </div>

        <p
          className={cn(
            "-mt-3 text-xs text-muted-foreground",
            lookupStatus === "not-found" && "text-destructive",
          )}
        >
          {lookupMessage}
        </p>

        <Field
          error={errors.street}
          icon={NavigationArrowIcon}
          label={content.fields.street}
          name="street"
          onChange={(value) => updateValue("street", value)}
          value={address.street}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            error={errors.neighborhood}
            icon={MapPinIcon}
            label={content.fields.neighborhood}
            name="neighborhood"
            onChange={(value) => updateValue("neighborhood", value)}
            value={address.neighborhood}
          />
          <Field
            error={errors.complement}
            icon={PlusIcon}
            label={content.fields.complement}
            name="complement"
            onChange={(value) => updateValue("complement", value)}
            value={address.complement ?? ""}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            error={errors.city}
            icon={BuildingsIcon}
            label={content.fields.city}
            name="city"
            onChange={(value) => updateValue("city", value)}
            value={address.city}
          />
          <Field
            error={errors.state}
            icon={MapPinIcon}
            label={content.fields.state}
            name="state"
            onChange={(value) => updateValue("state", value)}
            value={address.state}
          />
        </div>

        {formError ? <FormError>{formError}</FormError> : null}

        <SubmitButton isPending={mutation.isPending}>{content.action}</SubmitButton>
      </form>
    </OnboardingShell>
  );
}

function StorePreferencesStep() {
  const router = useRouter();
  const content = onboardingContent.preferences;
  const preferences = useOnboardingStore((state) => state.preferences);
  const setPreferences = useOnboardingStore((state) => state.setPreferences);
  const setActiveStore = useAppUiStore((state) => state.setActiveStore);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: Parameters<typeof saveStorePreferences>[0]) => {
      await saveStorePreferences(input);
      return completeOnboarding();
    },
    onSuccess: (progress) => {
      if (progress.store) {
        setActiveStore({
          id: progress.store.id,
          name: progress.store.name,
        });
      }

      router.push(onboardingRoutes.completed);
    },
    onError: (error) => setFormError(getApiErrorMessage(error)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = storePreferencesSchema.safeParse({
      ...getFormData(event.currentTarget),
      currency: preferences.currency,
      language: preferences.language,
      timezone: preferences.timezone,
    });

    if (!result.success) {
      setErrors(getZodErrors(result.error));
      return;
    }

    setErrors({});
    setPreferences(result.data);
    mutation.mutate(result.data);
  }

  return (
    <OnboardingShell step="preferences">
      <form className="grid gap-[22px]" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            error={errors.currency}
            label={content.fields.currency}
            name="currency"
            onValueChange={(value) => setPreferences({ currency: value as "BRL" })}
            options={storeCurrencies}
            value={preferences.currency}
          />
          <SelectField
            error={errors.language}
            label={content.fields.language}
            name="language"
            onValueChange={(value) => setPreferences({ language: value as "pt-BR" })}
            options={storeLanguages}
            value={preferences.language}
          />
        </div>

        <SelectField
          error={errors.timezone}
          label={content.fields.timezone}
          name="timezone"
          onValueChange={(value) =>
            setPreferences({
              timezone: value as "America/Fortaleza" | "America/Sao_Paulo",
            })
          }
          options={storeTimezones}
          value={preferences.timezone}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            error={errors.openingTime}
            icon={CalendarBlankIcon}
            label={content.fields.openingTime}
            name="openingTime"
            onChange={(value) => setPreferences({ openingTime: value })}
            type="time"
            value={preferences.openingTime}
          />
          <Field
            error={errors.closingTime}
            icon={ClockIcon}
            label={content.fields.closingTime}
            name="closingTime"
            onChange={(value) => setPreferences({ closingTime: value })}
            type="time"
            value={preferences.closingTime}
          />
        </div>

        <div className="flex gap-2.5 border border-border bg-muted p-3 text-sm text-muted-foreground">
          <InfoIcon className="mt-0.5 size-[18px] shrink-0 text-primary" />
          <span>{content.helper}</span>
        </div>

        {formError ? <FormError>{formError}</FormError> : null}

        <SubmitButton isPending={mutation.isPending}>{content.action}</SubmitButton>
      </form>
    </OnboardingShell>
  );
}

function CompletedStep() {
  const content = onboardingContent.completed;

  return (
    <OnboardingShell step="completed">
      <div className="grid gap-[22px]">
        <div className="flex items-center gap-4 border border-[#1A3300] bg-[#DDF0C9] p-4 text-[#1A3300]">
          <div className="grid size-14 shrink-0 place-items-center bg-card">
            <CheckIcon className="size-7" weight="bold" />
          </div>
          <div className="grid gap-1">
            <h2 className="text-lg font-bold">{content.successTitle}</h2>
            <p className="text-sm leading-6">{content.successDescription}</p>
          </div>
        </div>

        <Button asChild className="h-11 w-full justify-center">
          <Link href={onboardingRoutes.dashboard}>{content.primaryAction}</Link>
        </Button>
        <Button asChild className="h-11 w-full justify-center" variant="outline">
          <Link href={onboardingRoutes.profile}>{content.secondaryAction}</Link>
        </Button>
      </div>
    </OnboardingShell>
  );
}

export function OnboardingRoute({ step }: OnboardingRouteProps) {
  if (step === "address") return <StoreAddressStep />;
  if (step === "preferences") return <StorePreferencesStep />;
  if (step === "completed") return <CompletedStep />;

  return <StoreProfileStep />;
}

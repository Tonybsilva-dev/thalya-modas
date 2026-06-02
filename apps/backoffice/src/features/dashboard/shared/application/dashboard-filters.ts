"use client";

import { useCallback } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

import type { DashboardListQuery } from "./dashboard-api";

type DashboardListFilterOptions = {
  statusKey?: string;
  statusDefault?: string;
};

const pageParser = parseAsInteger.withDefault(1);
const perPageParser = parseAsInteger.withDefault(20);
const periodParser = parseAsString.withDefault("");
const searchParser = parseAsString.withDefault("");
const statusParser = parseAsString.withDefault("all");

function normalizeFilterValue(value: string | null) {
  return value && value !== "all" ? value : null;
}

function useDashboardListFilters(options: DashboardListFilterOptions = {}) {
  const statusKey = options.statusKey ?? "status";
  const [q, setQState] = useQueryState("q", searchParser);
  const [status, setStatusState] = useQueryState(
    statusKey,
    options.statusDefault
      ? parseAsString.withDefault(options.statusDefault)
      : statusParser,
  );
  const [period, setPeriodState] = useQueryState("period", periodParser);
  const [page, setPage] = useQueryState("page", pageParser);
  const [perPage, setPerPage] = useQueryState("perPage", perPageParser);

  const resetPage = useCallback(() => {
    if (page !== 1) {
      void setPage(1);
    }
  }, [page, setPage]);

  const setQ = useCallback(
    (value: string | null) => {
      resetPage();
      return setQState(value || null);
    },
    [resetPage, setQState],
  );

  const setStatus = useCallback(
    (value: string | null) => {
      resetPage();
      return setStatusState(normalizeFilterValue(value));
    },
    [resetPage, setStatusState],
  );

  const setPeriod = useCallback(
    (value: string | null) => {
      resetPage();
      return setPeriodState(normalizeFilterValue(value));
    },
    [resetPage, setPeriodState],
  );

  const query: DashboardListQuery = {
    page,
    period,
    perPage,
    q,
    status,
  };

  return {
    page,
    period,
    perPage,
    q,
    query,
    setPage,
    setPeriod,
    setPerPage,
    setQ,
    setStatus,
    status,
  };
}

export function useOrdersFilters() {
  return useDashboardListFilters();
}

export function useInventoryFilters() {
  return useDashboardListFilters({ statusKey: "filter" });
}

export function useCustomersFilters() {
  return useDashboardListFilters({ statusKey: "segment" });
}

export function useSuppliersFilters() {
  return useDashboardListFilters({ statusKey: "filter" });
}

export function useReportsFilters() {
  return useDashboardListFilters();
}

export function useDashboardSearchFilter() {
  const [q, setQ] = useQueryState("q", searchParser);

  return {
    q,
    setQ,
  };
}

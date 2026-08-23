import type { ReactNode } from "react";
import type { AsyncState } from "@/hooks/useAsync";
import { ErrorState } from "./ErrorState";
import { CardSkeleton } from "./Skeleton";

interface DataStateProps<T> {
  state: AsyncState<T>;
  skeleton?: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Renders the four canonical states (loading / error / empty / content) for
 * any `useAsync` result, so every page handles them consistently.
 */
export function DataState<T>({ state, skeleton, isEmpty, empty, children }: DataStateProps<T>) {
  const { data, loading, error, refetch } = state;

  if (loading && data === undefined) {
    return <>{skeleton ?? <CardSkeleton />}</>;
  }
  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }
  if (data === undefined) {
    return <>{empty}</>;
  }
  if (isEmpty?.(data) && empty) {
    return <>{empty}</>;
  }
  return <>{children(data)}</>;
}

import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { parseApiError, type ApiError } from "@/lib/api-client";

interface UseApiQueryOptions<TData>
  extends Omit<UseQueryOptions<TData, ApiError, TData, QueryKey>, "queryKey" | "queryFn"> {
  queryKey: QueryKey;
  request: () => Promise<TData>;
  showErrorToast?: boolean;
  errorTitle?: string;
}

export function useApiQuery<TData>({
  queryKey,
  request,
  showErrorToast = false,
  errorTitle = "Unable to load data",
  ...options
}: UseApiQueryOptions<TData>) {
  return useQuery<TData, ApiError>({
    queryKey,
    ...options,
    queryFn: async () => {
      try {
        return await request();
      } catch (error) {
        const parsed = parseApiError(error);

        if (showErrorToast) {
          toast({
            variant: "destructive",
            title: errorTitle,
            description: parsed.safeMessage,
          });
        }

        throw parsed;
      }
    },
  });
}

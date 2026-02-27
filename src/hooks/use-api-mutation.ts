import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { parseApiError, type ApiError } from "@/lib/api-client";

interface UseApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, ApiError, TVariables>, "mutationFn"> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  showErrorToast?: boolean;
  errorTitle?: string;
}

export function useApiMutation<TData, TVariables>({
  mutationFn,
  showErrorToast = true,
  errorTitle = "Action failed",
  ...options
}: UseApiMutationOptions<TData, TVariables>) {
  return useMutation<TData, ApiError, TVariables>({
    ...options,
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
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

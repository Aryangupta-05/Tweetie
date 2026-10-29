import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useAction(mutationFn, onSuccess) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      onSuccess?.(data, variables);
      await Promise.all(["posts", "search", "profile", "stats", "connections", "suggested", "notifications", "authUser"].map(key => client.invalidateQueries({ queryKey: [key] })));
    },
    onError: error => toast.error(error.message),
  });
}

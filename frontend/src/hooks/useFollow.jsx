import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;

const useFollow = () => {
	const queryClient = useQueryClient();

	const { mutate: follow, isPending } = useMutation({
		mutationFn: async (userId) => {
			const res = await fetch(`${BASE_URL}/api/users/follow/${userId}`, {
				method: "POST",
				credentials: "include",
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong!");
		},
		onSuccess: () => {
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
			]);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { follow, isPending };
};

export default useFollow;

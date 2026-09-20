import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "../services/feedService";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 1 }) => {
      return getFeed(pageParam, 10);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,
  });
};

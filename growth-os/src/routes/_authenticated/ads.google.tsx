import { createFileRoute } from "@tanstack/react-router";
import { AdsSurface, entOpts, recOpts } from "./ads.meta";

export const Route = createFileRoute("/_authenticated/ads/google")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(entOpts("google")),
      context.queryClient.ensureQueryData(recOpts("google")),
    ]);
  },
  component: () => <AdsSurface platform="google" />,
});

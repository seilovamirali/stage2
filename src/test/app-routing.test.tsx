import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches the book page under the authenticated layout", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/book");
    expect(matches.some((match) => match.routeId.includes("book"))).toBe(true);
  });

  it("matches habit management and does not keep the old reader", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/manage").some((match) => match.routeId.includes("manage"))).toBe(true);
    expect(router.matchRoutes("/reader").every((match) => !match.routeId.includes("reader"))).toBe(true);
    expect(router.matchRoutes("/jawshan").every((match) => !match.routeId.includes("jawshan"))).toBe(true);
  });
});

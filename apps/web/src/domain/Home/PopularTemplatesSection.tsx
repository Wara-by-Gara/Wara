"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TemplateCard } from "@/components/domain";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { getTemplates } from "@/lib/api/templates";
import { POPULAR_TEMPLATE_CATALOG } from "@/lib/popularTemplates";
import { TemplateRowSkeleton } from "@/components/domain/Skeleton";
import { ROUTES } from "@/constants/routes";

export function PopularTemplatesSection() {
  const router = useRouter();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const templateByName = useMemo(
    () => new Map(templates.map((t) => [t.name, t])),
    [templates],
  );

  const items = useMemo(
    () =>
      POPULAR_TEMPLATE_CATALOG.map((catalog) => {
        const apiTemplate = templateByName.get(catalog.name);
        return {
          id: apiTemplate?.id ?? catalog.name,
          name: catalog.name,
          imageUrl: apiTemplate?.previewImageKey ?? catalog.imageUrl,
          canNavigate: Boolean(apiTemplate?.id),
        };
      }),
    [templateByName],
  );

  return (
    <section className="home-section">
      <SectionHeader heading="인기 초대장" />
      <div className="home-section-content">
        {isLoading ? (
          <TemplateRowSkeleton count={10} />
        ) : (
          <div className="-mx-page flex gap-3 overflow-x-auto overscroll-x-contain px-page pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((t) => (
              <TemplateCard
                key={t.id}
                imageAspect="square"
                name={t.name}
                imageUrl={t.imageUrl}
                className="w-[140px] shrink-0"
                onClick={
                  t.canNavigate
                    ? () =>
                        router.push(
                          `${ROUTES.INVITATIONS.CREATE}?templateId=${t.id}`,
                        )
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

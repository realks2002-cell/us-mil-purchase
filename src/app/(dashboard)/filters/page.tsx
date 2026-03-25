import { Header } from "@/components/layout/header";
import { FilterList } from "@/components/filters/filter-list";
import { getFilters } from "@/lib/services/filters";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FiltersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const filters = await getFilters(session.user.id);

  return (
    <>
      <Header title="맞춤 필터" description="관심 분야별 입찰 공고 모니터링 필터 설정" />
      <FilterList filters={filters} />
    </>
  );
}

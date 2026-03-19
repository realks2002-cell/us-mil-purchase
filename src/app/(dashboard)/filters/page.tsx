import { Header } from "@/components/layout/header";

const filters = [
  {
    id: 1,
    name: "캠프 험프리스 시설관리",
    keywords: ["Camp Humphreys", "Humphreys", "facility", "maintenance"],
    naicsCodes: ["561210", "238220", "561720"],
    noticeTypes: ["Solicitation", "Presolicitation"],
    setAsides: ["Full and Open"],
    isActive: true,
    notifyEmail: true,
    matchCount: 23,
    lastMatch: "2024-03-19 09:30",
  },
  {
    id: 2,
    name: "IT/통신 프로젝트",
    keywords: ["IT", "information technology", "network", "cyber", "DISA"],
    naicsCodes: ["541512", "541513", "517312"],
    noticeTypes: ["Solicitation", "Combined Synopsis/Solicitation"],
    setAsides: [],
    isActive: true,
    notifyEmail: true,
    matchCount: 15,
    lastMatch: "2024-03-18 14:20",
  },
  {
    id: 3,
    name: "건설/리노베이션",
    keywords: ["construction", "renovation", "repair", "building"],
    naicsCodes: ["236220", "237310", "238910"],
    noticeTypes: ["Solicitation"],
    setAsides: ["Full and Open"],
    isActive: true,
    notifyEmail: false,
    matchCount: 41,
    lastMatch: "2024-03-19 11:15",
  },
  {
    id: 4,
    name: "급식/식품 서비스",
    keywords: ["food service", "dining", "meal", "catering"],
    naicsCodes: ["722310", "722320"],
    noticeTypes: ["Solicitation", "Sources Sought"],
    setAsides: ["Small Business"],
    isActive: false,
    notifyEmail: true,
    matchCount: 8,
    lastMatch: "2024-03-15 08:45",
  },
  {
    id: 5,
    name: "환경/에너지",
    keywords: ["environmental", "remediation", "energy", "water treatment"],
    naicsCodes: ["562910", "221310", "541620"],
    noticeTypes: ["Solicitation", "Presolicitation"],
    setAsides: [],
    isActive: true,
    notifyEmail: true,
    matchCount: 12,
    lastMatch: "2024-03-17 16:00",
  },
];

export default function FiltersPage() {
  return (
    <>
      <Header title="맞춤 필터" description="관심 분야별 입찰 공고 모니터링 필터 설정" />

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          총 {filters.length}개 필터 · 활성 {filters.filter((f) => f.isActive).length}개
        </div>
        <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          + 새 필터 만들기
        </button>
      </div>

      <div className="space-y-4">
        {filters.map((filter) => (
          <div
            key={filter.id}
            className={`rounded-xl border bg-card overflow-hidden transition-colors ${
              filter.isActive ? "border-border" : "border-border opacity-60"
            }`}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    filter.isActive ? "bg-success" : "bg-muted-foreground"
                  }`}
                />
                <div>
                  <h3 className="font-semibold">{filter.name}</h3>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>매칭 {filter.matchCount}건</span>
                    <span>·</span>
                    <span>최근 매칭: {filter.lastMatch}</span>
                    {filter.notifyEmail && (
                      <>
                        <span>·</span>
                        <span className="text-primary">이메일 알림 ON</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 rounded-md border border-input px-3 text-xs hover:bg-secondary transition-colors">
                  수정
                </button>
                <button className="h-8 rounded-md border border-input px-3 text-xs hover:bg-secondary transition-colors">
                  {filter.isActive ? "비활성화" : "활성화"}
                </button>
                <button className="h-8 rounded-md border border-input px-3 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                  삭제
                </button>
              </div>
            </div>

            <div className="border-t border-border bg-secondary/30 px-6 py-3">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">키워드:</span>{" "}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {filter.keywords.map((kw) => (
                      <span key={kw} className="rounded bg-secondary px-2 py-0.5 text-xs font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">NAICS:</span>{" "}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {filter.naicsCodes.map((code) => (
                      <span key={code} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">공고 유형:</span>{" "}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {filter.noticeTypes.map((type) => (
                      <span key={type} className="rounded bg-secondary px-2 py-0.5 text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                {filter.setAsides.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Set-Aside:</span>{" "}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {filter.setAsides.map((sa) => (
                        <span key={sa} className="rounded bg-secondary px-2 py-0.5 text-xs">
                          {sa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Filter Modal Mockup */}
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/50 p-8">
        <h3 className="mb-6 text-lg font-semibold">새 필터 만들기 (모달 프리뷰)</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">필터 이름</label>
            <input
              type="text"
              placeholder="예: 캠프 험프리스 건설"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">키워드 (쉼표 구분)</label>
            <input
              type="text"
              placeholder="Camp Humphreys, construction, building"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">NAICS 코드</label>
            <input
              type="text"
              placeholder="236220, 238220"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">공고 유형</label>
            <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" multiple>
              <option>Solicitation</option>
              <option>Presolicitation</option>
              <option>Combined Synopsis/Solicitation</option>
              <option>Sources Sought</option>
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded accent-primary" defaultChecked />
              필터 활성화
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded accent-primary" defaultChecked />
              이메일 알림 수신
            </label>
          </div>
          <div className="col-span-2">
            <button className="h-10 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              필터 저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

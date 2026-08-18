import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";

type Department = {
  name: string;
  projects: string[];
};

type Bureau = {
  name: string;
  departments: Department[];
};

const organization: Bureau[] = [
  {
    name: "문화관광국",
    departments: [
      {
        name: "문화예술과",
        projects: [
          "동탄복합문화센터 공간개선",
          "화성예술의전당 소공연장 조성",
          "시립미술관 건립",
          "농수산대학 유휴부지를 활용한 중규모 공연장 건립",
          "화성시 테마(어린이) 과학관 건립사업",
          "공룡(자연) 과학센터 건립 사업",
          "석우동 51번지 복합문화시설 건립",
          "아트큐브&예술숲&건립",
        ],
      },
      {
        name: "문화유산과",
        projects: ["화성시역사박물관 건립", "만년제 주변 정비사업"],
      },
      {
        name: "독립기념관",
        projects: ["화성독립운동역사문화공원", "쌍봉산 기념탑 조성"],
      },
      {
        name: "관광진흥과",
        projects: [
          "제부지역 관광 인프라 확충",
          "고렴산 해상공원 조성",
          "궁평 종합관광지 조성",
          "국화도 해안데크 정비사업",
          "서해안 관광지 주차장 조성사업",
          "송교리 주차장 조성사업 (주차장 2곳)",
          "궁평 주차장 조성 사업",
          "제부도 도시계획도로 중로2-3호선 외 3개소 개설",
          "서해안 황금해안길 조성사업",
        ],
      },
    ],
  },
  {
    name: "교육체육국",
    departments: [
      {
        name: "도서관정책과",
        projects: [
          "둥지나래어린이도서관 리모델링",
          "(가칭)다올공원도서관 건립",
          "(가칭)반월도서관 건립",
          "(가칭)화성시 독서문화공간 조성",
        ],
      },
      {
        name: "체육진흥과",
        projects: [
          "비봉체육공원 실내야구연습장 개축공사",
          "비봉체육공원 야구장 개선공사",
          "서부권 파크골프장 조성사업",
          "서해선 교량하부 체육시설 조성공사",
          "비봉 다목적체육관 건립",
          "남양 체육복합센터 조성사업(국민체육센터·다목적체육관)",
          "봉담 생태체육공원 테니스장 설치",
          "화성 동부 반다비 체육센터 건립",
        ],
      },
      {
        name: "전국체전추진단",
        projects: [
          "롤러스포츠 경기장 건립",
          "석우동 축구장 건립",
          "2027년 전국체육대회 경기장 개보수",
        ],
      },
    ],
  },
];

type ProjectField = {
  label: string;
  value: string;
};

const emptyProjectFields: ProjectField[] = [
  { label: "사업기간", value: "입력 대기" },
  { label: "총사업비", value: "입력 대기" },
  { label: "담당부서", value: "입력 대기" },
  { label: "현재 상태", value: "입력 대기" },
  { label: "사업목적", value: "사업 목적 입력 대기" },
  { label: "주요내용", value: "주요내용 입력 대기" },
];

const progressSteps = ["기본계획", "실시설계", "공사착공", "사업완료"];

function InfoCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/75 p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)]">
      <p className="font-body text-[11px] font-semibold tracking-[0.1em] text-[#94a3b8]">{label}</p>
      <p className="mt-4 font-body text-[14px] leading-6 text-[#cbd5e1]">{body}</p>
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/75 p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)] lg:col-span-2">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {emptyProjectFields.slice(0, 4).map((field) => (
            <div key={field.label}>
              <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#94a3b8]">{field.label}</p>
              <p className="mt-2 font-body text-[15px] font-semibold text-[#e2e8f0]">{field.value}</p>
            </div>
          ))}
        </div>
      </div>
      {emptyProjectFields.slice(4).map((field) => (
        <InfoCard key={field.label} label={field.label} body={field.value} />
      ))}
    </div>
  );
}

function ProgressPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/75 p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)]">
        <div className="flex items-center justify-between">
          <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#94a3b8]">단계별 진행률</p>
          <span className="font-body text-[12px] text-[#94a3b8]">데이터 입력 대기</span>
        </div>
        <div className="mt-6 space-y-5">
          {progressSteps.map((step, index) => (
            <div key={step}>
              <div className="mb-2 flex items-center justify-between font-body text-[13px]">
                <span className="font-medium text-[#cbd5e1]">{index + 1}. {step}</span>
                <span className="text-[#64748b]">—</span>
              </div>
              <div className="h-2 rounded-full bg-[#334155]"><div className="h-2 w-0 rounded-full bg-[#60a5fa]" /></div>
            </div>
          ))}
        </div>
      </div>
      <InfoCard label="주요 마일스톤" body="주요 일정과 현재 상태를 등록하면 타임라인으로 표시됩니다." />
    </div>
  );
}

function BudgetPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/75 p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)]">
        <div className="flex items-center justify-between">
          <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#94a3b8]">연도별 예산 집행 차트</p>
          <span className="font-body text-[12px] text-[#94a3b8]">데이터 없음</span>
        </div>
        <div className="mt-6 flex h-44 items-center justify-center rounded-xl border border-dashed border-[#475569] bg-[#172033] font-body text-[13px] text-[#94a3b8]">
          예산 데이터가 등록되면 편성액·집행액·잔액 차트가 표시됩니다.
        </div>
      </div>
      <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/75 p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)]">
        <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#94a3b8]">예산편성 현황</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-[#475569]">
          <div className="grid grid-cols-4 bg-[#172033] px-3 py-2 font-body text-[11px] font-semibold text-[#94a3b8]"><span>연도</span><span>편성액</span><span>집행액</span><span>잔액</span></div>
          <div className="px-3 py-8 text-center font-body text-[12px] text-[#94a3b8]">등록된 예산 내역이 없습니다.</div>
        </div>
      </div>
    </div>
  );
}

function LocationPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <InfoCard label="사업 주소" body="주소 입력 대기" />
      <div className="rounded-2xl border border-[#334155] bg-[#1e293b]/75 p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)]">
        <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#94a3b8]">Google Maps 위치</p>
        <div className="mt-4 flex min-h-44 items-center justify-center rounded-xl border border-dashed border-[#475569] bg-[#172033] text-center font-body text-[13px] leading-6 text-[#94a3b8]">
          주소가 등록되면 Google Maps 현장 위치를 연동합니다.
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [openBureaus, setOpenBureaus] = useState<string[]>(organization.map((item) => item.name));
  const [openDepartments, setOpenDepartments] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("사업개요");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrganization = useMemo(() => {
    if (!normalizedQuery) return organization;
    return organization
      .map((bureau) => ({
        ...bureau,
        departments: bureau.departments
          .map((department) => ({
            ...department,
            projects: department.projects.filter((project) => project.toLowerCase().includes(normalizedQuery)),
          }))
          .filter((department) => department.projects.length > 0 || department.name.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((bureau) => bureau.departments.length > 0 || bureau.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const toggleItem = (items: string[], setItems: (value: string[]) => void, item: string) => {
    setItems(items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {isSidebarOpen && (
        <button
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#334155] bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] transition-all duration-200 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[76px]" : "w-[320px]"}`}
      >
        <div className={`flex min-h-[92px] items-center border-b border-[#334155] bg-[#172033] ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>
          {!isCollapsed && (
            <div>
              <p className="font-display text-[24px] font-bold leading-[1.05] tracking-[-0.055em] text-white">화성시 주요투자사업</p>
              <p className="mt-1 font-body text-[10px] font-semibold tracking-[0.16em] text-[#94a3b8]">INVESTMENT DASHBOARD</p>
            </div>
          )}
          <button
            className="hidden h-9 w-9 items-center justify-center rounded-full text-[#68737e] transition hover:bg-[#e8eef2] hover:text-[#18202a] lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-5 pb-4 pt-5">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa4ad]" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="사업명 검색"
                className="h-10 w-full rounded-xl border border-[#475569] bg-[#0f172a] pl-10 pr-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] font-body text-[13px] outline-none transition placeholder:text-[#64748b] focus:border-[#60a5fa] focus:ring-2 focus:ring-[#1d4ed8]/30"
              />
            </label>
          </div>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
          {visibleOrganization.map((bureau) => {
            const bureauOpen = openBureaus.includes(bureau.name);
            return (
              <div key={bureau.name} className="mb-2">
                <button
                  className={`flex w-full items-center rounded-xl px-3 py-3 text-left transition hover:bg-[#334155] ${isCollapsed ? "justify-center" : "gap-2"}`}
                  onClick={() => toggleItem(openBureaus, setOpenBureaus, bureau.name)}
                  title={isCollapsed ? bureau.name : undefined}
                >
                  {bureauOpen ? <ChevronDown size={15} className="text-[#9aabb6]" /> : <ChevronRight size={15} className="text-[#9aabb6]" />}
                  {!isCollapsed && <span className="font-body text-[15px] font-extrabold tracking-[-0.035em] text-white">{bureau.name}</span>}
                </button>

                {bureauOpen && !isCollapsed && (
                  <div className="ml-3 border-l border-[#475569] pl-3">
                    {bureau.departments.map((department) => {
                      const departmentOpen = openDepartments.includes(`${bureau.name}-${department.name}`);
                      return (
                        <div key={department.name}>
                          <button
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-[#334155]"
                            onClick={() => toggleItem(openDepartments, setOpenDepartments, `${bureau.name}-${department.name}`)}
                          >
                            {departmentOpen ? <ChevronDown size={14} className="text-[#a5b3bd]" /> : <ChevronRight size={14} className="text-[#a5b3bd]" />}
                            <span className="font-body text-[13px] font-bold text-[#cbd5e1]">{department.name}</span>
                            <span className="ml-auto font-body text-[10px] tabular-nums text-[#64748b]">{department.projects.length}</span>
                          </button>

                          {departmentOpen && (
                            <div className="ml-3 border-l border-[#334155] pl-3 pb-1">
                              {department.projects.map((project) => (
                                <button
                                  key={project}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setActiveTab("사업개요");
                                    setIsSidebarOpen(false);
                                  }}
                                  className={`mb-1 flex w-full items-start rounded-lg px-3 py-2.5 text-left transition ${selectedProject === project ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white shadow-[0_8px_18px_rgba(37,99,235,0.28)]" : "text-[#cbd5e1] hover:bg-[#334155] hover:text-white"}`}
                                >
                                  <span className={`mr-2 mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${selectedProject === project ? "bg-[#bfdbfe]" : "bg-[#64748b]"}`} />
                                  <span className="font-body text-[12px] leading-[1.4]">{project}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!isCollapsed && (
          <div className="border-t border-[#334155] px-5 py-4">
            <p className="font-body text-[11px] text-[#94a3b8]">예산심사 업무용 관리 화면</p>
            <p className="mt-1 font-body text-[11px] text-[#64748b]">2개 국 · 7개 부서 · 36개 사업</p>
          </div>
        )}
      </aside>

      <div className={`min-h-screen transition-all duration-200 ${isCollapsed ? "lg:pl-[76px]" : "lg:pl-[320px]"}`}>
        <header className="flex h-[72px] items-center justify-between border-b border-[#334155] bg-[#111827]/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce4e8] bg-white text-[#5d6b75] lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="사이드바 열기"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="font-body text-[11px] font-medium tracking-[0.12em] text-[#94a3b8]">2026 예산심사</p>
              <p className="font-display text-[18px] font-bold tracking-[-0.035em]">주요투자사업 현황관리</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#a6c7d3]" />
            <span className="font-body text-[12px] text-[#94a3b8]">실시간 관리 화면</span>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-72px)] overflow-hidden">
          <div className="pointer-events-none absolute right-[8%] top-[10%] h-36 w-36 rotate-12 rounded-[42%_58%_45%_55%] bg-[#1d4ed8]/20" />
          <div className="pointer-events-none absolute bottom-[14%] right-[17%] h-24 w-24 -rotate-12 rounded-[30%_70%_55%_45%] bg-[#a855f7]/20" />
          <div className="pointer-events-none absolute left-[38%] top-[34%] h-10 w-10 rounded-full border border-[#64748b]/50" />
          {selectedProject ? (
            <section className="relative p-6 lg:p-10">
              <p className="font-body text-[12px] font-medium tracking-[0.12em] text-[#94a3b8]">선택된 주요투자사업</p>
              <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.065em] text-white lg:text-6xl">{selectedProject}</h1>
              <div className="mt-8 flex flex-wrap gap-2 border-b border-[#334155] pb-3">
                {["사업개요", "추진현황", "예산편성", "위치정보", "변경이력"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 font-body text-[13px] transition ${activeTab === tab ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)]" : "text-[#94a3b8] hover:bg-white hover:text-[#33424d]"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mt-7">
                {activeTab === "사업개요" && <OverviewPanel />}
                {activeTab === "추진현황" && <ProgressPanel />}
                {activeTab === "예산편성" && <BudgetPanel />}
                {activeTab === "위치정보" && <LocationPanel />}
                {activeTab === "변경이력" && <InfoCard label="변경이력" body="사업 정보와 예산 수정 이력이 등록되면 이 영역에 표시됩니다." />}
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {isSidebarOpen && (
        <button className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-md lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="사이드바 닫기">
          <X size={18} />
        </button>
      )}
    </div>
  );
}

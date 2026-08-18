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

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [openBureaus, setOpenBureaus] = useState<string[]>(organization.map((item) => item.name));
  const [openDepartments, setOpenDepartments] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#f1f4f6] text-[#18202a]">
      {isSidebarOpen && (
        <button
          aria-label="사이드바 닫기"
          className="fixed inset-0 z-30 bg-[#15202b]/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#dbe2e7] bg-[#f8fafb] transition-all duration-200 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[76px]" : "w-[320px]"}`}
      >
        <div className={`flex min-h-[92px] items-center border-b border-[#e1e7eb] ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>
          {!isCollapsed && (
            <div>
              <p className="font-display text-[21px] font-bold tracking-[-0.04em]">화성시 주요투자사업</p>
              <p className="mt-1 font-body text-[11px] font-medium tracking-[0.1em] text-[#7c8791]">INVESTMENT DASHBOARD</p>
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
                className="h-10 w-full rounded-xl border border-[#dfe6ea] bg-white pl-10 pr-3 font-body text-[13px] outline-none transition placeholder:text-[#aab3ba] focus:border-[#9ebed1] focus:ring-2 focus:ring-[#d7e7ef]"
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
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left transition hover:bg-[#e8f1f5] ${isCollapsed ? "justify-center" : "gap-2"}`}
                  onClick={() => toggleItem(openBureaus, setOpenBureaus, bureau.name)}
                  title={isCollapsed ? bureau.name : undefined}
                >
                  {bureauOpen ? <ChevronDown size={15} className="text-[#9aabb6]" /> : <ChevronRight size={15} className="text-[#9aabb6]" />}
                  {!isCollapsed && <span className="font-body text-[14px] font-bold tracking-[-0.02em]">{bureau.name}</span>}
                </button>

                {bureauOpen && !isCollapsed && (
                  <div className="ml-3 border-l border-[#dfe6ea] pl-3">
                    {bureau.departments.map((department) => {
                      const departmentOpen = openDepartments.includes(`${bureau.name}-${department.name}`);
                      return (
                        <div key={department.name}>
                          <button
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-[#edf3f6]"
                            onClick={() => toggleItem(openDepartments, setOpenDepartments, `${bureau.name}-${department.name}`)}
                          >
                            {departmentOpen ? <ChevronDown size={14} className="text-[#a5b3bd]" /> : <ChevronRight size={14} className="text-[#a5b3bd]" />}
                            <span className="font-body text-[13px] font-semibold text-[#4a5863]">{department.name}</span>
                            <span className="ml-auto font-body text-[10px] tabular-nums text-[#a8b2ba]">{department.projects.length}</span>
                          </button>

                          {departmentOpen && (
                            <div className="ml-3 border-l border-[#edf0f2] pl-3 pb-1">
                              {department.projects.map((project) => (
                                <button
                                  key={project}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setIsSidebarOpen(false);
                                  }}
                                  className={`mb-0.5 flex w-full items-start rounded-md px-3 py-2 text-left transition ${selectedProject === project ? "bg-[#dcecf3] text-[#1d536b]" : "text-[#67737d] hover:bg-[#f0f5f7] hover:text-[#293944]"}`}
                                >
                                  <span className={`mr-2 mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${selectedProject === project ? "bg-[#7eafc4]" : "bg-[#c8d1d6]"}`} />
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
          <div className="border-t border-[#e1e7eb] px-5 py-4">
            <p className="font-body text-[11px] text-[#8a959d]">예산심사 업무용 관리 화면</p>
            <p className="mt-1 font-body text-[11px] text-[#a8b0b6]">2개 국 · 7개 부서 · 36개 사업</p>
          </div>
        )}
      </aside>

      <div className={`min-h-screen transition-all duration-200 ${isCollapsed ? "lg:pl-[76px]" : "lg:pl-[320px]"}`}>
        <header className="flex h-[72px] items-center justify-between border-b border-[#dfe5e9] bg-[#f7f9fa]/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce4e8] bg-white text-[#5d6b75] lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="사이드바 열기"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="font-body text-[11px] font-medium tracking-[0.12em] text-[#8a969f]">2026 예산심사</p>
              <p className="font-display text-[18px] font-bold tracking-[-0.035em]">주요투자사업 현황관리</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#a6c7d3]" />
            <span className="font-body text-[12px] text-[#7d8992]">실시간 관리 화면</span>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-72px)] overflow-hidden">
          <div className="pointer-events-none absolute right-[8%] top-[12%] h-28 w-28 rounded-[38%_62%_58%_42%] bg-[#dbeaf0]/70" />
          <div className="pointer-events-none absolute bottom-[16%] right-[18%] h-20 w-20 rotate-12 rounded-[24px] bg-[#f1dfe3]/60" />
          {selectedProject ? (
            <section className="relative p-6 lg:p-10">
              <p className="font-body text-[12px] font-medium tracking-[0.12em] text-[#8c9aa3]">선택된 주요투자사업</p>
              <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-[-0.055em] text-[#17212a] lg:text-5xl">{selectedProject}</h1>
              <div className="mt-8 rounded-2xl border border-dashed border-[#d5dfe4] bg-white/45 p-8 font-body text-sm text-[#7f8c95]">
                사업을 선택했습니다. 세부 대시보드 콘텐츠가 이 영역에 표시됩니다.
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {isSidebarOpen && (
        <button className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#55636d] shadow-md lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="사이드바 닫기">
          <X size={18} />
        </button>
      )}
    </div>
  );
}

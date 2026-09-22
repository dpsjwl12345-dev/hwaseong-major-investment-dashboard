import { Fragment, useMemo, useState } from "react";
import investmentReviewData from "../data/investment_review.json";

type ReviewRecord = {
  category: string | null;
  department: string;
  year: string;
  project_name: string;
  field: string;
  sector: string;
  overview: string;
  period: string;
  agency: string;
  notice_date: string | null;
  re_review: string | null;
  result: string;
  total_cost: number | null;
  national: number | null;
  province: number | null;
  city: number | null;
  private: number | null;
  etc_fund: number | null;
  local_bond: number | null;
  feasibility_study: string | null;
  result_detail: string;
  accounting: string;
  round: string;
  contact: string;
};

const records = (investmentReviewData as { records: ReviewRecord[] }).records;

function resultTone(result: string): "success" | "warning" | "critical" {
  if (result === "적정") return "success";
  if (result === "조건부") return "warning";
  return "critical"; // 재검토, 부적정
}

function formatEok(value: number | null) {
  return value == null ? "-" : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

// 스프레드시트 셀 줄바꿈을 표 안에서는 한 줄로 눌러 보여주고, 펼친 상세 영역에서만
// 원문 줄바꿈을 그대로 살린다(overview/result_detail은 그대로 둠).
function oneLine(text: string | null) {
  return text ? text.replace(/\s*\n\s*/g, " ").trim() : "-";
}

const FUNDING_LABELS: { key: keyof ReviewRecord; label: string }[] = [
  { key: "national", label: "국비" },
  { key: "province", label: "도비" },
  { key: "city", label: "시비" },
  { key: "private", label: "민자" },
  { key: "etc_fund", label: "기타" },
  { key: "local_bond", label: "지방채" },
];

export function InvestmentReviewBoard() {
  const [tab, setTab] = useState<"현황" | "요구">("현황");
  const [departmentFilter, setDepartmentFilter] = useState("전체");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const departments = useMemo(
    () => ["전체", ...Array.from(new Set(records.map((record) => record.department))).sort((a, b) => a.localeCompare(b, "ko"))],
    [],
  );
  const filtered = departmentFilter === "전체" ? records : records.filter((record) => record.department === departmentFilter);

  return (
    <section className="dept-dashboard ir-board">
      <div className="dept-dashboard-header">
        <div>
          <p className="dept-dashboard-eyebrow">INVESTMENT REVIEW</p>
          <h1>투자심사</h1>
        </div>
      </div>

      <div className="ir-tabs" role="tablist" aria-label="투자심사 화면 전환">
        {(["현황", "요구"] as const).map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? "is-active" : ""} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>

      {tab === "현황" ? (
        <div className="dept-panel">
          <div className="dept-filter-row">
            <label>
              <span>담당부서</span>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                {departments.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <span className="ir-count">{filtered.length}건 (전체 {records.length}건 · 2024년 심사 기준, 단위: 억원)</span>
          </div>
          <div className="ir-table-wrap">
            <table className="ir-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th>담당부서</th>
                  <th>사업명</th>
                  <th>분야</th>
                  <th>사업기간</th>
                  <th>심사기관</th>
                  <th>심사결과</th>
                  <th>총사업비</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, index) => {
                  const rowKey = `${record.department}-${record.project_name}-${index}`;
                  const isOpen = expandedKey === rowKey;
                  return (
                    <Fragment key={rowKey}>
                      <tr className={`ir-row ${isOpen ? "is-open" : ""}`} onClick={() => setExpandedKey(isOpen ? null : rowKey)}>
                        <td>{record.round}</td>
                        <td>{record.department}</td>
                        <td className="ir-project-name">
                          {record.project_name}
                          {record.re_review && <span className="ir-re-review-tag">{record.re_review}</span>}
                        </td>
                        <td>{oneLine(record.field)}</td>
                        <td>{oneLine(record.period)}</td>
                        <td>{record.agency}</td>
                        <td><span className={`ir-result-badge ir-result-${resultTone(record.result)}`}>{record.result}</span></td>
                        <td className="ir-amount">{formatEok(record.total_cost)}</td>
                      </tr>
                      {isOpen && (
                        <tr className="ir-detail-row">
                          <td colSpan={8}>
                            <div className="ir-detail-grid">
                              <div className="ir-detail-block">
                                <span>사업개요</span>
                                <p>{record.overview}</p>
                              </div>
                              <div className="ir-detail-block">
                                <span>재원조달계획(억원)</span>
                                <p>{FUNDING_LABELS.map(({ key, label }) => `${label} ${formatEok(record[key] as number | null)}`).join(" · ")}</p>
                              </div>
                              <div className="ir-detail-block">
                                <span>심사결과 내용</span>
                                <p>{record.result_detail}</p>
                              </div>
                              <div className="ir-detail-block">
                                <span>기타</span>
                                <p>심사일 {oneLine(record.notice_date)} · 회계 {record.accounting} · 담당자 {oneLine(record.contact)}{record.feasibility_study ? " · 타당성조사 대상" : ""}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="pd-note-box ir-empty">등록된 투자심사 요구 자료가 없습니다. 자료가 도착하면 반영됩니다.</div>
      )}
    </section>
  );
}

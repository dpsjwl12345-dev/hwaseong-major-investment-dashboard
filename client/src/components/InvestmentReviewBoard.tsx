import { Fragment, useMemo, useState, type ChangeEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import investmentReviewData from "../data/investment_review.json";
import investmentRequestData from "../data/investment_request.json";

type ReviewRecord = {
  id: string;
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

type FundingRow = { name: string; total_eok: number | null; invested_eok: number | null; y27_eok: number | null; y28_eok: number | null; y29plus_eok: number | null };

type RequestRecord = {
  id: string;
  category: string;
  agenda_no: string;
  department: string;
  division: string;
  project_name: string;
  overview: string;
  period: string;
  total_eok: number | null;
  invested_eok: number | null;
  y27_eok: number | null;
  y28_eok: number | null;
  y29plus_eok: number | null;
  funding: FundingRow[];
};

const reviewRecords = (investmentReviewData as { records: ReviewRecord[] }).records;
const requestRecords = (investmentRequestData as { records: RequestRecord[] }).records;

const DELETED = "_deleted";

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

// 관리자 인라인 편집/삭제 — 기존 "사업 정보 편집"과 같은 override 저장소
// (hwaseong_project_content_overrides)를 그대로 쓴다. 이 표의 행 id는
// dashboard_projects.json 쪽 사업 id와 겹치지 않는 별도 네임스페이스
// (ir-review-*, ir-request-*)라 같은 테이블을 공유해도 충돌하지 않는다.
// 삭제는 실제 row 삭제 대신 payload에 _deleted:true를 심어 필터링한다 —
// 별도 "복구" UI 없이도 다시 관리자 화면에서 override를 지우면 되돌릴 수 있다.
function useRowOverrides<T extends { id: string }>(base: T[]) {
  const overridesQuery = trpc.projectContent.list.useQuery();
  const utils = trpc.useUtils();
  const saveMutation = trpc.projectContent.save.useMutation();

  const records = useMemo(() => {
    const overrideMap = new Map((overridesQuery.data ?? []).map((item) => [item.projectId, item.payload as Record<string, unknown>]));
    return base
      .map((record) => {
        const override = overrideMap.get(record.id);
        if (!override) return record;
        if (override[DELETED]) return null;
        return { ...record, ...override } as T;
      })
      .filter((record): record is T => record !== null);
  }, [base, overridesQuery.data]);

  const save = async (id: string, patch: Record<string, unknown>) => {
    await saveMutation.mutateAsync({ projectId: id, payload: patch });
    await utils.projectContent.list.invalidate();
  };
  const remove = async (id: string) => {
    await saveMutation.mutateAsync({ projectId: id, payload: { [DELETED]: true } });
    await utils.projectContent.list.invalidate();
  };

  return { records, save, remove, isSaving: saveMutation.isPending };
}

function EditField({ label, value, onChange, type = "text", wide }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "number" | "textarea"; wide?: boolean }) {
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value);
  return (
    <label className={wide ? "pd-editor-wide" : ""}>
      <span>{label}</span>
      {type === "textarea" ? <textarea rows={3} value={value} onChange={handleChange} /> : <input type={type} value={value} onChange={handleChange} />}
    </label>
  );
}

function RowActions({ isAdmin, onEdit, onDelete }: { isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  if (!isAdmin) return null;
  return (
    <span className="ir-row-actions" onClick={(event) => event.stopPropagation()}>
      <button type="button" aria-label="편집" onClick={onEdit}><Pencil size={13} /></button>
      <button type="button" aria-label="삭제" className="ir-row-delete" onClick={onDelete}><Trash2 size={13} /></button>
    </span>
  );
}

export function InvestmentReviewBoard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [tab, setTab] = useState<"현황" | "요구">("현황");
  const [departmentFilter, setDepartmentFilter] = useState("전체");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Partial<ReviewRecord>>({});
  const [requestDraft, setRequestDraft] = useState<Partial<RequestRecord>>({});

  const review = useRowOverrides(reviewRecords);
  const request = useRowOverrides(requestRecords);

  const departments = useMemo(
    () => ["전체", ...Array.from(new Set(review.records.map((record) => record.department))).sort((a, b) => a.localeCompare(b, "ko"))],
    [review.records],
  );
  const filtered = departmentFilter === "전체" ? review.records : review.records.filter((record) => record.department === departmentFilter);

  const beginReviewEdit = (record: ReviewRecord) => {
    setEditingId(record.id);
    setExpandedKey(null);
    setReviewDraft({ department: record.department, project_name: record.project_name, field: record.field, period: record.period, agency: record.agency, result: record.result, total_cost: record.total_cost, result_detail: record.result_detail, overview: record.overview });
  };
  const saveReviewEdit = async (id: string) => {
    await review.save(id, { ...reviewDraft, total_cost: reviewDraft.total_cost === undefined ? undefined : Number(reviewDraft.total_cost) });
    setEditingId(null);
  };

  const beginRequestEdit = (record: RequestRecord) => {
    setEditingId(record.id);
    setExpandedKey(null);
    setRequestDraft({ department: record.department, project_name: record.project_name, division: record.division, period: record.period, total_eok: record.total_eok, overview: record.overview });
  };
  const saveRequestEdit = async (id: string) => {
    await request.save(id, { ...requestDraft, total_eok: requestDraft.total_eok === undefined ? undefined : Number(requestDraft.total_eok) });
    setEditingId(null);
  };

  return (
    <section className="dept-dashboard ir-board">
      <div className="dept-dashboard-header">
        <div>
          <p className="dept-dashboard-eyebrow">INVESTMENT REVIEW</p>
          <h1>지방재정 투자 심사</h1>
        </div>
      </div>

      <div className="ir-tabs" role="tablist" aria-label="투자심사 화면 전환">
        {(["현황", "요구"] as const).map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} className={tab === name ? "is-active" : ""} onClick={() => { setTab(name); setExpandedKey(null); setEditingId(null); }}>
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
            <span className="ir-count">{filtered.length}건 (전체 {review.records.length}건 · 2024년 심사 기준, 단위: 억원)</span>
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
                  <th className="ir-amount-head">총사업비</th>
                  {isAdmin && <th className="ir-actions-head"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const isOpen = expandedKey === record.id;
                  const isEditing = editingId === record.id;
                  const colSpan = isAdmin ? 9 : 8;
                  return (
                    <Fragment key={record.id}>
                      <tr className={`ir-row ${isOpen || isEditing ? "is-open" : ""}`} onClick={() => { if (isEditing) return; setExpandedKey(isOpen ? null : record.id); }}>
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
                        {isAdmin && (
                          <td>
                            <RowActions
                              isAdmin={isAdmin}
                              onEdit={() => beginReviewEdit(record)}
                              onDelete={() => { if (window.confirm(`"${record.project_name}" 항목을 삭제할까요?`)) void review.remove(record.id); }}
                            />
                          </td>
                        )}
                      </tr>
                      {isEditing ? (
                        <tr className="ir-detail-row">
                          <td colSpan={colSpan}>
                            <div className="pd-editor ir-editor">
                              <div className="pd-editor-grid">
                                <EditField label="담당부서" value={reviewDraft.department ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, department: v }))} />
                                <EditField label="사업명" value={reviewDraft.project_name ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, project_name: v }))} wide />
                                <EditField label="분야" value={reviewDraft.field ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, field: v }))} />
                                <EditField label="사업기간" value={reviewDraft.period ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, period: v }))} />
                                <EditField label="심사기관" value={reviewDraft.agency ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, agency: v }))} />
                                <EditField label="심사결과" value={reviewDraft.result ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, result: v }))} />
                                <EditField label="총사업비(억원)" type="number" value={String(reviewDraft.total_cost ?? "")} onChange={(v) => setReviewDraft((d) => ({ ...d, total_cost: v === "" ? null : Number(v) }))} />
                                <EditField label="사업개요" type="textarea" value={reviewDraft.overview ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, overview: v }))} wide />
                                <EditField label="심사결과 내용" type="textarea" value={reviewDraft.result_detail ?? ""} onChange={(v) => setReviewDraft((d) => ({ ...d, result_detail: v }))} wide />
                              </div>
                              <div className="pd-editor-actions">
                                <button type="button" className="pd-editor-cancel" onClick={() => setEditingId(null)}>취소</button>
                                <button type="button" className="pd-editor-save" disabled={review.isSaving} onClick={() => void saveReviewEdit(record.id)}>{review.isSaving ? "저장 중…" : "저장"}</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : isOpen && (
                        <tr className="ir-detail-row">
                          <td colSpan={colSpan}>
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
        <div className="dept-panel">
          <div className="dept-filter-row">
            <span className="ir-count">{request.records.length}건 · 27년 본예산 투자심사 안건 의뢰 현황, 단위: 억원</span>
          </div>
          {request.records.length === 0 ? (
            <div className="pd-note-box ir-empty">등록된 투자심사 요구 자료가 없습니다.</div>
          ) : (
            <div className="ir-table-wrap">
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>담당부서</th>
                    <th>사업명</th>
                    <th>신규/계속</th>
                    <th>사업기간</th>
                    <th className="ir-amount-head">총사업비</th>
                    {isAdmin && <th className="ir-actions-head"></th>}
                  </tr>
                </thead>
                <tbody>
                  {request.records.map((record) => {
                    const isOpen = expandedKey === record.id;
                    const isEditing = editingId === record.id;
                    const colSpan = isAdmin ? 7 : 6;
                    return (
                      <Fragment key={record.id}>
                        <tr className={`ir-row ${isOpen || isEditing ? "is-open" : ""}`} onClick={() => { if (isEditing) return; setExpandedKey(isOpen ? null : record.id); }}>
                          <td>{record.category}</td>
                          <td>{record.department}</td>
                          <td className="ir-project-name">{record.project_name}</td>
                          <td>{record.division}</td>
                          <td>{oneLine(record.period)}</td>
                          <td className="ir-amount">{formatEok(record.total_eok)}</td>
                          {isAdmin && (
                            <td>
                              <RowActions
                                isAdmin={isAdmin}
                                onEdit={() => beginRequestEdit(record)}
                                onDelete={() => { if (window.confirm(`"${record.project_name}" 항목을 삭제할까요?`)) void request.remove(record.id); }}
                              />
                            </td>
                          )}
                        </tr>
                        {isEditing ? (
                          <tr className="ir-detail-row">
                            <td colSpan={colSpan}>
                              <div className="pd-editor ir-editor">
                                <div className="pd-editor-grid">
                                  <EditField label="담당부서" value={requestDraft.department ?? ""} onChange={(v) => setRequestDraft((d) => ({ ...d, department: v }))} />
                                  <EditField label="사업명" value={requestDraft.project_name ?? ""} onChange={(v) => setRequestDraft((d) => ({ ...d, project_name: v }))} wide />
                                  <EditField label="신규/계속" value={requestDraft.division ?? ""} onChange={(v) => setRequestDraft((d) => ({ ...d, division: v }))} />
                                  <EditField label="사업기간" value={requestDraft.period ?? ""} onChange={(v) => setRequestDraft((d) => ({ ...d, period: v }))} />
                                  <EditField label="총사업비(억원)" type="number" value={String(requestDraft.total_eok ?? "")} onChange={(v) => setRequestDraft((d) => ({ ...d, total_eok: v === "" ? null : Number(v) }))} />
                                  <EditField label="사업개요" type="textarea" value={requestDraft.overview ?? ""} onChange={(v) => setRequestDraft((d) => ({ ...d, overview: v }))} wide />
                                </div>
                                <div className="pd-editor-actions">
                                  <button type="button" className="pd-editor-cancel" onClick={() => setEditingId(null)}>취소</button>
                                  <button type="button" className="pd-editor-save" disabled={request.isSaving} onClick={() => void saveRequestEdit(record.id)}>{request.isSaving ? "저장 중…" : "저장"}</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : isOpen && (
                          <tr className="ir-detail-row">
                            <td colSpan={colSpan}>
                              <div className="ir-detail-grid">
                                <div className="ir-detail-block">
                                  <span>사업개요</span>
                                  <p>{record.overview}</p>
                                </div>
                                <div className="ir-detail-block">
                                  <span>재원조달계획(억원)</span>
                                  <p>{record.funding.map((row) => `${row.name} ${formatEok(row.total_eok)}`).join(" · ")}</p>
                                </div>
                                <div className="ir-detail-block">
                                  <span>연도별 계획(억원)</span>
                                  <p>기투자 {formatEok(record.invested_eok)} · '27 {formatEok(record.y27_eok)} · '28 {formatEok(record.y28_eok)} · '29이후 {formatEok(record.y29plus_eok)}</p>
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
          )}
        </div>
      )}
    </section>
  );
}

// 리뉴얼 상세 화면(사진 먼저 · 지금 이 사업은 · 총사업비 수식 · 예산 집행현황)을 쓰는 사업과
// 사업 성격에 맞춘 추진 단계·핵심 날짜·2026년 예산현액 자료.
// - steps/current: 성격별 단계(신축·전시 포함 신축·리모델링 등)와 현재 단계 위치(0부터)
// - dates: 제목 줄 오른쪽 핵심 날짜. 마지막 항목이 목표(노란색)
// - execution2026: 2026년 예산집행 현황(세출 통계목 합계, 백만원). 사업 단위로 분리되지 않으면 넣지 않는다.
export type RenewalDate = { label: string; value: string };
export type RenewalExecution = { budget2026: number; carryover: number; carryoverType?: string; executed: number };
export type RenewalConfig = {
  title?: string;
  // 대표 사진으로 쓸 rendering_images 순번(없으면 첫 조감도).
  imageIndex?: number;
  // 총사업비가 아직 정해지지 않은 사업: 개요에 "미정"을 쓰고 총사업비 수식을 숨긴다.
  totalUndecided?: string;
  steps: string[];
  current: number;
  dates: RenewalDate[];
  execution2026?: RenewalExecution;
};

export const PROJECT_RENEWAL: Record<string, RenewalConfig> = {
  // 문화예술과 ─────────────────────────────────────────────
  "총괄데이터_5.xlsx:문화예술과:6": {
    title: "화성시 어린이 테마 과학관 건립",
    steps: ["기획·부지 확보", "설계", "건축 공사", "전시 설치", "개관"],
    current: 1,
    dates: [{ label: "공사 착공 예정", value: "2027.3." }, { label: "준공 예정", value: "2028.10." }, { label: "과학관 개관", value: "2028.12." }],
    execution2026: { budget2026: 120, carryover: 4125, carryoverType: "계속비이월", executed: 1080 },
  },
  "총괄데이터_5.xlsx:문화예술과:7": {
    steps: ["기획·부지 확보", "설계", "건축 공사", "전시 설치", "개관"],
    current: 1,
    dates: [{ label: "공사 착공 예정", value: "2027.3." }, { label: "준공 예정", value: "2028.8." }, { label: "센터 개관", value: "2029.3." }],
  },
  "총괄데이터_5.xlsx:문화예술과:3": {
    // 1.png는 어린이 과학관 조감도와 같은 그림이라 미술관 조감도(2.jpg)를 쓴다.
    imageIndex: 2,
    steps: ["기획·부지 확보", "설계", "건축 공사", "미술관 등록·개관"],
    current: 1,
    dates: [{ label: "공사 착공 예정", value: "2027.7." }, { label: "준공 예정", value: "2029.2." }, { label: "미술관 개관", value: "2029.4." }],
    execution2026: { budget2026: 8214, carryover: 2816, carryoverType: "계속비이월", executed: 808 },
  },
  "총괄데이터_5.xlsx:문화예술과:2": {
    steps: ["설계", "공연장 조성 공사", "준공·개관"],
    current: 1,
    dates: [{ label: "준공·개관", value: "2027.4." }],
  },
  "총괄데이터_5.xlsx:문화예술과:1": {
    steps: ["사전 행정절차", "설계공모·설계", "리모델링 공사", "재개관"],
    current: 0,
    dates: [{ label: "설계 착수 예정", value: "2027.3." }, { label: "공사 착공 예정", value: "2027.9." }, { label: "공사 준공", value: "2028.8." }],
  },
  "총괄데이터_5.xlsx:문화예술과:5": {
    steps: ["사전 행정절차", "토지매입·건축기획", "설계", "건축 공사", "개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2028.5." }, { label: "준공 예정", value: "2029. 하반기" }, { label: "개관", value: "2030. 상반기" }],
    execution2026: { budget2026: 47, carryover: 0, executed: 0 },
  },
  "총괄데이터_5.xlsx:문화예술과:8": {
    steps: ["사전 행정절차", "설계공모·설계", "건축 공사", "시범 운영·개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2028.6." }, { label: "준공 예정", value: "2030.6." }, { label: "개관", value: "2030.10." }],
    execution2026: { budget2026: 22, carryover: 0, executed: 20 },
  },
  "총괄데이터_5.xlsx:문화예술과:9": {
    steps: ["투자심사·행정절차", "설계공모·설계", "리모델링 공사", "개관"],
    current: 0,
    dates: [{ label: "설계 착수 예정", value: "2027.10." }, { label: "공사 착공 예정", value: "2028.10." }, { label: "개관", value: "2030.6." }],
    execution2026: { budget2026: 40, carryover: 0, executed: 40 },
  },
  "총괄데이터_5.xlsx:문화예술과:10": {
    steps: ["설계", "공간 조성 공사", "준공·개관"],
    current: 2,
    dates: [{ label: "사업 완료", value: "2026.6." }],
    execution2026: { budget2026: 0, carryover: 936, carryoverType: "명시이월", executed: 757 },
  },
  "문화예술과_수동입력:6": {
    steps: ["기본구상·타당성조사", "투자심사·행정절차", "설계공모·설계", "공사·개관"],
    current: 0,
    dates: [{ label: "설계 착수 예정", value: "2029.3." }, { label: "공사 착공 예정", value: "2030.8." }, { label: "개관", value: "2032.12." }],
  },
  "문화예술과_수동입력:7": {
    totalUndecided: "건축기획 용역 추진에 따라 결정 예정",
    steps: ["타당성·건축기획", "투자심사·사전절차", "설계공모·설계", "건축 공사", "시범 운영·개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2029.6." }, { label: "준공 예정", value: "2030.6." }, { label: "개관", value: "2030.9." }],
  },

  // 문화유산과 ─────────────────────────────────────────────
  "문화유산_주요투자사업_총괄표.xlsx:총괄표:1": {
    steps: ["타당성조사·투자심사", "설계공모·설계", "건축 공사", "전시 설치·유물 수장", "개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2028.5." }, { label: "준공 예정", value: "2030.2." }, { label: "박물관 개관", value: "2031.3." }],
  },
  "문화유산_주요투자사업_총괄표.xlsx:총괄표:2": {
    steps: ["토지보상", "홍보관 설계", "역사공원 조성", "개방"],
    current: 0,
    dates: [{ label: "토지보상 완료", value: "2027.7." }, { label: "공원 공사 발주", value: "2027.12." }, { label: "사업 완료", value: "2028.12." }],
    execution2026: { budget2026: 0, carryover: 101, carryoverType: "명시이월", executed: 12 },
  },
  "문화유산_주요투자사업_총괄표.xlsx:총괄표:3": {
    steps: ["투자심사·국비 확보", "실시설계", "건축 공사", "개관"],
    current: 0,
    dates: [{ label: "설계 발주 예정", value: "2027.1." }, { label: "사업 완료", value: "2029.12." }],
  },
};

export const isRenewedProject = (id: string) => id in PROJECT_RENEWAL;

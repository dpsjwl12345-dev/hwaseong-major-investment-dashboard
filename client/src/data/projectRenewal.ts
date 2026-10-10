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
  // 대표 사진 아래 설명(기존 건물 사진을 렌더링 톤으로 다듬은 경우 등).
  imageCaption?: string;
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
    imageCaption: "현재 건물 기반 렌더링 이미지 · 리모델링 대상",
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
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["투자심사·행정절차", "설계공모·설계", "리모델링 공사", "개관"],
    current: 0,
    dates: [{ label: "설계 착수 예정", value: "2027.10." }, { label: "공사 착공 예정", value: "2028.10." }, { label: "개관", value: "2030.6." }],
    execution2026: { budget2026: 40, carryover: 0, executed: 40 },
  },
  "총괄데이터_5.xlsx:문화예술과:10": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계", "공간 조성 공사", "준공·개관"],
    current: 2,
    dates: [{ label: "사업 완료", value: "2026.6." }],
    execution2026: { budget2026: 0, carryover: 936, carryoverType: "명시이월", executed: 757 },
  },
  "문화예술과_수동입력:6": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["기본구상·타당성조사", "투자심사·행정절차", "설계공모·설계", "공사·개관"],
    current: 0,
    dates: [{ label: "설계 착수 예정", value: "2029.3." }, { label: "공사 착공 예정", value: "2030.8." }, { label: "개관", value: "2032.12." }],
  },
  "문화예술과_수동입력:7": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    totalUndecided: "건축기획 용역 추진에 따라 결정 예정",
    steps: ["타당성·건축기획", "투자심사·사전절차", "설계공모·설계", "건축 공사", "시범 운영·개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2029.6." }, { label: "준공 예정", value: "2030.6." }, { label: "개관", value: "2030.9." }],
  },

  // 문화유산과 ─────────────────────────────────────────────
  "문화유산_주요투자사업_총괄표.xlsx:총괄표:1": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
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
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["투자심사·국비 확보", "실시설계", "건축 공사", "개관"],
    current: 0,
    dates: [{ label: "설계 발주 예정", value: "2027.1." }, { label: "사업 완료", value: "2029.12." }],
  },

  // 독립기념관 ─────────────────────────────────────────────
  "독립기념관_수동입력:13": {
    steps: ["기념관 건립", "역사문화공원 토지보상", "공원사업 준공", "진입도로 개설"],
    current: 1,
    dates: [{ label: "토지보상 완료", value: "2026.10." }, { label: "공원사업 준공", value: "2026.12." }, { label: "진입도로 준공", value: "2027.6." }],
    execution2026: { budget2026: 0, carryover: 1732, carryoverType: "계속비이월", executed: 61 },
  },
  "독립기념관_수동입력:14": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["기본설계", "제안 평가·실시설계", "기념탑 조성 공사", "준공"],
    current: 1,
    dates: [{ label: "제안서 평가", value: "2027.3." }, { label: "공사 착공", value: "2027.3." }, { label: "준공", value: "2027.8." }],
    execution2026: { budget2026: 0, carryover: 55, carryoverType: "명시이월", executed: 30 },
  },

  // 관광진흥과 ─────────────────────────────────────────────
  "관광진흥과_총괄데이터.xlsx:Sheet1:1": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계", "계류시설 설치 공사", "준공"],
    current: 1,
    dates: [{ label: "국화도 준공", value: "2026.9." }, { label: "입파도 준공", value: "2026.10." }],
    execution2026: { budget2026: 0, carryover: 1166, carryoverType: "명시이월", executed: 279 },
  },
  "관광진흥과_총괄데이터.xlsx:Sheet1:2": {
    steps: ["설계", "조형물·휴게시설 공사", "준공"],
    current: 1,
    dates: [{ label: "사업 완료", value: "2026.7." }],
    execution2026: { budget2026: 24, carryover: 935, carryoverType: "사고이월", executed: 920 },
  },
  "관광진흥과_총괄데이터.xlsx:Sheet1:3": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    // 예산현액·집행은 자체 사업과 전환사업 두 단위를 합친 값.
    steps: ["설계", "해안 데크 설치", "준공", "개통·걷기축제"],
    current: 2,
    dates: [{ label: "걷기축제", value: "2026.10." }],
    execution2026: { budget2026: 6780, carryover: 19040, carryoverType: "계속비이월", executed: 24577 },
  },
  "관광진흥과_총괄데이터.xlsx:Sheet1:4": {
    steps: ["설계", "해상공원 조성 공사", "준공", "기부대양여"],
    current: 1,
    dates: [{ label: "해상공원 준공", value: "2026.12." }, { label: "기부대양여 착공", value: "2027.6." }, { label: "기부대양여 준공", value: "2027.12.~" }],
    execution2026: { budget2026: 4500, carryover: 6500, carryoverType: "계속비이월", executed: 6500 },
  },
  "관광진흥과_총괄데이터.xlsx:Sheet1:5": {
    steps: ["실시설계·해역이용협의", "데크 재설치 공사", "준공"],
    current: 0,
    dates: [{ label: "재설치 착공", value: "2027.2." }, { label: "재설치 준공", value: "2027.12." }],
    execution2026: { budget2026: 100, carryover: 48, carryoverType: "사고이월", executed: 0 },
  },
  "관광진흥과_총괄데이터.xlsx:Sheet1:8": {
    steps: ["부지 확보", "관광지 조성 공사", "준공"],
    current: 1,
    dates: [{ label: "남측 주차장·산책로", value: "2026.11." }, { label: "관광지 조성 준공", value: "2027.12." }],
    execution2026: { budget2026: 442, carryover: 1708, carryoverType: "계속비이월", executed: 1805 },
  },
  "관광진흥과_총괄데이터.xlsx:Sheet1:10": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    // 예산현액·집행은 '중로2-3호선 외 3개소 개설' 단위 기준.
    steps: ["토지보상", "도로 개설 공사", "준공"],
    current: 0,
    dates: [{ label: "수용재결 개시", value: "2026.8." }, { label: "사업 완료", value: "2027." }],
    execution2026: { budget2026: 8398, carryover: 1668, carryoverType: "계속비이월", executed: 3540 },
  },
  // 도서관정책과 ─────────────────────────────────────────────
  "총괄데이터_일반.xlsx:Sheet1:1": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["타당성·투자심사", "설계공모·설계", "건축 공사", "개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2028.9." }, { label: "준공 예정", value: "2030.8." }, { label: "도서관 개관", value: "2030.11." }],
    execution2026: { budget2026: 50, carryover: 0, executed: 0 },
  },
  "총괄데이터_일반.xlsx:Sheet1:2": {
    steps: ["설계", "건축 공사", "개관"],
    current: 1,
    dates: [{ label: "공사 준공", value: "2027.7." }, { label: "도서관 개관", value: "2027.10." }],
    execution2026: { budget2026: 510, carryover: 13801, executed: 3448 },
  },
  "총괄데이터_일반.xlsx:Sheet1:3": {
    steps: ["설계", "건축 공사", "개관"],
    current: 1,
    dates: [{ label: "공사 준공", value: "2027.1." }, { label: "개관", value: "2027.4." }],
    execution2026: { budget2026: 8905, carryover: 8544, executed: 5051 },
  },
  "총괄데이터_일반.xlsx:Sheet1:4": {
    imageCaption: "현재 건물 기반 렌더링 이미지 · 리모델링 대상",
    steps: ["안전진단·투자심사", "설계공모·설계", "리모델링 공사", "재개관"],
    current: 0,
    dates: [{ label: "설계 착수 예정", value: "2027.1." }, { label: "공사 착공 예정", value: "2027.8." }, { label: "재개관", value: "2028.12." }],
    execution2026: { budget2026: 100, carryover: 0, executed: 56 },
  },
  // 체육진흥과 ─────────────────────────────────────────────
  "주요투자사업_총괄데이터.xlsx:Sheet1:1": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["사전 행정절차", "실시설계", "철거·신축 공사", "준공"],
    current: 0,
    dates: [{ label: "실시설계 착수", value: "2027.2." }, { label: "공사 착공 예정", value: "2027.4." }, { label: "준공", value: "2027.9." }],
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:2": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계", "발주·계약", "개선 공사", "준공"],
    current: 1,
    dates: [{ label: "공사 착공", value: "2026.9." }, { label: "준공", value: "2026.11." }],
    execution2026: { budget2026: 1350, carryover: 0, executed: 87 },
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:3": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계", "테니스장 조성 공사", "준공"],
    current: 1,
    dates: [{ label: "사업 완료", value: "2026.8." }],
    execution2026: { budget2026: 0, carryover: 1584, carryoverType: "명시이월", executed: 1506 },
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:5": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계", "체육시설 조성 공사", "개방"],
    current: 0,
    dates: [{ label: "사업 완료", value: "2027.9." }],
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:6": {
    steps: ["설계", "건축 공사", "준공·개관"],
    current: 1,
    dates: [{ label: "준공", value: "2026.12." }],
    execution2026: { budget2026: 2956, carryover: 2750, executed: 1982 },
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:7": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["건축기획·사전절차", "설계공모·설계", "건축 공사", "개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2028.2." }, { label: "준공 예정", value: "2029.10." }, { label: "개관", value: "2030.1." }],
    execution2026: { budget2026: 300, carryover: 0, executed: 0 },
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:8": {
    steps: ["설계", "건축 공사", "준공·개관"],
    current: 1,
    dates: [{ label: "공사 준공", value: "2026.10." }],
    execution2026: { budget2026: 2724, carryover: 3043, executed: 1656 },
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:9": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["사전 행정절차", "실시설계·공원계획", "테니스장 조성 공사", "준공"],
    current: 0,
    dates: [{ label: "실시설계 착수", value: "2027.1." }, { label: "공사 착공 예정", value: "2027.5." }, { label: "준공", value: "2027.8." }],
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:10": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["사전절차·설명회", "실시계획·설계", "건축 공사", "개관"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2027.10." }, { label: "준공 예정", value: "2029.4." }, { label: "센터 개관", value: "2029.7." }],
    execution2026: { budget2026: 765, carryover: 200, executed: 20 },
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:11": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["타당성조사", "투자심사·도시계획", "설계", "보상", "공사"],
    current: 0,
    dates: [{ label: "투자심사 완료", value: "2028.7." }, { label: "공사 착공 예정", value: "2033.3." }, { label: "준공 예정", value: "2035.12." }],
  },
  "주요투자사업_총괄데이터.xlsx:Sheet1:12": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["실시설계", "훈련시설 공사", "잔디 생착·완료"],
    current: 0,
    dates: [{ label: "공사 착수", value: "2026.11." }, { label: "사업 완료", value: "2027.7." }],
    execution2026: { budget2026: 1800, carryover: 0, executed: 0 },
  },
  "체육진흥과_수동입력:13": {
    steps: ["타당성조사", "투자심사·도시계획", "설계", "공사"],
    current: 0,
    dates: [{ label: "투자심사 완료", value: "2028.7." }, { label: "공사 착공 예정", value: "2030.9." }, { label: "준공 예정", value: "2032.12." }],
  },
  "체육진흥과_수동입력:14": {
    steps: ["기본계획·타당성", "투자심사·GB관리계획", "설계공모·설계", "공사"],
    current: 0,
    dates: [{ label: "투자심사", value: "2028." }, { label: "설계공모", value: "2029." }, { label: "공사 추진", value: "2030.~" }],
  },
  // 전국체전추진단 ─────────────────────────────────────────────
  "총괄데이터_2.xlsx:Sheet1:1": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["공원계획 변경", "경기장 공사", "준공"],
    current: 0,
    dates: [{ label: "공사 착공 예정", value: "2026.12." }, { label: "준공 예정", value: "2027.5." }],
    execution2026: { budget2026: 0, carryover: 1914, carryoverType: "명시이월", executed: 0 },
  },
  "총괄데이터_2.xlsx:Sheet1:2": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계", "발주·계약", "축구장 공사", "준공"],
    current: 1,
    dates: [{ label: "공사 착공 예정", value: "2026.11." }, { label: "준공 예정", value: "2027.5." }],
    execution2026: { budget2026: 0, carryover: 2671, carryoverType: "명시이월", executed: 0 },
  },
  "총괄데이터_2.xlsx:Sheet1:3": {
    imageCaption: "AI 가상 이미지 · 실제 설계와 다를 수 있음",
    steps: ["설계·발주", "경기장 개보수 공사", "개보수 완료"],
    current: 0,
    dates: [{ label: "개보수 완료", value: "2027.5." }],
    execution2026: { budget2026: 15901, carryover: 5253, carryoverType: "명시이월", executed: 699 },
  },
};

export const isRenewedProject = (id: string) => id in PROJECT_RENEWAL;

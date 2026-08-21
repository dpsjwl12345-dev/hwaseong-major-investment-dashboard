import json
import re
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parents[1] / "client/src/data/dashboard_projects.json"
DATE_FIELDS = {"overview", "progress_status", "future_plan", "inspection", "card_inspection", "last_saved"}


def normalize_dates(text: str) -> str:
    text = re.sub(r"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일", lambda m: f"{m.group(1)}.{int(m.group(2)):02d}.{int(m.group(3)):02d}", text)
    text = re.sub(r"(\d{4})년\s*(\d{1,2})월", lambda m: f"{m.group(1)}.{int(m.group(2)):02d}.", text)
    text = re.sub(r"(\d{4})년", r"\1.", text)
    text = re.sub(r"(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.", lambda m: f"{m.group(1)}.{int(m.group(2)):02d}.{int(m.group(3)):02d}", text)
    text = re.sub(r"(\d{4})\.\s*(\d{1,2})\.", lambda m: f"{m.group(1)}.{int(m.group(2)):02d}.", text)
    return text


def normalize_address(overview: str, contact: str, district: str) -> str:
    lines = []
    for line in overview.splitlines():
        if re.match(r"\s*○\s*사업위치\s*$", line):
            suffix = " ".join(part for part in [contact, district, "일원"] if part)
            line = f"○ 사업위치: 화성시 {suffix}" if suffix else line
        elif re.match(r"\s*○\s*위\s*치\s*[:：]", line):
            line = re.sub(r"^\s*○\s*위\s*치\s*[:：]", "○ 사업위치:", line, count=1)
        if "사업위치" in line and "화성시" not in line:
            prefix = "화성시" if re.search(r"[가-힣]+구", line) else f"화성시 {contact}".strip()
            line = line.replace("사업위치:", f"사업위치: {prefix} ", 1)
            line = line.replace("사업위치：", f"사업위치：{prefix} ", 1)
        line = re.sub(r"(사업위치[:：])\s+", r"\1 ", line)
        line = re.sub(r"\s{2,}", " ", line)
        lines.append(line)
    return "\n".join(lines)


def main() -> None:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    projects = payload.get("projects", [])
    for project in projects:
        for field in DATE_FIELDS:
            value = project.get(field)
            if isinstance(value, str):
                project[field] = normalize_dates(value)
        if isinstance(project.get("overview"), str):
            project["overview"] = normalize_address(project["overview"], project.get("contact", ""), project.get("district", ""))
    DATA_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"normalized {len(projects)} projects")


if __name__ == "__main__":
    main()

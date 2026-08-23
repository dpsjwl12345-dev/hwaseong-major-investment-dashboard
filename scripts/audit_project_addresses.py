import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "client/src/data/dashboard_projects.json"
projects = json.loads(path.read_text(encoding="utf-8"))["projects"]
for project in projects:
    overview = project.get("overview", "")
    if "사업위치" not in overview or "화성시" not in overview:
        print(project.get("serial"), project.get("project_name"), "|", project.get("contact"), "|", project.get("district"), "|", project.get("town"))

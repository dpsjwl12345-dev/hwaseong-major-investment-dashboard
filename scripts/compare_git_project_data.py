import json
import subprocess
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
path = "client/src/data/dashboard_projects.json"
commits = subprocess.check_output(
    ["git", "-C", str(repo), "log", "--all", "--format=%H %ad %s", "--date=short", "--", path],
    text=True,
).splitlines()
for line in commits:
    sha, date, *subject = line.split(" ", 2)
    subject = subject[0] if subject else ""
    try:
        raw = subprocess.check_output(["git", "-C", str(repo), "show", f"{sha}:{path}"], text=True)
        obj = json.loads(raw)
        projects = obj.get("projects", [])
        print(f"COMMIT {sha[:8]} {date} {subject} count={len(projects)}")
        for project in projects:
            name = project.get("project_name", "")
            if "가칭" in name or "화성" in name:
                print(f"  {project.get('id')} | {project.get('department')} | {name}")
        print()
    except (subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        print(f"COMMIT {sha[:8]} unreadable: {exc}")

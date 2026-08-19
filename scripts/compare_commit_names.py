import json
import subprocess
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
path = "client/src/data/dashboard_projects.json"
commits = ["c89804c8", "87b0822f", "HEAD"]
data = {}
for commit in commits:
    ref = f"{commit}:{path}" if commit != "HEAD" else path
    raw = subprocess.check_output(["git", "-C", str(repo), "show", ref], text=True)
    obj = json.loads(raw)
    data[commit] = {p.get("id"): p.get("project_name") for p in obj.get("projects", [])}

ids = sorted(set().union(*[set(v) for v in data.values()]))
for project_id in ids:
    values = [data[c].get(project_id) for c in commits]
    if len(set(values)) > 1:
        print(project_id)
        for commit, value in zip(commits, values):
            print(f"  {commit}: {value}")

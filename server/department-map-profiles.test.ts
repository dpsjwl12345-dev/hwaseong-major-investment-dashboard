import { describe, expect, it } from "vitest";
import { departmentMapProfiles, projectAreaPoints } from "../client/src/data/department-map-profiles";

describe("department map area references",()=>{
  it("prefers the stated project address over broad or stale district fields",()=>{
    expect(projectAreaPoints({overview:"○ 사업위치: 화성시 진안동 539-4\n○ 사업내용: 봉담읍 등 이용",district:"봉담읍,진안동,병점1동"}).map(p=>p.area)).toEqual(["진안동"]);
  });
  it("preserves each stated area for projects covering multiple places",()=>{
    expect(projectAreaPoints({overview:"○ 사업위치: 향남읍,남양읍,팔탄면 일원"}).map(p=>p.area).sort()).toEqual(["향남읍","남양읍","팔탄면"].sort());
  });
  it("does not place undetermined projects even if an old district exists",()=>{
    expect(projectAreaPoints({overview:"○ 사업위치: 서남부권 일원(미정, 입지 선정)",district:"향남읍"})).toEqual([]);
    expect(projectAreaPoints({overview:"",district:""})).toEqual([]);
  });
  it("does not infer locations from project names or other overview sections",()=>{
    expect(projectAreaPoints({overview:"○ 사업내용: 향남읍 체육시설 확충"})).toEqual([]);
  });
  it("gives all seven departments distinct facility representations",()=>{
    expect(Object.keys(departmentMapProfiles)).toHaveLength(7);
    expect(new Set(Object.values(departmentMapProfiles).map(p=>p.kind)).size).toBe(7);
  });
});

import { useState, type ReactNode } from "react";
import { Map, Table2 } from "lucide-react";
import DepartmentMapDashboard, { type TourismProject } from "./DepartmentInvestmentDashboard";

export default function DepartmentDashboardView({department,projects,onOpenProject,isAdmin,managementTable}:{department:string;projects:TourismProject[];onOpenProject:(id:string)=>void;isAdmin:boolean;managementTable:ReactNode}) {
  const [showTable,setShowTable]=useState(false);
  return <>
    {isAdmin&&<div className="department-view-switch" role="group" aria-label="부서별 현황 보기 방식">
      <button aria-pressed={!showTable} onClick={()=>setShowTable(false)}><Map size={16}/>지도 현황</button>
      <button aria-pressed={showTable} onClick={()=>setShowTable(true)}><Table2 size={16}/>관리표 편집</button>
    </div>}
    {showTable&&isAdmin?managementTable:<DepartmentMapDashboard key={department} department={department} projects={projects} onOpenProject={onOpenProject}/>}
  </>;
}

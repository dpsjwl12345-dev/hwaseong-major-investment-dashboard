import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
function TourismDepartmentPage() {
  return <Home initialDepartment="관광진흥과" />;
}
const departmentRoutes:Record<string,string>={culture:"문화예술과",heritage:"문화유산과",memorial:"독립기념관",libraries:"도서관정책과",sports:"체육진흥과",festival:"전국체전추진단"};
function DepartmentPage({params}:{params:{slug:string}}) {
  const department=departmentRoutes[params.slug];
  return department?<Home key={department} initialDepartment={department}/>:<NotFound/>;
}
function HomePage() {
  return <Home />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/department-map-preview" component={TourismDepartmentPage} />
      <Route path="/departments/tourism" component={TourismDepartmentPage} />
      <Route path="/departments/:slug" component={DepartmentPage} />
      <Route path={"/"} component={HomePage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

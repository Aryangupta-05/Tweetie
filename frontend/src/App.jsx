import { lazy, Suspense } from "react";
import LoadingSpinner from "./components/common/LoadingSpinner";

const LiveApp = lazy(() => import("./live/LiveApp"));

export default function App() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}><LiveApp /></Suspense>;
}

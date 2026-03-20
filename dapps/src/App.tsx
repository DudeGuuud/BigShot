import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { CreatePage } from "./pages/CreatePage";
import { BountyDetailPage } from "./pages/BountyDetailPage";
import { BindPage } from "./pages/BindPage";

// Minimal hash-based router — no third-party lib needed
function getRoute() {
  const hash = window.location.hash.replace("#", "") || "/";
  return hash;
}

function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  let page: React.ReactNode;
  if (route === "/" || route === "") {
    page = <HomePage />;
  } else if (route === "/list") {
    page = <ListPage />;
  } else if (route === "/create") {
    page = <CreatePage />;
  } else if (route === "/bind") {
    page = <BindPage />;
  } else if (route.startsWith("/bounty/")) {
    page = <BountyDetailPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page-content">{page}</main>
    </div>
  );
}

export default App;

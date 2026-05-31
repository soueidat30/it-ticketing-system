import { Outlet } from "react-router-dom";

const AgentLayout = () => {
  return (
    <div className="agent-layout">
      <header className="agent-layout__header">
        <h1>Agent Area</h1>
      </header>
      <main className="agent-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AgentLayout;

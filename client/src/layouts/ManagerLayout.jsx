import { Outlet } from "react-router-dom";

const ManagerLayout = () => {
  return (
    <div className="manager-layout">
      <header className="manager-layout__header">
        <h1>Manager Area</h1>
      </header>
      <main className="manager-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;

import { Outlet } from "react-router-dom";

const EmployeeLayout = () => {
  return (
    <div className="employee-layout">
      <header className="employee-layout__header">
        <h1>Employee Area</h1>
      </header>
      <main className="employee-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;

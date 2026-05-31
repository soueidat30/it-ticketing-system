import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <h1>Admin Area</h1>
      </header>
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

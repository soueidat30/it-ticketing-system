import { useState } from "react";
import "./UserManagement.css";

const USERS = [
  { id: 1,  name: "Sara El-Khoury",  email: "sara@ids.com",   dept: "Finance",   role: "End User",  status: "Active",   joined: "Jan 12, 2024", tickets: 8  },
  { id: 2,  name: "Ali Hassan",      email: "ali@ids.com",    dept: "IT",        role: "Agent",     status: "Active",   joined: "Mar 5, 2023",  tickets: 42 },
  { id: 3,  name: "Dina Farhat",     email: "dina@ids.com",   dept: "IT",        role: "Agent",     status: "Active",   joined: "Feb 18, 2023", tickets: 37 },
  { id: 4,  name: "Karim Mansour",   email: "karim@ids.com",  dept: "Marketing", role: "End User",  status: "Active",   joined: "Jun 3, 2024",  tickets: 3  },
  { id: 5,  name: "Lara Haddad",     email: "lara@ids.com",   dept: "HR",        role: "Manager",   status: "Active",   joined: "Sep 14, 2022", tickets: 12 },
  { id: 6,  name: "Omar Saab",       email: "omar@ids.com",   dept: "IT",        role: "Agent",     status: "Active",   joined: "Nov 1, 2022",  tickets: 31 },
  { id: 7,  name: "Nour Khalil",     email: "nour@ids.com",   dept: "Sales",     role: "End User",  status: "Inactive", joined: "Apr 22, 2024", tickets: 5  },
  { id: 8,  name: "Ziad Nassar",     email: "ziad@ids.com",   dept: "Legal",     role: "End User",  status: "Active",   joined: "Aug 7, 2023",  tickets: 6  },
  { id: 9,  name: "Maya Salameh",    email: "maya@ids.com",   dept: "Design",    role: "End User",  status: "Active",   joined: "Dec 19, 2023", tickets: 4  },
  { id: 10, name: "Rana Moussa",     email: "rana@ids.com",   dept: "IT",        role: "Agent",     status: "Active",   joined: "Jul 30, 2022", tickets: 29 },
  { id: 11, name: "Hassan Nasser",   email: "hassan@ids.com", dept: "Finance",   role: "Manager",   status: "Inactive", joined: "Feb 10, 2023", tickets: 15 },
  { id: 12, name: "Rima Hayek",      email: "rima@ids.com",   dept: "HR",        role: "End User",  status: "Active",   joined: "Oct 5, 2024",  tickets: 2  },
];

const ROLES   = ["All Roles",   "Admin", "Agent", "Manager", "End User"];
const DEPTS   = ["All Depts",   "IT", "Finance", "HR", "Sales", "Marketing", "Legal", "Design"];
const STATUSES = ["All Status", "Active", "Inactive"];

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [deptFilter, setDeptFilter] = useState("All Depts");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const filteredUsers = USERS.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)) &&
      (roleFilter === "All Roles" || u.role === roleFilter) &&
      (deptFilter === "All Depts" || u.dept === deptFilter) &&
      (statusFilter === "All Status" || u.status === statusFilter)
    );
  });

  const toggleSelectUser = (id) =>
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id));
  const toggleSelectAll = () => setSelectedUsers(allSelected ? [] : filteredUsers.map(u => u.id));

  return (
    <div className="user-management-container">

      <div className="user-management-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{USERS.length} users total · {USERS.filter(u => u.status === "Active").length} active</p>
        </div>
        <button className="button-primary" onClick={() => { setEditingUser(null); setShowModal(true); }}>
          <i className="ti ti-user-plus" /> Add User
        </button>
      </div>

      <div className="toolbar">
        <div className="search-wrapper">
          <i className="ti ti-search" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="search-input"
          />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}><i className="ti ti-x" /></button>}
        </div>
        <div className="filters-group">
          {[
            [roleFilter, setRoleFilter, ROLES],
            [deptFilter, setDeptFilter, DEPTS],
            [statusFilter, setStatusFilter, STATUSES],
          ].map(([value, setter, options], index) => (
            <select key={index} value={value} onChange={e => setter(e.target.value)} className="filter-select">
              {options.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          ))}
        </div>
        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-label">{selectedUsers.length} selected</span>
            <button className="bulk-button bulk-button--danger">
              <i className="ti ti-trash" /> Delete
            </button>
            <button className="bulk-button">
              <i className="ti ti-ban" /> Deactivate
            </button>
          </div>
        )}
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="checkbox" />
                </th>
                <th>User</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Tickets</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className={`table-row ${selectedUsers.includes(u.id) ? "table-row--selected" : ""}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleSelectUser(u.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{u.name[0]}</div>
                      <div className="user-details">
                        <span className="user-name">{u.name}</span>
                        <span className="user-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="department-name">{u.dept}</span></td>
                  <td><span className={`role-badge role-badge--${u.role.toLowerCase().replace(" ", "-")}`}>{u.role}</span></td>
                  <td>
                    <span className={`status-dot status-dot--${u.status.toLowerCase()}`} />
                    <span className="status-label">{u.status}</span>
                  </td>
                  <td><span className="ticket-count">{u.tickets}</span></td>
                  <td><span className="joined-date">{u.joined}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-button" title="Edit" onClick={() => { setEditingUser(u); setShowModal(true); }}>
                        <i className="ti ti-edit" />
                      </button>
                      <button className="action-button" title="View tickets">
                        <i className="ti ti-ticket" />
                      </button>
                      <button className="action-button action-button--danger" title="Delete">
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <i className="ti ti-users-group" />
                    <span>No users match your filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="page-info">Showing {filteredUsers.length} of {USERS.length} users</span>
          <div className="page-controls">
            <button className="page-button" disabled><i className="ti ti-chevron-left" /></button>
            <button className="page-button page-button--active">1</button>
            <button className="page-button"><i className="ti ti-chevron-right" /></button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUser ? "Edit User" : "Add New User"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" defaultValue={editingUser?.name} placeholder="e.g. Sara El-Khoury" />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" defaultValue={editingUser?.email} placeholder="user@ids.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Department</label>
                  <select className="form-input" defaultValue={editingUser?.dept}>
                    {DEPTS.slice(1).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select className="form-input" defaultValue={editingUser?.role}>
                    {ROLES.slice(1).map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {!editingUser && (
                <div className="form-field">
                  <label className="form-label">Temporary Password</label>
                  <input className="form-input" type="password" placeholder="Min 8 characters" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="button-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="button-primary">{editingUser ? "Save Changes" : "Create User"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
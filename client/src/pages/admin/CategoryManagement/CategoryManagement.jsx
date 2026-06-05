import { useState } from "react";
import "./CategoryManagement.css";

const INITIAL_CATEGORIES = [
    { id: 1, name: "Hardware", icon: "ti-cpu", color: "#3b82f6", description: "Physical devices, peripherals, and equipment issues", tickets: 34, active: true },
    { id: 2, name: "Software", icon: "ti-apps", color: "#8b5cf6", description: "Application bugs, crashes, and installation problems", tickets: 51, active: true },
    { id: 3, name: "Network & VPN", icon: "ti-network", color: "#06b6d4", description: "Connectivity, VPN access, and network infrastructure", tickets: 28, active: true },
    { id: 4, name: "Account & Access", icon: "ti-shield-lock", color: "#10b981", description: "Logins, passwords, permissions, and account management", tickets: 19, active: true },
    { id: 5, name: "Email & Calendar", icon: "ti-mail", color: "#f59e0b", description: "Outlook, email sync, calendar, and Teams issues", tickets: 22, active: true },
    { id: 6, name: "Printing", icon: "ti-printer", color: "#f97316", description: "Printer setup, drivers, and print queue problems", tickets: 11, active: true },
    { id: 7, name: "Onboarding", icon: "ti-user-check", color: "#d4f265", description: "New employee setup, equipment provisioning, accounts", tickets: 8, active: true },
    { id: 8, name: "Security", icon: "ti-lock", color: "#ef4444", description: "Antivirus, security incidents, and compliance requests", tickets: 6, active: true },
    { id: 9, name: "General / Other", icon: "ti-dots-circle-horizontal", color: "#6b7280", description: "Miscellaneous requests that don't fit other categories", tickets: 14, active: true },
    { id: 10, name: "Legacy Systems", icon: "ti-server", color: "#94a3b8", description: "Old systems maintained for compatibility — being phased out", tickets: 3, active: false },
];

const ICON_OPTIONS = [
    "ti-cpu", "ti-apps", "ti-network", "ti-shield-lock", "ti-mail", "ti-printer",
    "ti-user-check", "ti-lock", "ti-dots-circle-horizontal", "ti-server",
    "ti-database", "ti-cloud", "ti-headset", "ti-device-laptop", "ti-settings",
    "ti-tag", "ti-building", "ti-chart-bar", "ti-file", "ti-tools",
];

const COLOR_OPTIONS = [
    "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
    "#f97316", "#ef4444", "#d4f265", "#6b7280", "#94a3b8",
    "#03363d", "#ec4899", "#14b8a6", "#a78bfa", "#fb923c",
];

const EMPTY_FORM = { name: "", icon: "ti-tag", color: "#3b82f6", description: "" };

export default function CategoryManagement() {
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
    };

    const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        description: category.description
    });
    setShowModal(true);
    };

    const saveCategory = () => {
    if (!formData.name.trim()) return;

    if (editingCategory) {
        setCategories(prevCategories =>
        prevCategories.map(category =>
            category.id === editingCategory.id
            ? { ...category, ...formData }
            : category
        )
        );
    } else {
        setCategories(prevCategories => [
        ...prevCategories,
        {
            id: Date.now(),
            ...formData,
            tickets: 0,
            active: true,
        }
        ]);
    }
    setShowModal(false);
    };

    const toggleCategoryStatus = (id) => {
    setCategories(prevCategories =>
        prevCategories.map(category =>
        category.id === id
            ? { ...category, active: !category.active }
            : category
        )
    );
    };

    const deleteCategory = (id) => {
    setCategories(prevCategories => prevCategories.filter(category => category.id !== id));
    setDeleteConfirmation(null);
    };

    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.active).length;
    const inactiveCategories = categories.filter(c => !c.active).length;
    const totalTickets = categories.reduce((sum, category) => sum + category.tickets, 0);

    return (
    <div className="category-management">
        <div className="management-header">
        <div>
            <h1 className="management-title">Categories</h1>
            <p className="management-subtitle">
            {totalCategories} categories · {activeCategories} active
            </p>
        </div>
        <button className="button-primary" onClick={openCreateModal}>
            <i className="ti ti-plus" /> Add Category
        </button>
        </div>

        <div className="stats-grid">
        <div className="stat-card">
            <i className="ti ti-tag stat-icon stat-icon-blue" />
            <div className="stat-content">
            <span className="stat-value">{totalCategories}</span>
            <span className="stat-label">Total</span>
            </div>
        </div>

        <div className="stat-card">
            <i className="ti ti-circle-check stat-icon stat-icon-green" />
            <div className="stat-content">
            <span className="stat-value">{activeCategories}</span>
            <span className="stat-label">Active</span>
            </div>
        </div>

        <div className="stat-card">
            <i className="ti ti-ban stat-icon stat-icon-muted" />
            <div className="stat-content">
            <span className="stat-value">{inactiveCategories}</span>
            <span className="stat-label">Inactive</span>
            </div>
        </div>

        <div className="stat-card">
            <i className="ti ti-ticket stat-icon stat-icon-dark" />
            <div className="stat-content">
            <span className="stat-value">{totalTickets}</span>
            <span className="stat-label">Total Tickets</span>
            </div>
        </div>
        </div>

        <div className="search-toolbar">
        <div className="search-wrapper">
            <i className="ti ti-search" />
            <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories…"
            className="search-input"
            />
            {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
                <i className="ti ti-x" />
            </button>
            )}
        </div>
        </div>

        <div className="categories-grid">
        {filteredCategories.map(category => (
            <div key={category.id} className={`category-card ${!category.active ? "category-inactive" : ""}`}>
            <div className="category-color-bar" style={{ background: category.color }} />

            <div className="category-content">
                <div className="category-top">
                <div className="category-icon" style={{ background: category.color + "22", color: category.color }}>
                    <i className={`ti ${category.icon}`} />
                </div>
                <div className="category-controls">
                    {!category.active && <span className="inactive-badge">Inactive</span>}
                    <label className="toggle-switch" title={category.active ? "Deactivate" : "Activate"}>
                    <input
                        type="checkbox"
                        checked={category.active}
                        onChange={() => toggleCategoryStatus(category.id)}
                    />
                    <span className="toggle-track">
                        <span className="toggle-thumb" />
                    </span>
                    </label>
                </div>
                </div>

                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>

                <div className="category-footer">
                <span className="ticket-count">
                    <i className="ti ti-ticket" /> {category.tickets} tickets
                </span>
                <div className="action-buttons">
                    <button className="action-button" title="Edit" onClick={() => openEditModal(category)}>
                    <i className="ti ti-edit" />
                    </button>
                    <button className="action-button action-button-danger" title="Delete" onClick={() => setDeleteConfirmation(category)}>
                    <i className="ti ti-trash" />
                    </button>
                </div>
                </div>
            </div>
            </div>
        ))}

        {filteredCategories.length === 0 && (
            <div className="empty-state">
            <i className="ti ti-tag" />
            <span>No categories found.</span>
            <button className="button-primary" onClick={openCreateModal}>
                <i className="ti ti-plus" /> Create one
            </button>
            </div>
        )}
        </div>

        {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">
                {editingCategory ? "Edit Category" : "New Category"}
                </h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="ti ti-x" />
                </button>
            </div>

            <div className="modal-body">
                <div className="preview-section">
                <div className="preview-icon" style={{ background: formData.color + "22", color: formData.color }}>
                    <i className={`ti ${formData.icon}`} />
                </div>
                <span className="preview-name">{formData.name || "Category name"}</span>
                </div>

                <div className="form-field">
                <label className="form-label">Category Name <span className="required-star">*</span></label>
                <input
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Hardware"
                />
                </div>

                <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                    className="form-input form-textarea"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description of what this category covers…"
                    rows={2}
                />
                </div>

                <div className="form-field">
                <label className="form-label">Icon</label>
                <div className="icon-grid">
                    {ICON_OPTIONS.map(icon => (
                    <button
                        key={icon}
                        className={`icon-button ${formData.icon === icon ? "icon-button-active" : ""}`}
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon }))}
                        style={formData.icon === icon ? { background: formData.color + "22", color: formData.color, borderColor: formData.color } : {}}
                        title={icon.replace("ti-", "")}
                    >
                        <i className={`ti ${icon}`} />
                    </button>
                    ))}
                </div>
                </div>

                <div className="form-field">
                <label className="form-label">Color</label>
                <div className="color-grid">
                    {COLOR_OPTIONS.map(color => (
                    <button
                        key={color}
                        className={`color-swatch ${formData.color === color ? "color-swatch-active" : ""}`}
                        style={{ background: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color: color }))}
                        title={color}
                    >
                        {formData.color === color && <i className="ti ti-check" />}
                    </button>
                    ))}
                </div>
                </div>
            </div>

            <div className="modal-footer">
                <button className="button-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                className="button-primary"
                onClick={saveCategory}
                disabled={!formData.name.trim()}
                >
                {editingCategory ? "Save Changes" : "Create Category"}
                </button>
            </div>
            </div>
        </div>
        )}

        {deleteConfirmation && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmation(null)}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
                <i className="ti ti-alert-triangle" />
            </div>
            <h3 className="confirm-title">Delete "{deleteConfirmation.name}"?</h3>
            <p className="confirm-text">
                This will remove the category. The {deleteConfirmation.tickets} associated tickets
                will need to be reassigned manually.
            </p>
            <div className="confirm-actions">
                <button className="button-ghost" onClick={() => setDeleteConfirmation(null)}>Cancel</button>
                <button className="button-danger" onClick={() => deleteCategory(deleteConfirmation.id)}>
                <i className="ti ti-trash" /> Delete
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
    );
}
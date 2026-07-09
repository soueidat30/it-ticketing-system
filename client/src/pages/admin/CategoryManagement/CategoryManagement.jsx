import { useEffect, useMemo, useState } from "react";
import "./CategoryManagement.css";
import { authFetch } from "../../../services/authFetch";

const BASE = "http://127.0.0.1:8000/api";

const EMPTY_FORM = { name: "", icon: "ti-tag", color: "#3b82f6", description: "" };

// FIX: previously, when the /admin/category-design-options endpoint
// returned empty arrays (which is the case before ANY category has ever
// been created) the modal showed a raw "No icons yet…" line and the
// Create button was permanently disabled — the admin literally could
// not create the first category. These sensible defaults let the user
// pick from a curated palette out of the box, and the API-returned
// list is still preferred whenever it has entries.
const DEFAULT_ICONS = [
  "ti-tag", "ti-cpu", "ti-device-desktop", "ti-device-laptop",
  "ti-server", "ti-network", "ti-wifi", "ti-cloud",
  "ti-lock", "ti-shield", "ti-key", "ti-mail",
  "ti-phone", "ti-printer", "ti-database", "ti-bug",
  "ti-tools", "ti-settings", "ti-user", "ti-users",
  "ti-briefcase", "ti-file-text", "ti-folder", "ti-headset",
  "ti-alert-triangle", "ti-help", "ti-question-mark", "ti-book",
  "ti-credit-card", "ti-building",
];

const DEFAULT_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#ef4444", "#f97316", "#f59e0b",
  "#eab308", "#84cc16", "#22c55e", "#10b981",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#64748b",
];

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [categoriesDesignOptions, setCategoriesDesignOptions] = useState({
        icons: [],
        colors: [],
    });

    const filteredCategories = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return categories.filter(
            (category) =>
                category.name.toLowerCase().includes(q) ||
                category.description.toLowerCase().includes(q)
        );
    }, [categories, searchQuery]);

    // Prefer API-returned options, fall back to defaults when empty.
    const iconOptions = useMemo(() => {
        return categoriesDesignOptions.icons.length > 0
            ? categoriesDesignOptions.icons
            : DEFAULT_ICONS;
    }, [categoriesDesignOptions.icons]);

    const colorOptions = useMemo(() => {
        return categoriesDesignOptions.colors.length > 0
            ? categoriesDesignOptions.colors
            : DEFAULT_COLORS;
    }, [categoriesDesignOptions.colors]);

    const usingDefaultIcons = categoriesDesignOptions.icons.length === 0;
    const usingDefaultColors = categoriesDesignOptions.colors.length === 0;

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const [categoriesRes, designRes] = await Promise.all([
                authFetch(`${BASE}/admin/categories`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }),
                authFetch(`${BASE}/admin/category-design-options`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }),
            ]);

            const categoriesData = await categoriesRes.json().catch(() => []);
            const designData = await designRes.json().catch(() => ({ icons: [], colors: [] }));

            if (!isMounted) return;

            if (categoriesRes.ok) {
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            }

            if (designRes.ok) {
                setCategoriesDesignOptions({
                    icons: Array.isArray(designData.icons) ? designData.icons : [],
                    colors: Array.isArray(designData.colors) ? designData.colors : [],
                });
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

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

    const reloadCategories = async () => {
        const res = await authFetch(`${BASE}/admin/categories`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json().catch(() => []);
        setCategories(Array.isArray(data) ? data : []);
    };

    const saveCategory = async () => {
        if (!formData.name.trim()) return;
        if (!formData.icon || !formData.color) return;

        if (editingCategory) {
            await authFetch(`${BASE}/admin/categories/${editingCategory.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category_name: formData.name,
                    description: formData.description,
                    icon: formData.icon,
                    color: formData.color,
                }),
            });
        } else {
            await authFetch(`${BASE}/admin/categories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category_name: formData.name,
                    description: formData.description,
                    icon: formData.icon,
                    color: formData.color,
                }),
            });
        }

        setShowModal(false);
        await reloadCategories();
    };

    const toggleCategoryStatus = async (id) => {
        await authFetch(`${BASE}/admin/categories/${id}/toggle-status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
        });
        await reloadCategories();
    };

    const deleteCategory = async (id) => {
        await authFetch(`${BASE}/admin/categories/${id}`, {
            method: "DELETE",
        });
        setDeleteConfirmation(null);
        await reloadCategories();
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
                                <label className="form-label">
                                    Icon
                                    {usingDefaultIcons && (
                                        <span className="form-label-hint">
                                            <i className="ti ti-sparkles" /> Suggested icons
                                        </span>
                                    )}
                                </label>
                                <div className="icon-grid">
                                    {iconOptions.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`icon-button ${formData.icon === icon ? "icon-button-active" : ""}`}
                                            onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                                            style={
                                                formData.icon === icon
                                                    ? {
                                                        background: (formData.color || "#3b82f6") + "22",
                                                        color: formData.color || "#3b82f6",
                                                        borderColor: formData.color || "#3b82f6",
                                                    }
                                                    : {}
                                            }
                                            title={icon.replace("ti-", "")}
                                        >
                                            <i className={`ti ${icon}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-label">
                                    Color
                                    {usingDefaultColors && (
                                        <span className="form-label-hint">
                                            <i className="ti ti-palette" /> Suggested palette
                                        </span>
                                    )}
                                </label>
                                <div className="color-grid">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`color-swatch ${formData.color === color ? "color-swatch-active" : ""}`}
                                            style={{ background: color }}
                                            onClick={() => setFormData((prev) => ({ ...prev, color }))}
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
                                disabled={!formData.name.trim() || !formData.icon || !formData.color}
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
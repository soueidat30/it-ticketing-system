import { useEffect, useState, useCallback, useRef } from "react";
import "./KnowledgeBase.css";

const BASE = "http://127.0.0.1:8000/api";

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
});

// ── Category icon map ─────────────────────────────────────────────────────────
const CAT_ICONS = {
  "ti-wifi-off":    "Network",
  "ti-mail":        "Email",
  "ti-cpu":         "Hardware",
  "ti-code":        "Software",
  "ti-key":         "Access",
  "ti-book":        "General",
};

const CAT_COLORS = [
  { bg: "#eef2ff", color: "#4f46e5", border: "#c7d2fe" },
  { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── ArticleModal ──────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose, token }) {
  const [voted, setVoted] = useState(null);

  const handleVote = async (v) => {
    if (voted) return;
    setVoted(v);
    try {
      await fetch(`${BASE}/kb/articles/${article.id}/helpful`, {
        method: "POST",
        headers: { ...headers(token), "Content-Type": "application/json" },
        body: JSON.stringify({ vote: v }),
      });
    } catch {}
  };

  // close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const helpfulPct = article.helpful_yes + article.helpful_no > 0
    ? Math.round((article.helpful_yes / (article.helpful_yes + article.helpful_no)) * 100)
    : null;

  return (
    <div className="kb-modal-backdrop" onClick={onClose}>
      <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
        <button className="kb-modal__close" onClick={onClose}>
          <i className="ti ti-x" />
        </button>

        <div className="kb-modal__meta">
          {article.is_faq && (
            <span className="kb-faq-badge">
              <i className="ti ti-help-circle" /> FAQ
            </span>
          )}
          <span className="kb-modal__cat">{article.category?.name}</span>
          <span className="kb-modal__views">
            <i className="ti ti-eye" /> {article.views} views
          </span>
        </div>

        <h2 className="kb-modal__title">{article.title}</h2>

        {article.excerpt && (
          <p className="kb-modal__excerpt">{article.excerpt}</p>
        )}

        <div className="kb-modal__divider" />

        <div
          className="kb-modal__content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="kb-modal__divider" />

        <div className="kb-modal__footer">
          <div className="kb-modal__author">
            <div className="kb-author-avatar">
              {(article.author?.full_name?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <span className="kb-author-name">{article.author?.full_name || "IT Support"}</span>
              <span className="kb-author-date">Updated {timeAgo(article.updated_at)}</span>
            </div>
          </div>

          <div className="kb-modal__vote">
            <span className="kb-vote-label">Was this helpful?</span>
            <div className="kb-vote-btns">
              <button
                className={`kb-vote-btn kb-vote-btn--yes ${voted === "yes" ? "kb-vote-btn--active" : ""}`}
                onClick={() => handleVote("yes")}
                disabled={!!voted}
              >
                <i className="ti ti-thumb-up" />
                {article.helpful_yes + (voted === "yes" ? 1 : 0)}
              </button>
              <button
                className={`kb-vote-btn kb-vote-btn--no ${voted === "no" ? "kb-vote-btn--active" : ""}`}
                onClick={() => handleVote("no")}
                disabled={!!voted}
              >
                <i className="ti ti-thumb-down" />
                {article.helpful_no + (voted === "no" ? 1 : 0)}
              </button>
            </div>
            {helpfulPct !== null && (
              <span className="kb-vote-pct">{helpfulPct}% found this helpful</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ArticleCard ───────────────────────────────────────────────────────────────
function ArticleCard({ article, catColor, onClick }) {
  return (
    <button className="kb-article-card" onClick={onClick}>
      {article.is_faq && (
        <span className="kb-faq-pill">
          <i className="ti ti-help-circle" /> FAQ
        </span>
      )}
      <h3 className="kb-article-card__title">{article.title}</h3>
      {article.excerpt && (
        <p className="kb-article-card__excerpt">{article.excerpt}</p>
      )}
      <div className="kb-article-card__footer">
        <span
          className="kb-article-card__cat"
          style={{ background: catColor?.bg, color: catColor?.color }}
        >
          {article.category?.name}
        </span>
        <span className="kb-article-card__meta">
          <i className="ti ti-eye" /> {article.views}
          <span style={{ margin: "0 6px", opacity: 0.3 }}>·</span>
          {timeAgo(article.updated_at)}
        </span>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function KnowledgeBase() {
  const token = localStorage.getItem("token");
  // Debug: helps identify why KB requests return 401 (missing/invalid token)
  // eslint-disable-next-line no-console
  console.log("KB token present?", { tokenExists: !!token, tokenLen: token ? token.length : 0 });


  const [categories,  setCategories]  = useState([]);
  const [articles,    setArticles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState(null); // null = all
  const [showFaqOnly, setShowFaqOnly] = useState(false);
  const [selected,    setSelected]    = useState(null); // open article
  const [view,        setView]        = useState("grid"); // grid | list

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // debounce search
  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 350);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)         params.set("search", search);
      if (activeCategory) params.set("category_id", activeCategory);
      if (showFaqOnly)    params.set("is_faq", "1");

      const call = async (accessToken) => {
        const [catsRes, artsRes] = await Promise.all([
          fetch(`${BASE}/kb/categories`, { headers: headers(accessToken) }),
          fetch(`${BASE}/kb/articles?${params}`, { headers: headers(accessToken) }),
        ]);

        if (catsRes.status === 401 || artsRes.status === 401) {
          return { unauthorized: true };
        }

        const catsData = await catsRes.json().catch(() => []);
        const artsData = await artsRes.json().catch(() => []);

        return {
          unauthorized: false,
          cats: Array.isArray(catsData) ? catsData : catsData?.data || [],
          arts: Array.isArray(artsData) ? artsData : artsData?.data || [],
        };
      };

      let result = await call(token);

      if (result?.unauthorized) {
        const refreshRes = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const refreshData = await refreshRes.json().catch(() => ({}));
        const newToken = refreshData?.access_token;

        if (newToken) {
          localStorage.setItem("token", newToken);
          result = await call(newToken);
        }
      }

      if (!result?.unauthorized) {
        setCategories(result.cats);
        setArticles(result.arts);
      }
    } catch (err) {
      console.error("KB fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [token, search, activeCategory, showFaqOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── open article and load full content ──────────────────────────────────────
  const openArticle = async (article) => {
    setSelected(article); // show immediately with what we have
    try {
      const res = await fetch(`${BASE}/kb/articles/${article.id}`, {
        headers: headers(token),
      });
      const full = await res.json();
      setSelected(full);
    } catch {}
  };

  // ── derived ──────────────────────────────────────────────────────────────────
  const catColorMap = {};
  categories.forEach((c, i) => {
    catColorMap[c.id] = CAT_COLORS[i % CAT_COLORS.length];
  });

  const totalArticles = articles.length;
  const faqCount = articles.filter(a => a.is_faq).length;

  return (
    <div className="kb-page">

      {/* ── HERO ── */}
      <div className="kb-hero">
        <div className="kb-hero__text">
          <h1 className="kb-hero__title">
            <i className="ti ti-bulb" /> IT Help Centre
          </h1>
          <p className="kb-hero__sub">
            Find answers, troubleshoot issues, and learn how to use your tools.
          </p>
        </div>

        <div className="kb-search-wrap">
          <i className="ti ti-search kb-search-icon" />
          <input
            ref={searchRef}
            className="kb-search"
            placeholder="Search articles, FAQs, guides…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoComplete="off"
          />
          {searchInput && (
            <button
              className="kb-search-clear"
              onClick={() => { setSearchInput(""); setSearch(""); searchRef.current?.focus(); }}
            >
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        <div className="kb-hero__stats">
          <span><b>{totalArticles}</b> articles</span>
          <span className="kb-hero__dot" />
          <span><b>{faqCount}</b> FAQs</span>
          <span className="kb-hero__dot" />
          <span><b>{categories.length}</b> categories</span>
        </div>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      {categories.length > 0 && (
        <div className="kb-cats">
          <button
            className={`kb-cat-chip ${!activeCategory ? "kb-cat-chip--active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            <i className="ti ti-layout-grid" />
            All topics
          </button>
          {categories.map((cat, i) => {
            const col = CAT_COLORS[i % CAT_COLORS.length];
            return (
              <button
                key={cat.id}
                className={`kb-cat-chip ${activeCategory === cat.id ? "kb-cat-chip--active" : ""}`}
                style={
                  activeCategory === cat.id
                    ? { background: col.bg, color: col.color, borderColor: col.border }
                    : {}
                }
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              >
                <i className={`ti ${cat.icon || "ti-folder"}`} />
                {cat.name}
                {cat.articles_count > 0 && (
                  <span className="kb-cat-count">{cat.articles_count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="kb-toolbar">
        <label className="kb-faq-toggle">
          <input
            type="checkbox"
            checked={showFaqOnly}
            onChange={(e) => setShowFaqOnly(e.target.checked)}
          />
          <span className="kb-faq-toggle__track" />
          <span className="kb-faq-toggle__label">FAQs only</span>
        </label>

        <span className="kb-results-count">
          {loading ? "Loading…" : `${totalArticles} result${totalArticles !== 1 ? "s" : ""}`}
        </span>

        <div className="kb-view-btns">
          <button
            className={`kb-view-btn ${view === "grid" ? "kb-view-btn--active" : ""}`}
            onClick={() => setView("grid")}
            title="Grid view"
          >
            <i className="ti ti-layout-grid" />
          </button>
          <button
            className={`kb-view-btn ${view === "list" ? "kb-view-btn--active" : ""}`}
            onClick={() => setView("list")}
            title="List view"
          >
            <i className="ti ti-list" />
          </button>
        </div>
      </div>

      {/* ── ARTICLES ── */}
      {loading ? (
        <div className="kb-loading">
          <i className="ti ti-loader kb-spin" />
          <span>Loading knowledge base…</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="kb-empty">
          <div className="kb-empty__icon">
            <i className="ti ti-file-search" />
          </div>
          <h3>No articles found</h3>
          <p>
            {search
              ? `No results for "${search}". Try different keywords.`
              : "No articles in this category yet."}
          </p>
          {(search || activeCategory || showFaqOnly) && (
            <button
              className="kb-clear-btn"
              onClick={() => {
                setSearch(""); setSearchInput("");
                setActiveCategory(null); setShowFaqOnly(false);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={view === "grid" ? "kb-grid" : "kb-list"}>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              catColor={catColorMap[article.kb_category_id]}
              onClick={() => openArticle(article)}
            />
          ))}
        </div>
      )}

      {/* ── ARTICLE MODAL ── */}
      {selected && (
        <ArticleModal
          article={selected}
          token={token}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
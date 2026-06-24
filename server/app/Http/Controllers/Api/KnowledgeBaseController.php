<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbArticle;
use App\Models\KbCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class KnowledgeBaseController extends Controller
{
    // GET /api/kb/categories
    public function categories()
    {
        $cats = KbCategory::withCount(['articles' => fn($q) => $q->where('status','published')])
            ->orderBy('name')
            ->get();
        return response()->json($cats);
    }

    // GET /api/kb/articles?search=&category_id=&is_faq=
    public function index(Request $request)
    {
        $query = KbArticle::with(['category','author'])
            ->where('status', 'published');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('title',   'like', "%{$s}%")
                ->orWhere('excerpt','like', "%{$s}%")
                ->orWhere('content','like', "%{$s}%")
            );
        }

        if ($request->filled('category_id')) {
            $query->where('kb_category_id', $request->category_id);
        }

        if ($request->boolean('is_faq')) {
            $query->where('is_faq', true);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    // GET /api/kb/articles/{id}
    public function show($id)
    {
        $article = KbArticle::with(['category','author'])
            ->where('status','published')
            ->where(fn($q) => $q->where('id',$id)->orWhere('slug',$id))
            ->firstOrFail();

        // increment views
        $article->increment('views');

        return response()->json($article);
    }

    // POST /api/kb/articles/{id}/helpful
    public function helpful(Request $request, $id)
    {
        $request->validate(['vote' => 'required|in:yes,no']);
        $article = KbArticle::findOrFail($id);

        if ($request->vote === 'yes') {
            $article->increment('helpful_yes');
        } else {
            $article->increment('helpful_no');
        }

        return response()->json(['message' => 'Thank you for your feedback!']);
    }

    // ── Admin/Agent routes ─────────────────────────────────────────────────────

    // POST /api/kb/articles
    public function store(Request $request)
    {
        $request->validate([
            'title'          => 'required|string|max:255',
            'content'        => 'required|string',
            'kb_category_id' => 'required|exists:kb_categories,id',
            'excerpt'        => 'nullable|string|max:500',
            'is_faq'         => 'boolean',
        ]);

        $slug = Str::slug($request->title) . '-' . Str::random(5);

        $article = KbArticle::create([
            'title'          => $request->title,
            'slug'           => $slug,
            'content'        => $request->content,
            'excerpt'        => $request->excerpt ?? Str::limit(strip_tags($request->content), 160),
            'kb_category_id' => $request->kb_category_id,
            'author_id'      => Auth::id(),
            'is_faq'         => $request->boolean('is_faq'),
            'status'         => 'pending', // requires admin approval
        ]);

        return response()->json($article->load('category','author'), 201);
    }

    // PATCH /api/kb/articles/{id}/approve  (admin only)
    public function approve($id)
    {
        $article = KbArticle::findOrFail($id);
        $article->update([
            'status'      => 'published',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        // update category article count
        $article->category->increment('article_count');

        return response()->json(['message' => 'Article published.']);
    }
}
<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class KbArticle extends Model
{
    protected $fillable = [
        'kb_category_id','author_id','title','slug','excerpt',
        'content','status','is_faq','views','helpful_yes','helpful_no',
        'approved_by','approved_at',
    ];
 
    protected $casts = ['is_faq' => 'boolean', 'approved_at' => 'datetime'];
 
    public function category()  { return $this->belongsTo(KbCategory::class, 'kb_category_id'); }
    public function author()    { return $this->belongsTo(User::class, 'author_id'); }
    public function approver()  { return $this->belongsTo(User::class, 'approved_by'); }
}
 
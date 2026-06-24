<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class KbCategory extends Model
{
    protected $fillable = ['name','slug','icon','description','article_count'];
 
    public function articles()
    {
        return $this->hasMany(KbArticle::class);
    }
}
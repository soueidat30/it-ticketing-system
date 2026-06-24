<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function summary(Request $request)
    {
        $query = Ticket::with(['status','priority','category','user']);

        if ($request->filled('days')) {
            $query->where('created_at', '>=', now()->subDays($request->days));
        }

        $tickets = $query->get();
        $total   = $tickets->count();
        $resolved = $tickets->filter(fn($t) => in_array(
            strtolower($t->status?->status_name ?? ''), ['resolved','closed']
        ))->count();

        $avgHours = null;
        $resTickets = $tickets->filter(fn($t) => $t->resolved_at && $t->created_at);
        if ($resTickets->count() > 0) {
            $totalHours = $resTickets->sum(fn($t) =>
                (new \DateTime($t->resolved_at))->getTimestamp() -
                (new \DateTime($t->created_at))->getTimestamp()
            ) / 3600;
            $avgHours = round($totalHours / $resTickets->count(), 1);
        }

        return response()->json([
            'total'            => $total,
            'open'             => $tickets->filter(fn($t) => strtolower($t->status?->status_name??'') === 'open')->count(),
            'in_progress'      => $tickets->filter(fn($t) => strtolower($t->status?->status_name??'') === 'in progress')->count(),
            'resolved'         => $resolved,
            'critical'         => $tickets->filter(fn($t) => strtolower($t->priority?->priority_name??'') === 'critical')->count(),
            'resolution_rate'  => $total > 0 ? round($resolved/$total*100, 1) : 0,
            'avg_resolution_h' => $avgHours,
        ]);
    }

    public function monthly(Request $request)
    {
        $months = (int) ($request->months ?? 6);

        $rows = \DB::table('tickets')
            ->selectRaw("DATE_FORMAT(created_at, '%m/%y') as month, COUNT(*) as created")
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupByRaw("DATE_FORMAT(created_at, '%m/%y')")
            ->orderByRaw("MIN(created_at)")
            ->get();

        return response()->json($rows);
    }

    public function exportCsv(Request $request)
    {
        $tickets = Ticket::with(['status','priority','category','user'])
            ->when($request->filled('days'), fn($q) =>
                $q->where('created_at', '>=', now()->subDays($request->days))
            )
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="tickora-report-'.date('Y-m-d').'.csv"',
        ];

        $callback = function () use ($tickets) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Ticket #','Title','Employee','Category','Priority','Status','Created','Resolved']);
            foreach ($tickets as $t) {
                fputcsv($out, [
                    $t->ticket_number,
                    $t->title,
                    $t->user?->full_name ?? '—',
                    $t->category?->category_name ?? '—',
                    $t->priority?->priority_name ?? '—',
                    $t->status?->status_name ?? '—',
                    $t->created_at?->format('d/m/Y') ?? '',
                    $t->resolved_at?->format('d/m/Y') ?? '',
                ]);
            }
            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }
}
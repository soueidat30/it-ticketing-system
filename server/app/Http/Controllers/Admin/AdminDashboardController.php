<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $openTickets = Ticket::whereHas('status', function ($q) {
            $q->where('status_name', 'Open');
        })->count();

        $resolvedToday = Ticket::whereDate('resolved_at', Carbon::today())
            ->count();


        $resolvedTickets = Ticket::query()
            ->whereNotNull('resolved_at')
            ->get(['created_at', 'resolved_at']);

        $totalMinutes = 0;
        $validCount = 0;

        foreach ($resolvedTickets as $ticket) {
            if (! $ticket->created_at || ! $ticket->resolved_at) {
                continue;
            }

            try {
                $created = Carbon::parse($ticket->created_at);
                $resolved = Carbon::parse($ticket->resolved_at);
                $totalMinutes += $created->diffInMinutes($resolved);
                $validCount++;
            } catch (\Throwable $e) {
                continue;
            }
        }

        $avgMinutes = $validCount > 0
            ? round($totalMinutes / $validCount)
            : 0;

        $avgResponse = floor($avgMinutes / 60) . 'h ' . ($avgMinutes % 60) . 'm';


        $recentTickets = Ticket::with([
            'user',
            'priority',
            'status'
        ])
            ->latest()
            ->take(6)
            ->get();

        $recentTickets = $recentTickets->map(function ($ticket) {
            return [
                'id' => $ticket->ticket_number,
                'subject' => $ticket->title,
                'user' => $ticket->user?->full_name,
                'dept' => $ticket->user?->department,
                'priority' => $ticket->priority?->priority_name,
                'status' => $ticket->status?->status_name,
                'time' => $ticket->created_at ? $ticket->created_at->diffForHumans() : null,

            ];
        });

        $priorityBreakdownRows = Ticket::query()
            ->selectRaw('priority_id, COUNT(*) as cnt')
            ->groupBy('priority_id')
            ->get();

        $priorityBreakdown = $priorityBreakdownRows->map(function ($row) {
            return [
                'label' => optional($row->priority)->priority_name ?? null,
                'count' => (int) $row->cnt,
            ];
        });

        $priorityCounts = Ticket::query()
            ->selectRaw('priority_id, COUNT(*) as cnt')
            ->groupBy('priority_id')
            ->with(['priority:id,priority_name'])
            ->get();

        $totalTickets = $priorityCounts->sum('cnt');

        $priorityBreakdown = $priorityCounts->map(function ($row) use ($totalTickets) {
            $count = (int) $row->cnt;
            $pct = $totalTickets > 0 ? round(($count / $totalTickets) * 100) : 0;

            $label = optional($row->priority)->priority_name;

            $colorMap = [
                'Critical' => '#ef4444',
                'High' => '#f97316',
                'Medium' => '#eab308',
                'Low' => '#22c55e',
            ];

            return [
                'label' => $label,
                'count' => $count,
                'pct' => $pct,
                'color' => $colorMap[$label] ?? '#94a3b8',
            ];
        })->values();

        $topAgentsRows = Ticket::query()
            ->selectRaw('assigned_to as user_id, COUNT(*) as total, SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved')
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->orderByDesc('total')
            ->take(4)
            ->get();

        $topAgents = $topAgentsRows->map(function ($row, $idx) {
            $user = \App\Models\User::query()->select(['id', 'full_name', 'department', 'role_id'])->where('id', $row->user_id)->first();

            $total = (int) $row->total;
            $resolved = (int) $row->resolved;
            $rating = $total > 0 ? round(($resolved / $total) * 5, 1) : 0;

            $avatar = $user && $user->full_name ? strtoupper(substr($user->full_name, 0, 1)) : '?';

            return [
                'name' => $user?->full_name,
                'tickets' => $total,
                'resolved' => $resolved,
                'avatar' => $avatar,
                'rating' => $rating,
            ];
        })->values();

        $activityFeedRows = \App\Models\TicketStatusHistory::query()
            ->with(['changer:id,full_name', 'ticket:id,ticket_number,title', 'status:id,status_name'])
            ->latest()
            ->take(5)
            ->get();

        $activityFeed = $activityFeedRows->map(function ($row) {
            $status = $row->status?->status_name;
            $changer = $row->changer?->full_name;
            $ticketNumber = $row->ticket?->ticket_number;
            $ticketTitle = $row->ticket?->title;

            $color = 'muted';
            $icon = 'ti-settings';
            $text = "Ticket #{$ticketNumber} updated";

            if ($status) {
                $lower = strtolower($status);
                if (str_contains($lower, 'resolved')) {
                    $color = 'green';
                    $icon = 'ti-circle-check';
                    $text = "Ticket #{$ticketNumber} marked resolved by {$changer}";
                } elseif (str_contains($lower, 'pending')) {
                    $color = 'red';
                    $icon = 'ti-alert-triangle';
                    $text = "Ticket #{$ticketNumber} moved to pending";
                }
            }

            return [
                'icon' => $icon,
                'text' => $text,
                'time' => $row->created_at?->diffForHumans(),
                'color' => $color,
            ];
        })->values();

        return response()->json([
            'totalTickets' => Ticket::count(),
            'openTickets' => $openTickets,
            'resolvedToday' => $resolvedToday,
            'avgResponse' => $avgResponse,
            'recentTickets' => $recentTickets,
            'priorityBreakdown' => $priorityBreakdown,
            'topAgents' => $topAgents,
            'activityFeed' => $activityFeed,
            'slaBreaches' => Ticket::where('response_breached', true)
                ->orWhere('resolution_breached', true)
                ->count(),
        ]);

    }
}


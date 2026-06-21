<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Status;
use App\Models\Ticket;
use Illuminate\Console\Command;

class CheckSlaBreaches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-sla-breaches';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and mark SLA breaches for tickets (response and resolution).';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $this->info('Checking response SLA breaches...');
        Ticket::query()
            ->whereNull('first_response_at')
            ->where('response_due_at', '<', $now)
            ->where('response_breached', false)
            ->chunkById(500, function ($tickets) {
                $tickets->each(function (Ticket $ticket) {
                    $ticket->update(['response_breached' => true]);

                    ActivityLog::create([
                        'user_id' => null,
                        'action' => 'SLA Breached',
                        'module' => 'SLA',
                        'target_type' => 'Ticket',
                        'target_id' => $ticket->id,
                        'details' => 'Response SLA breached',
                    ]);
                });
            });

        $this->info('Checking resolution SLA breaches...');

        $resolvedStatusId = Status::query()
            ->where('status_name', 'Resolved')
            ->value('id');

        if ($resolvedStatusId === null) {
            $this->warn('Status with name "Resolved" not found. Skipping resolution SLA breach checks.');
            return self::SUCCESS;
        }

        Ticket::query()
            ->whereNotIn('status_id', [$resolvedStatusId])
            ->where('resolution_due_at', '<', $now)
            ->where('resolution_breached', false)
            ->chunkById(500, function ($tickets) {
                $tickets->each(function (Ticket $ticket) {
                    $ticket->update(['resolution_breached' => true]);

                    ActivityLog::create([
                        'user_id' => null,
                        'action' => 'SLA Breached',
                        'module' => 'SLA',
                        'target_type' => 'Ticket',
                        'target_id' => $ticket->id,
                        'details' => 'Resolution SLA breached',
                    ]);
                });
            });

        $this->info('SLA breach check completed.');

        return self::SUCCESS;
    }
}


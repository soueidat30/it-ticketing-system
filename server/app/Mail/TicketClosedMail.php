<?php

namespace App\Mail;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Markdown\MarkDown;
use Illuminate\Queue\SerializesModels;

class TicketClosedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Ticket $ticket;
    public ?string $solution;

    public function __construct(Ticket $ticket, ?string $solution = null)
    {
        $this->ticket = $ticket;
        $this->solution = $solution;
    }

    public function build()
    {
        $ticket = $this->ticket;

        // Ensure we have a valid email recipient (best-effort logging only)
        $email = $ticket->client_email ?? $ticket->user?->email;
        if (empty($email)) {
            \Log::warning('TicketClosedMail built with no email address', [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
            ]);
        }

        $subject = "Your ticket {$ticket->ticket_number} is closed";

        return $this->subject($subject)
            ->markdown('emails.ticket_closed')
            ->with([
                'ticket' => $ticket,
                'solution' => $this->solution,
            ]);
    }
}


<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TicketClosedNotification extends Notification
{
    use Queueable;

    private Ticket $ticket;
    private ?string $solution;

    public function __construct(Ticket $ticket, ?string $solution = null)
    {
        $this->ticket = $ticket;
        $this->solution = $solution;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $ticket = $this->ticket;

        $message = (new MailMessage())
            ->subject("Your ticket {$ticket->ticket_number} is closed")
            ->greeting('Hello')
            ->line('Your ticket has been closed.')
            ->line("Ticket: {$ticket->ticket_number}")
            ->line("Title: {$ticket->title}")
            ->line("Status: {$ticket->status?->status_name}");

        if (!empty($this->solution)) {
            $message->line('Resolution:')
                ->line($this->solution);
        }

        return $message;
    }
}


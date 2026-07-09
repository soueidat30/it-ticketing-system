@php
    // This template is rendered by App\\Mail\\TicketClosedMail via markdown('emails.ticket_closed').
    // Use simple inline styles for best email-client compatibility.
@endphp

<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ticket Closed</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;">

    <div style="max-width:680px;margin:0 auto;padding:24px;">

        <!-- Header -->
        <div style="background:#111827;border-radius:14px 14px 0 0;padding:22px 24px;color:#fff;">
            <div style="display:flex;align-items:center;gap:12px;">
                <img src="https://localhost:5173/src/assets/logo.png" alt="Tickora" style="width:42px;height:42px;object-fit:contain;" />
                <div>
                    <div style="font-size:14px;opacity:0.9;letter-spacing:0.2px;">Tickora</div>
                    <div style="font-size:22px;font-weight:700;line-height:1.25;margin-top:6px;">Ticket Closed</div>
                </div>
            </div>
        </div>

        <!-- Content card -->
        <div style="background:#ffffff;border-radius:0 0 14px 14px;padding:24px;border:1px solid #e5e7eb;border-top:none;">

            <p style="margin:0 0 14px 0;color:#111827;font-size:14px;">
                Hello <strong>{{ $ticket->user->full_name ?? $ticket->user->username ?? 'Customer' }}</strong>,
            </p>

            <p style="margin:0 0 18px 0;color:#111827;font-size:14px;line-height:1.5;">
                Your ticket <strong style="color:#2563eb;">{{ $ticket->ticket_number }}</strong> has been closed.
            </p>

            <!-- Ticket summary -->
            <div style="margin:18px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
                <div style="font-size:13px;color:#374151;margin-bottom:10px;">Ticket summary</div>

                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
                    <tr>
                        <td style="width:34%;padding:8px 0;color:#6b7280;">Title</td>
                        <td style="padding:8px 0;color:#111827;font-weight:600;">{{ $ticket->title }}</td>
                    </tr>
                    <tr>
                        <td style="width:34%;padding:8px 0;color:#6b7280;">Priority</td>
                        <td style="padding:8px 0;color:#111827;">{{ $ticket->priority?->priority_name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="width:34%;padding:8px 0;color:#6b7280;">Category</td>
                        <td style="padding:8px 0;color:#111827;">{{ $ticket->category?->category_name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="width:34%;padding:8px 0;color:#6b7280;">Status</td>
                        <td style="padding:8px 0;color:#111827;">{{ $ticket->status?->status_name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td style="width:34%;padding:8px 0;color:#6b7280;">Created at</td>
                        <td style="padding:8px 0;color:#111827;">{{ optional($ticket->created_at)->format('Y-m-d H:i') }}</td>
                    </tr>
                </table>
            </div>

            <!-- Resolution -->
            <div style="margin:18px 0;">
                <div style="font-size:13px;color:#374151;margin-bottom:10px;">Resolution</div>

                @if(!empty($solution))
                    <div style="padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:12px;color:#1d4ed8;white-space:pre-wrap;line-height:1.5;">
                        {{ $solution }}
                    </div>
                @else
                    <div style="padding:14px;border:1px dashed #cbd5e1;background:#f8fafc;border-radius:12px;color:#64748b;line-height:1.5;">
                        No resolution details were provided.
                    </div>
                @endif
            </div>

            <!-- Footer -->
            <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.5;">
                <div>Need help with something else?</div>
                <div style="margin-top:6px;">
                    Please contact the IT support team or submit a new ticket.
                </div>
                <div style="margin-top:14px;">© {{ date('Y') }} IT Ticketing System</div>
            </div>
        </div>

        <!-- Note -->
        <p style="margin:14px 6px 0 6px;color:#9ca3af;font-size:11px;">
            This email was sent automatically when your ticket status changed to <strong>Closed</strong>.
        </p>

    </div>

</body>
</html>


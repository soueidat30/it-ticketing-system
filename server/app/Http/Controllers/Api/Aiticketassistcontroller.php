<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Priority;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiTicketAssistController extends Controller
{
    /**
     * Suggest a category + priority for a ticket draft using OpenAI.
     *
     * POST /api/ai/suggest-ticket-fields
     * body: { title: string, description: string }
     */
    public function suggestFields(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string|max:5000',
        ]);

        // Pull the real options from the DB so the model can only choose
        // from values that actually exist in this system.
        $categories = Category::pluck('category_name')->values()->all();
        $priorities = Priority::pluck('priority_name')->values()->all();

        if (empty($categories) || empty($priorities)) {
            return response()->json([
                'message' => 'No categories or priorities configured.',
            ], 422);
        }

        $apiKey = config('services.openai.key');
        if (!$apiKey) {
            Log::error('OPENAI_API_KEY is not configured.');
            return response()->json([
                'message' => 'AI suggestions are not configured on the server.',
            ], 503);
        }

        $schema = [
            'type' => 'object',
            'properties' => [
                'category' => [
                    'type' => 'string',
                    'enum' => $categories,
                ],
                'priority' => [
                    'type' => 'string',
                    'enum' => $priorities,
                ],
                'reasoning' => [
                    'type' => 'string',
                    'description' => 'One short sentence explaining the suggestion.',
                ],
            ],
            'required' => ['category', 'priority', 'reasoning'],
            'additionalProperties' => false,
        ];

        try {
            $response = Http::withToken($apiKey)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an IT helpdesk triage assistant. Given a ticket '
                                . 'title and description, choose the single best-fitting category '
                                . 'and priority from the allowed lists. Be decisive. Critical/High '
                                . 'priority is only for outages, security issues, or anything '
                                . 'blocking multiple people from working.',
                        ],
                        [
                            'role' => 'user',
                            'content' => "Title: {$request->input('title')}\n"
                                . "Description: {$request->input('description')}\n\n"
                                . 'Allowed categories: ' . implode(', ', $categories) . "\n"
                                . 'Allowed priorities: ' . implode(', ', $priorities),
                        ],
                    ],
                    'response_format' => [
                        'type' => 'json_schema',
                        'json_schema' => [
                            'name' => 'ticket_triage',
                            'schema' => $schema,
                            'strict' => true,
                        ],
                    ],
                ]);

            if (!$response->successful()) {
                Log::error('OpenAI triage call failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return response()->json([
                    'message' => 'AI suggestion failed. Please choose manually.',
                ], 502);
            }

            $content = $response->json('choices.0.message.content');
            $parsed  = json_decode($content, true);

            if (!$parsed || !isset($parsed['category'], $parsed['priority'])) {
                return response()->json([
                    'message' => 'AI returned an unexpected response. Please choose manually.',
                ], 502);
            }

            return response()->json([
                'category'  => $parsed['category'],
                'priority'  => $parsed['priority'],
                'reasoning' => $parsed['reasoning'] ?? null,
            ]);

        } catch (\Throwable $e) {
            Log::error('AI triage exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'AI suggestion failed. Please choose manually.',
            ], 500);
        }
    }
}
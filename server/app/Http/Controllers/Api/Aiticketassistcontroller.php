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
     * Suggest a category + priority for a ticket draft using a local
     * Ollama model. Free, no API key, no internet required — runs on
     * the same machine as the Laravel server.
     *
     * Requires Ollama installed and running (https://ollama.com) with
     * a model pulled, e.g.: `ollama pull llama3.1`
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

        $categories = Category::pluck('category_name')->values()->all();
        $priorities = Priority::pluck('priority_name')->values()->all();

        if (empty($categories) || empty($priorities)) {
            return response()->json([
                'message' => 'No categories or priorities configured.',
            ], 422);
        }

        $ollamaUrl   = config('services.ollama.url', 'http://127.0.0.1:11434');
        $ollamaModel = config('services.ollama.model', 'llama3.1');

        // JSON schema Ollama will constrain the model's output to.
        $schema = [
            'type' => 'object',
            'properties' => [
                'category'  => ['type' => 'string'],
                'priority'  => ['type' => 'string'],
                'reasoning' => ['type' => 'string'],
            ],
            'required' => ['category', 'priority', 'reasoning'],
        ];

        try {
            $response = Http::timeout(45)->post("{$ollamaUrl}/api/chat", [
                'model' => $ollamaModel,
                'stream' => false,
                'options' => ['temperature' => 0],
                'format' => $schema,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an IT helpdesk triage assistant. Given a ticket '
                            . 'title and description, choose the single best-fitting category '
                            . 'and priority from the allowed lists below. You must pick values '
                            . 'EXACTLY as written in the lists, with the same spelling and '
                            . 'capitalization. Critical/High priority is only for outages, '
                            . 'security issues, or anything blocking multiple people from working.'
                            . "\n\nAllowed categories: " . implode(', ', $categories)
                            . "\nAllowed priorities: " . implode(', ', $priorities),
                    ],
                    [
                        'role' => 'user',
                        'content' => "Title: {$request->input('title')}\n"
                            . "Description: {$request->input('description')}",
                    ],
                ],
            ]);

            if (!$response->successful()) {
                Log::error('Ollama triage call failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return response()->json([
                    'message' => 'AI suggestion failed. Make sure Ollama is running locally.',
                ], 502);
            }

            $content = $response->json('message.content');
            $parsed  = json_decode($content, true);

            if (!$parsed || !isset($parsed['category'], $parsed['priority'])) {
                Log::error('Ollama returned unparseable content', ['raw' => $content]);
                return response()->json([
                    'message' => 'AI returned an unexpected response. Please choose manually.',
                ], 502);
            }

            $matchedCategory = $this->matchOption($parsed['category'], $categories);
            $matchedPriority = $this->matchOption($parsed['priority'], $priorities);

            if (!$matchedCategory || !$matchedPriority) {
                return response()->json([
                    'message' => "AI suggestion didn't match a known category/priority. Please choose manually.",
                ], 502);
            }

            return response()->json([
                'category'  => $matchedCategory,
                'priority'  => $matchedPriority,
                'reasoning' => $parsed['reasoning'] ?? null,
            ]);

        } catch (\Throwable $e) {
            Log::error('AI triage exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'Could not reach the local AI model. Is Ollama running?',
            ], 500);
        }
    }

    /**
     * Case-insensitive match of a model-returned value against the
     * real allowed list, returning the correctly-cased original.
     */
    private function matchOption(string $value, array $options): ?string
    {
        foreach ($options as $option) {
            if (strtolower(trim($value)) === strtolower(trim($option))) {
                return $option;
            }
        }
        return null;
    }
    public function chat(Request $request)
{
    $request->validate([
        'message' => 'required|string|max:2000',
        'history' => 'array',
    ]);

    $ollamaUrl   = config('services.ollama.url', 'http://127.0.0.1:11434');
    $ollamaModel = config('services.ollama.model', 'llama3.2:3b');

    try {
        $response = Http::timeout(45)->post("{$ollamaUrl}/api/chat", [
            'model' => $ollamaModel,
            'stream' => false,
            'messages' => array_merge(
                $request->input('history', []),
                [['role' => 'user', 'content' => $request->input('message')]]
            ),
        ]);

        if (!$response->successful()) {
            return response()->json(['message' => 'AI chat failed.'], 502);
        }

        $reply = $response->json('message.content') ?? 'No reply generated.';
        return response()->json(['reply' => $reply]);

    } catch (\Throwable $e) {
        \Log::error('AI chat exception', ['error' => $e->getMessage()]);
        return response()->json(['message' => 'Could not reach Ollama. Is it running?'], 500);
    }
}

}
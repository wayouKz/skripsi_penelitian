<?php

namespace App\Services;

use Gemini;


class GeminiAI
{
    private $key;
    private $client;

    public function __construct()
    {
        $this->key = env('GEMINI_API_KEY');
        $this->client = Gemini::client($this->key);
    }

    public function generateResponse(string $prompt)
    {
        $response = $this->client->generativeModel("gemini-3.5-flash")
            ->generateContent($prompt);

        return $response->text();
    }
}
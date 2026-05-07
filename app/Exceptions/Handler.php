<?php

namespace App\Exceptions;

use Throwable;
use PDOException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Database\QueryException;

class Handler extends ExceptionHandler
{
public function render($request, Throwable $e)
{
    // 1. Bypass jika memang sedang di halaman install agar tidak loop
    if ($request->is('install*')) {
        return parent::render($request, $e);
    }

    // 2. Cek apakah ini error Database
    if ($e instanceof PDOException || $e instanceof QueryException) {

        // if (!file_exists(public_path('storage/installed'))) {
            return redirect('/install');
        // }
    }

    return parent::render($request, $e);
}
}

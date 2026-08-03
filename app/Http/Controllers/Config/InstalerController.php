<?php

namespace App\Http\Controllers\Config;

use Throwable;
use PSpell\Config;
use PDO;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage ;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\Request;
use Exception;
use App\Models\Config as ModelsConfig;
use App\Http\Controllers\Controller;

class InstalerController extends Controller
{
 public function index()
    {

        return Inertia::render('Config/Instaler');
    }




public function setup(Request $request)
{
    try {
        config(['session.driver' => 'file']);

        $request->validate([
            'db_name' => 'required|alpha_dash',
            'db_user' => 'required',
        ]);

        // 1️⃣ CREATE DATABASE
        $pdo = new PDO(
            "mysql:host=".env('DB_HOST').";port=".env('DB_PORT', 3306),
            $request->db_user,
            $request->db_pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $pdo->exec("
            CREATE DATABASE IF NOT EXISTS `{$request->db_name}`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        ");

        // 2️⃣ UPDATE .env
        if (!is_writable(base_path('.env'))) {
            throw new \Exception('.env is not writable');
        }

        $this->setEnv('DB_DATABASE', $request->db_name);
        $this->setEnv('DB_USERNAME', $request->db_user);
        $this->setEnv('DB_PASSWORD', $request->db_pass);

        // 3️⃣ OVERRIDE CONFIG RUNTIME (WAJIB)
        config([
            'database.connections.mysql.database' => $request->db_name,
            'database.connections.mysql.username' => $request->db_user,
            'database.connections.mysql.password' => $request->db_pass,
        ]);

        // 4️⃣ MIGRATE


        // 6️⃣ REDIRECT INERTIA (WAJIB)
        return response('', 409)
            ->header('X-Inertia-Location', route('install.migrate'));

    } catch (Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTrace() : []
        ], 500);
    }
}




    private function setEnv($key, $value)
    {
        $path = base_path('.env');

        file_put_contents(
            $path,
            preg_replace(
                "/^{$key}=.*/m",
                "{$key}={$value}",
                file_get_contents($path)
            )
        );
    }

    public function migrate()
    {
        return Inertia::render('Config/Migrate');
    }


public function setUpMigrate()
{
    try {
        // Hati-hati: ini akan menghapus semua data.
        // Ubah menjadi 'migrate' biasa jika tidak ingin menghapus data lama.
        Artisan::call('migrate:fresh', [
            '--force' => true,
            '--no-interaction' => true,
        ]);

        Artisan::call('db:seed', [
            '--force' => true,
            '--no-interaction' => true,
        ]);

        // Gunakan helper bawaan Inertia untuk eksternal/hard redirect
        return Inertia::location(route('install.configure'));

    } catch (Throwable $e) {
        // Menangkap error jika database gagal terhubung atau migrasi gagal
        return response()->json([
            'success' => false,
            'message' => 'Gagal melakukan migrasi: ' . $e->getMessage()
        ], 500);
    }
}

    public function configure(){
        return Inertia::render('Config/Configure');
    }


    public function configureStore(Request $request)
    {
        $request->validate([
            'nama_instansi' => 'required',
            // Tambahkan validasi image agar lebih aman
            'logo_instansi' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // 1. Cek apakah konfigurasi sudah ada di database
        $cekConfigurasi = ModelsConfig::first();

        $logo = $request->file('logo_instansi');
        $logo_name = "logo_instansi." . $logo->getClientOriginalExtension();

        $sampulInstansi = $request->file('sampul_instansi');
        $sampulName = "sampul_instansi." . $sampulInstansi->getClientOriginalExtension();
        // 2. Hapus logo lama dari storage jika ada
        if ($cekConfigurasi && $cekConfigurasi->logo_instansi) {
            $old_logo_path = 'logo/' . $cekConfigurasi->logo_instansi;

            if (Storage::exists($old_logo_path)) {
                Storage::delete($old_logo_path);
            }
        }

        if($cekConfigurasi && $cekConfigurasi->sampul_instansi){
            $old_sampul_path = 'sampul_instansi/' . $cekConfigurasi->sampul_instansi;

            if (Storage::exists($old_sampul_path)) {
                Storage::delete($old_sampul_path);
            }
        }

        // 3. Simpan logo baru ke storage
        $logo->storeAs('logo', $logo_name);
        $sampulInstansi->storeAs('sampul_instansi', $sampulName);
        $save = [
            'nama_instansi'    => $request->nama_instansi,
            'alamat_instansi'  => $request->alamat_instansi,
            'telepon_instansi' => $request->telepon_instansi,
            'email_instansi'   => $request->email_instansi,
            'logo_instansi'    => $logo_name,
            'website_instansi' => $request->website_instansi,
            'sampul_instansi'  => $sampulName
        ];

        // 4. Update atau Create data
        if ($cekConfigurasi) {
            $simpan = $cekConfigurasi->update($save);
        } else {
            $simpan = ModelsConfig::create($save);
        }

        Storage::put('installed', 'Aplikasi Terinstall');

        // (Opsional) return redirect atau response
        // return redirect()->back()->with('success', 'Konfigurasi berhasil disimpan!');
    }
}

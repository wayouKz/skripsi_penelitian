<?php

namespace App\Http\Controllers\Helper;

use App\Http\Controllers\Controller;
use App\Models\Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class Pdf extends Controller
{

    public function jadwal(Request $request)
    {
        $instansi = $this->infoInstansi();
        $tahun_ajaran_id = $request->input('tahun_ajaran_id');
        $kelas = $request->input('kelas_id');

        $tahunAjaran = DB::table('m_tahun_ajarans')->where('id', $tahun_ajaran_id)->first();
        $namaTahunAjaran = $tahunAjaran ? $tahunAjaran->tahun_ajaran : 'Unknown';
        $jadwal = DB::table('t_jadwals')
        ->join('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
        ->join('m_kelas', 't_jadwals.kelas_id', '=', 'm_kelas.id')
        ->join('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
        ->join('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
        ->join('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
        ->where('t_jadwals.tahun_ajaran_id', $tahun_ajaran_id)
        ->when($kelas && $kelas !== 'all', function ($query) use ($kelas) {
            return $query->where('t_jadwals.kelas_id', $kelas);
        })
        ->get();

        $views = view('pdf.jadwal.jadwal', compact('jadwal','namaTahunAjaran', 'instansi'))->render();

        ini_set('pcre.backtrack_limit', '5000000');
        ini_set('pcre.recursion_limit', '5000000');
        $mpdf = new \Mpdf\Mpdf([
        'mode' => 'utf-8',
        'format' => 'A4',
        'orientation' => 'L'
        ]);

        $mpdf->SetHTMLFooter($this->footerPrintUser());
        $mpdf->WriteHTML($views);
        $mpdf->Output("Jadwal-{$tahunAjaran->tahun_ajaran}-{$tahunAjaran->semester}.pdf", 'I');
    }

    public function guruMapel(Request $request){
        $tahun_ajaran_id = $request->tahun_ajaran;
        $nip = $request->nip;
        $instansi = $this->infoInstansi();


        $DaftarGuruMapel = DB::table('t_list_gurus')
        ->select('m_gurus.nama_guru as nama',
        'm_mapels.nama_mapel as mapel',
        'm_kelas.nama_kelas as kelas',
        't_list_guru_mapels.beban_jam as beban_jam',

        )
        ->leftJoin('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
        ->leftJoin('t_list_guru_mapels', 't_list_gurus.id', '=', 't_list_guru_mapels.t_list_guru_id')
        // ->leftJoin('t_jadwals', 't_list_guru_mapels.id', '=', 't_jadwals.t_list_guru_mapel_id')
        ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
        ->leftJoin('m_kelas', 't_list_gurus.kelas_id', '=', 'm_kelas.id')
        ->where('t_list_gurus.tahun_ajaran_id', $tahun_ajaran_id)
        ->when($nip, function ($query) use ($nip) {
            return $query->where('t_list_gurus.nip', $nip);
        })
        ->get();
        $namaTahunAjaran = DB::table('m_tahun_ajarans')->where('id', $tahun_ajaran_id)->first();
        $title = "Daftar Guru Mata Pelajaran" . ' - ' . $namaTahunAjaran->tahun_ajaran . ' - ' . strtoupper($namaTahunAjaran->semester);

        $view = view('pdf.guru_mapel.guru_mapel', compact('tahun_ajaran_id', 'instansi', 'DaftarGuruMapel', 'namaTahunAjaran','title'))->render();

        // return response()->json($DaftarGuruMapel);
        ini_set('pcre.backtrack_limit', '5000000');
        ini_set('pcre.recursion_limit', '5000000');
        $mpdf = new \Mpdf\Mpdf([
        'mode' => 'utf-8',
        'format' => 'A4',
        'orientation' => 'P'
        ]);

        $mpdf->SetHTMLFooter($this->footerPrintUser());
        $mpdf->WriteHTML($view);
        $mpdf->Output($title, 'I');
    }

    public function absensiPdf(Request $request){
        $kelas_id = $request->input('kelas_id');
        $tahunAjaran_id = $request->input('tahun_ajaran_id');
        $namaTahunAjaran = DB::table('m_tahun_ajarans')->where('id', $request->tahun_ajaran_id)->first();
        // dd(Auth::user()->nip);
$daftarAbsenSiswa = DB::table('t_list_siswas')
    ->where('t_list_siswas.kelas_id', $kelas_id)
    ->where('t_list_siswas.tahun_ajaran_id', $tahunAjaran_id)
    ->leftJoin('t_absen_siswas', 't_list_siswas.siswa_id', '=', 't_absen_siswas.siswa_id')
    ->leftJoin('t_jadwals', function ($join) use ($tahunAjaran_id) {
        $join->on('t_absen_siswas.kode_jadwal', '=', 't_jadwals.kode_jadwal')
             ->where('t_jadwals.tahun_ajaran_id', '=', $tahunAjaran_id);
    })
    ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    ->leftJoin('m_mapels', 't_list_guru_mapels.mapel_id', '=', 'm_mapels.id')
    ->leftJoin('t_list_gurus', 't_list_guru_mapels.t_list_guru_id', '=', 't_list_gurus.id')
    ->leftJoin('m_gurus', 't_list_gurus.guru_id', '=', 'm_gurus.id')
    ->leftJoin('m_kelas', 't_list_siswas.kelas_id', '=', 'm_kelas.id')
    ->leftJoin('m_siswas', 't_list_siswas.siswa_id', '=', 'm_siswas.id')
    ->leftJoin('m_tahun_ajarans', 't_list_siswas.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
    ->where('t_list_guru_mapels.guru_id', Auth::user()->guru->id)
    ->select(
        't_list_siswas.siswa_id',
        'm_siswas.nisn',
        'm_siswas.nama_siswa',
        'm_siswas.jenis_kelamin', // Pastikan mengambil jenis kelamin jika ada
        't_absen_siswas.pertemuan',
        't_absen_siswas.tanggal_absen',
        't_absen_siswas.status',
        't_absen_siswas.waktu as waktu_absen',
        't_jadwals.kode_jadwal',
        'm_mapels.nama_mapel',
        'm_gurus.nama_guru',
        'm_kelas.nama_kelas',
        'm_tahun_ajarans.tahun_ajaran',
        'm_tahun_ajarans.semester',
        'm_gurus.nip'
    )
    ->get()
    ->groupBy('nama_mapel')
    ->map(function ($siswasPerMapel) {
        $namaGuru = $siswasPerMapel->first()->nama_guru ?? '-';
        $nip = $siswasPerMapel->first()->nip ?? '-';
        $kelas = $siswasPerMapel->first()->nama_kelas ?? '-';
        $tahunAjaran = $siswasPerMapel->first()->tahun_ajaran ?? '-';
        $semester = $siswasPerMapel->first()->semester ?? '-';

        // Kelompokkan berdasarkan siswa_id atau nisn agar semua siswa dalam kelas masuk ke daftar
        $mappedSiswa = $siswasPerMapel->groupBy('siswa_id')->map(function ($rows) {
            $first = $rows->first();

            // Petakan absensi berdasarkan nomor pertemuan (1 s.d 16) tanpa membatasi unique kode_jadwal
            $absenList = $rows->filter(function ($row) {
                return $row->pertemuan !== null;
            })->map(function ($row) {
                return [
                    'pertemuan' => (int) $row->pertemuan,
                    'kode_jadwal' => $row->kode_jadwal,
                    'tanggal_absen' => $row->tanggal_absen,
                    'status' => $row->status,
                    'waktu_absen' => $row->waktu_absen,
                ];
            })->values();

            return [
                'nisn' => $first->nisn,
                'nama_siswa' => $first->nama_siswa,
                'jenis_kelamin' => $first->jenis_kelamin ?? '-',
                'absen' => $absenList
            ];
        })->values();

        return [
            'nama_guru' => $namaGuru,
            'kelas' => $kelas,
            'nip' => $nip,
            'tahun_ajaran' => $tahunAjaran,
            'semester' => $semester,
            'siswa' => $mappedSiswa,
            'kepala_sekolah' => $this->infoInstansi()->kepalaSekolah ? $this->infoInstansi()->kepalaSekolah->nama_guru : '-',
        ];
    });

    // dd($daftarAbsenSiswa);
        $instansi = $this->infoInstansi();
        $title = "Absensi" . ' - ' . $namaTahunAjaran->tahun_ajaran . ' - ' . strtoupper($namaTahunAjaran->semester);

        $view = view('pdf.absensi.absensi_pdf', compact('kelas_id', 'instansi', 'title', 'namaTahunAjaran', 'daftarAbsenSiswa'))->render();

        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'L'
        ]);

        $mpdf->SetHTMLFooter($this->footerPrintUser());
        $mpdf->WriteHTML($view);
        $mpdf->Output('Absensi.pdf', 'I');
    }
    private function footerPrintUser(){
        $user = Auth::user();
        $namaUser = $user ? $user->name : 'Unknown User';
        $tanggalCetak = now()->format('d-m-Y H:i:s');
        $footer = '<table width="100%" style="font-size: 9px; font-family: sans-serif; color: #555; border-top: 1px solid #ddd; padding-top: 5px;">
                    <tr>
                        <td align="left">Dicetak oleh: ' . strtoupper($namaUser) . ' pada ' . $tanggalCetak . '</td>
                        <td align="right">Halaman {PAGENO} dari {nbpg}</td>
                    </tr>
                </table>';
        return $footer;
    }

    private function infoInstansi(){
        $raw = Config::with('kepalaSekolah')->first();
        return $raw;
    }
}
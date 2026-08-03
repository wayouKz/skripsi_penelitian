<?php

namespace App\Http\Controllers\Helper;

use App\Http\Controllers\Controller;
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
        ->join('m_gurus', 't_list_gurus.nip', '=', 'm_gurus.nip')
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

    private function footerPrintUser(){
        $user = Auth::user();
        $namaUser = $user ? $user->name : 'Unknown User';
        $tanggalCetak = now()->format('d-m-Y H:i:s');
        $footer = '<table width="100%" style="font-size: 9px; font-family: sans-serif; color: #555; border-top: 1px solid #ddd; padding-top: 5px;">
                    <tr>
                        <td align="left">Dicetak oleh: ' . $namaUser . ' pada ' . $tanggalCetak . '</td>
                        <td align="right">Halaman {PAGENO} dari {nbpg}</td>
                    </tr>
                </table>';
        return $footer;
    }

    private function infoInstansi(){
        $raw = DB::table('configs')->first();
        return $raw;
    }
}

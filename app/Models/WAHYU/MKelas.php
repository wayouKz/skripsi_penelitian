<?php

namespace App\Models\WAHYU;

use Illuminate\Database\Eloquent\Model;

class MKelas extends Model
{
    protected $guarded = ['id'];

    public function waliKelas(){
        return $this->belongsTo(MGuru::class,'id_wali_kelas','id');
    }

    public function kelasSiswa(){
        return $this->hasMany(TListSiswa::class,'kelas_id','id');
    }

    public static function kelasAktif($tanggalFilter){
        $data =  MKelas::select(
        'm_kelas.id as kelas_id',
        'm_kelas.nama_kelas',
        't_jadwals.kode_jadwal',
        't_jadwals.hari',
        't_jadwals.jam_mulai',
        't_jadwals.jam_selesai',
        'm_gurus.nama_guru as nama_guru_asli',
        'm_gurus.id as guru_id_asli',
        't_absen_gurus.kode_absen',
        'm_mapels.nama_mapel',
        // Kolom untuk guru pengganti
        't_guru_penggantis.id as ada_pergantian',
        't_guru_penggantis.status as status_pergantian',
        'guru_pengganti.nama_guru as nama_guru_pengganti',
        'guru_pengganti.id as guru_pengganti_id'
    )
    ->join('t_jadwals', function($join) {
        $join->on('m_kelas.id', '=', 't_jadwals.kelas_id');
    })
        ->leftJoin('t_guru_penggantis', function($join) use ($tanggalFilter) {
        $join->on('t_jadwals.kode_jadwal', '=', 't_guru_penggantis.kode_jadwal')
             ->whereDate('t_guru_penggantis.tanggal_pergantian', '=', $tanggalFilter);
    })
    ->leftJoin('m_gurus as guru_pengganti', 't_guru_penggantis.guru_id_pengganti', '=', 'guru_pengganti.id')
    ->leftJoin('t_list_guru_mapels', 't_jadwals.t_list_guru_mapel_id', '=', 't_list_guru_mapels.id')
    // Hubungkan tabel absensi berdasarkan kode jadwal dan tanggal pilihan
    ->leftJoin('t_absen_gurus', function($join) use ($tanggalFilter) {
        $join->on('t_jadwals.kode_jadwal', '=', 't_absen_gurus.kode_jadwal')
             ->whereDate('t_absen_gurus.waktu_absen', '=', $tanggalFilter);
    })
    // Hubungkan tabel guru pengganti berdasarkan tanggal pilihan

    // Join ke m_gurus untuk guru pengganti
    ->leftJoin('m_tahun_ajarans', 't_jadwals.tahun_ajaran_id', '=', 'm_tahun_ajarans.id')
    ->where('m_tahun_ajarans.status', '=', 'active')
    ->leftJoin('m_gurus', 't_list_guru_mapels.guru_id', '=', 'm_gurus.id')
    ->leftJoin('m_mapels', 't_jadwals.mapel_id', '=', 'm_mapels.id')
    ->orderBy('t_jadwals.jam_mulai', 'asc')
    ->get();
    return $data;

    }

    public static function getKelas(){
       $data = MKelas::select('m_kelas.*', 'm_jurusans.nama_jurusan')
        ->where('status', 'active')->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id');

        // if($request->tahun_ajaran != null){
        //     $query->where('m_kelas.tahun_ajaran_id', $request->tahun_ajaran);
        // }
        return $data->get();
    }

    public static function getSiswaKelas($tahunAjaran){
       $data = MKelas::select(
        'm_kelas.id',
        'm_kelas.nama_kelas',
        'm_kelas.tingkat',
        'm_siswas.nisn',
        'm_siswas.id as siswa_id',
        'm_siswas.nama_siswa',
        'm_siswas.jenis_kelamin',
        'm_gurus.nama_guru',
        'm_jurusans.nama_jurusan'
    )
    // 1. UBAH LEFT JOIN INI UNTUK MEMFILTER TAHUN AJARAN
    ->leftJoin('t_list_siswas', function($join) use ($tahunAjaran) {
        $join->on('m_kelas.id', '=', 't_list_siswas.kelas_id');

        // Jika ada filter tahun ajaran yang dikirim dari React
        if ($tahunAjaran) {
            // Sesuaikan 'tahun_ajaran_id' dengan nama kolom asli di tabel t_list_siswas Anda
            $join->where('t_list_siswas.tahun_ajaran_id', '=', $tahunAjaran);
        }
    })
    ->leftJoin('m_siswas', 't_list_siswas.siswa_id', '=', 'm_siswas.id')
    ->leftJoin('m_gurus', 'm_kelas.id_wali_kelas', '=', 'm_gurus.id')
    ->leftJoin('m_jurusans', 'm_kelas.jurusan_id', '=', 'm_jurusans.id')
    // ->where('m_kelas.tahun_ajaran_id', $tahunAjaran)
    ->get()
    ->groupBy('id')
    ->map(function ($items) {
        $first = $items->first();

        return [
            'id' => $first->id,
            'nama_kelas' => $first->nama_kelas . ' ' .strtoupper($first->nama_jurusan) ,
            'nama_wali_kelas' => $first->nama_guru,
            'tingkat' => $first->tingkat,
            'siswa' => $items->filter(function ($item) {
                return !is_null($item->siswa_id);
            })->map(function ($item) {
                return [
                    'value' => $item->nisn,
                    'label' => $item->nama_siswa,
                    'jenis_kelamin' => $item->jenis_kelamin
                ];
            })->values()->all()
        ];
    })->values();
    return $data;
    }
}

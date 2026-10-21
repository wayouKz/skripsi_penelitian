export default function RenderTabelJadwal({
    historyJadwal,
    selectedNamaTahunAjaran = "Tahun Ajaran Aktif",
}) {
    // =========================================================
    // 1. CEK DATA KOSONG
    // =========================================================
    if (!historyJadwal || historyJadwal.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                <i className="fa fa-calendar-times-o text-4xl text-gray-300 mb-3"></i>

                <div className="text-gray-500 font-medium text-sm">
                    Tidak ada jadwal yang tersedia.
                </div>

                <p className="text-xs text-gray-400 mt-1 italic">
                    Silakan pilih kelas atau tahun ajaran lain.
                </p>
            </div>
        );
    }

    // =========================================================
    // 2. DAFTAR HARI
    // =========================================================
    const daftarHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

    // =========================================================
    // 3. DAFTAR WARNA KELAS
    // =========================================================
    const warnaKelas = [
        {
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-700",
        },
        {
            bg: "bg-purple-50",
            border: "border-purple-200",
            text: "text-purple-700",
        },
        {
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            text: "text-yellow-700",
        },
        {
            bg: "bg-pink-50",
            border: "border-pink-200",
            text: "text-pink-700",
        },
        {
            bg: "bg-indigo-50",
            border: "border-indigo-200",
            text: "text-indigo-700",
        },
        {
            bg: "bg-orange-50",
            border: "border-orange-200",
            text: "text-orange-700",
        },
        {
            bg: "bg-teal-50",
            border: "border-teal-200",
            text: "text-teal-700",
        },
        {
            bg: "bg-rose-50",
            border: "border-rose-200",
            text: "text-rose-700",
        },
        {
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            text: "text-emerald-700",
        },
        {
            bg: "bg-cyan-50",
            border: "border-cyan-200",
            text: "text-cyan-700",
        },
        {
            bg: "bg-violet-50",
            border: "border-violet-200",
            text: "text-violet-700",
        },
        {
            bg: "bg-amber-50",
            border: "border-amber-200",
            text: "text-amber-700",
        },
    ];

    // =========================================================
    // 4. FUNGSI MENENTUKAN WARNA BERDASARKAN KELAS
    //
    // Kelas yang sama akan selalu memiliki warna yang sama.
    // =========================================================
    const getWarnaKelas = (namaKelas) => {
        if (!namaKelas) {
            return warnaKelas[0];
        }

        let nilai = 0;

        for (let i = 0; i < namaKelas.length; i++) {
            nilai += namaKelas.charCodeAt(i);
        }

        return warnaKelas[nilai % warnaKelas.length];
    };

    // =========================================================
    // 5. FUNGSI KONVERSI JAM KE MENIT
    //
    // Contoh:
    // 12:50 -> 770
    // 13:25 -> 805
    // =========================================================
    const jamKeMenit = (jam) => {
        if (!jam) return 0;

        const jamBersih = jam.substring(0, 5);

        const [hours, minutes] = jamBersih.split(":").map(Number);

        return hours * 60 + minutes;
    };

    // =========================================================
    // 6. AMBIL SEMUA SLOT JAM UNIK
    // =========================================================
    const jamUnikMap = new Map();

    historyJadwal.forEach((item) => {
        if (item.jam_mulai && item.jam_selesai) {
            const mulai = item.jam_mulai.substring(0, 5);
            const selesai = item.jam_selesai.substring(0, 5);

            const key = `${mulai}-${selesai}`;

            if (!jamUnikMap.has(key)) {
                jamUnikMap.set(key, {
                    key,
                    jam_mulai: mulai,
                    jam_selesai: selesai,
                });
            }
        }
    });

    // =========================================================
    // 7. URUTKAN SLOT JAM
    // =========================================================
    const daftarJam = Array.from(jamUnikMap.values()).sort(
        (a, b) => jamKeMenit(a.jam_mulai) - jamKeMenit(b.jam_mulai),
    );

    // =========================================================
    // 8. FUNGSI GROUPING JADWAL
    //
    // Jadwal digabung jika:
    // - kelas sama
    // - waktu berurutan
    //
    // Contoh:
    //
    // 12:50 - 13:25 | X-1
    // 13:25 - 14:00 | X-1
    //
    // menjadi:
    //
    // 12:50 - 14:00 | X-1
    // =========================================================
    const groupJadwalBerurutan = (dataHari) => {
        if (!dataHari || dataHari.length === 0) {
            return [];
        }

        // -----------------------------------------------------
        // Urutkan jadwal berdasarkan jam mulai
        // -----------------------------------------------------
        const sorted = [...dataHari].sort(
            (a, b) => jamKeMenit(a.jam_mulai) - jamKeMenit(b.jam_mulai),
        );

        const hasil = [];

        // -----------------------------------------------------
        // PROSES JADWAL
        // -----------------------------------------------------
        sorted.forEach((item) => {
            if (!item.jam_mulai || !item.jam_selesai) {
                return;
            }

            const jamMulai = item.jam_mulai.substring(0, 5);

            const jamSelesai = item.jam_selesai.substring(0, 5);

            // Cari posisi slot
            const indexMulai = daftarJam.findIndex(
                (jam) =>
                    jam.jam_mulai === jamMulai &&
                    jam.jam_selesai === jamSelesai,
            );

            if (indexMulai === -1) {
                return;
            }

            // Group terakhir
            const lastGroup = hasil.length > 0 ? hasil[hasil.length - 1] : null;

            // =================================================
            // CEK APAKAH BISA DIGABUNG
            // =================================================
            const bisaDigabung =
                lastGroup &&
                lastGroup.nama_kelas === item.nama_kelas &&
                jamKeMenit(lastGroup.jam_selesai) === jamKeMenit(jamMulai);

            if (bisaDigabung) {
                // ---------------------------------------------
                // GABUNG DENGAN BLOCK SEBELUMNYA
                // ---------------------------------------------
                lastGroup.jam_selesai = jamSelesai;

                lastGroup.items.push(item);

                lastGroup.colSpan += 1;

                lastGroup.endIndex = indexMulai;
            } else {
                // ---------------------------------------------
                // BUAT BLOCK BARU
                // ---------------------------------------------
                hasil.push({
                    nama_kelas: item.nama_kelas,

                    jam_mulai: jamMulai,

                    jam_selesai: jamSelesai,

                    startIndex: indexMulai,

                    endIndex: indexMulai,

                    colSpan: 1,

                    items: [item],
                });
            }
        });

        return hasil;
    };

    // =========================================================
    // 9. RETURN
    // =========================================================
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* =================================================
                HEADER
            ================================================= */}
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-white tracking-wide">
                    JADWAL MENGAJAR GURU
                </h3>

                <span className="bg-green-800 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
                    {selectedNamaTahunAjaran}
                </span>
            </div>

            {/* =================================================
                TABEL
            ================================================= */}
            <div className="p-6 overflow-x-auto bg-gray-50/50">
                <table className="w-full border-collapse min-w-max">
                    {/* =================================================
                        HEADER
                    ================================================= */}
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 text-center">
                            {/* KOLOM HARI */}
                            <th
                                className="
                                    p-3
                                    font-extrabold
                                    text-gray-700
                                    text-xs
                                    uppercase
                                    tracking-wide
                                    border-r
                                    border-gray-200
                                    w-32
                                    sticky
                                    left-0
                                    bg-gray-100
                                    z-10
                                "
                            >
                                Hari / Jam
                            </th>

                            {/* KOLOM JAM */}
                            {daftarJam.map((jam, index) => (
                                <th
                                    key={index}
                                    className="
                                            p-3
                                            border-r
                                            border-gray-200
                                            min-w-[180px]
                                        "
                                >
                                    <div className="font-extrabold text-gray-800 text-xs">
                                        {jam.jam_mulai} - {jam.jam_selesai}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* =================================================
                        BODY
                    ================================================= */}
                    <tbody>
                        {daftarHari.map((hari) => {
                            // -----------------------------------------
                            // Ambil jadwal berdasarkan hari
                            // -----------------------------------------
                            const dataHariIni = historyJadwal.filter(
                                (item) => item.hari === hari,
                            );

                            // -----------------------------------------
                            // Group berdasarkan kelas + waktu berurutan
                            // -----------------------------------------
                            const groupedJadwal =
                                groupJadwalBerurutan(dataHariIni);

                            // -----------------------------------------
                            // Tidak ada jadwal
                            // -----------------------------------------
                            if (groupedJadwal.length === 0) {
                                return (
                                    <tr
                                        key={hari}
                                        className="border-b border-gray-200"
                                    >
                                        <td
                                            className="
                                                    p-3
                                                    font-extrabold
                                                    text-gray-800
                                                    text-xs
                                                    uppercase
                                                    tracking-wide
                                                    bg-gray-50
                                                    border-r
                                                    border-gray-200
                                                    text-center
                                                    sticky
                                                    left-0
                                                    z-10
                                                "
                                        >
                                            {hari}
                                        </td>

                                        <td
                                            colSpan={daftarJam.length}
                                            className="
                                                    text-gray-300
                                                    text-xs
                                                    italic
                                                    text-center
                                                    py-6
                                                "
                                        >
                                            Tidak ada jadwal
                                        </td>
                                    </tr>
                                );
                            }

                            // -----------------------------------------
                            // CELL YANG AKAN DITAMPILKAN
                            // -----------------------------------------
                            const cells = [];

                            let currentIndex = 0;

                            // -----------------------------------------
                            // LOOP SETIAP GROUP
                            // -----------------------------------------
                            groupedJadwal.forEach((group, groupIndex) => {
                                // =================================================
                                // SLOT KOSONG SEBELUM BLOCK
                                // =================================================
                                if (group.startIndex > currentIndex) {
                                    const jumlahKosong =
                                        group.startIndex - currentIndex;

                                    cells.push(
                                        <td
                                            key={`empty-${groupIndex}`}
                                            colSpan={jumlahKosong}
                                            className="
                                                        p-2
                                                        border-r
                                                        border-gray-200
                                                        text-center
                                                        align-middle
                                                    "
                                        >
                                            <div className="text-gray-300 text-xs italic py-4">
                                                -
                                            </div>
                                        </td>,
                                    );
                                }

                                // =================================================
                                // AMBIL WARNA KELAS
                                // =================================================
                                const warna = getWarnaKelas(group.nama_kelas);

                                // =================================================
                                // AMBIL MATA PELAJARAN UNIK
                                // =================================================
                                const namaMapelUnik = [
                                    ...new Set(
                                        group.items.map(
                                            (item) => item.nama_mapel,
                                        ),
                                    ),
                                ];

                                // =================================================
                                // BLOCK JADWAL
                                // =================================================
                                cells.push(
                                    <td
                                        key={`group-${groupIndex}`}
                                        colSpan={group.colSpan}
                                        className="
                                                    p-2
                                                    border-r
                                                    border-gray-200
                                                    align-middle
                                                "
                                    >
                                        <div
                                            className={`
                                                        ${warna.bg}
                                                        ${warna.border}
                                                        border
                                                        rounded-xl
                                                        p-3
                                                        shadow-sm
                                                        hover:shadow-md
                                                        transition-all
                                                        min-h-[85px]
                                                        flex
                                                        flex-col
                                                        justify-center
                                                    `}
                                        >
                                            {/* ---------------------------------
                                                        WAKTU
                                                    --------------------------------- */}
                                            <div
                                                className="
                                                            font-mono
                                                            text-[10px]
                                                            text-gray-500
                                                            mb-1
                                                            text-center
                                                        "
                                            >
                                                {group.jam_mulai} -{" "}
                                                {group.jam_selesai}
                                            </div>

                                            {/* ---------------------------------
                                                        MATA PELAJARAN
                                                    --------------------------------- */}
                                            <div
                                                className="
                                                            font-bold
                                                            text-gray-900
                                                            text-xs
                                                            text-center
                                                        "
                                            >
                                                {namaMapelUnik.join(" / ")}
                                            </div>

                                            {/* ---------------------------------
                                                        KELAS
                                                    --------------------------------- */}
                                            <div
                                                className={`
                                                            text-[11px]
                                                            font-bold
                                                            ${warna.text}
                                                            text-center
                                                            mt-1
                                                        `}
                                            >
                                                Kelas {group.nama_kelas}
                                            </div>

                                            {/* ---------------------------------
                                                        GURU
                                                    --------------------------------- */}
                                            {group.items[0]?.nama_guru && (
                                                <div
                                                    className="
                                                                text-[10px]
                                                                text-gray-500
                                                                text-center
                                                                mt-1
                                                            "
                                                >
                                                    <i className="fa fa-user-circle mr-1"></i>

                                                    {group.items[0].nama_guru}
                                                </div>
                                            )}
                                        </div>
                                    </td>,
                                );

                                // -----------------------------------------
                                // UPDATE INDEX
                                // -----------------------------------------
                                currentIndex = group.endIndex + 1;
                            });

                            // =================================================
                            // SLOT KOSONG DI AKHIR BARIS
                            // =================================================
                            if (currentIndex < daftarJam.length) {
                                cells.push(
                                    <td
                                        key="empty-last"
                                        colSpan={
                                            daftarJam.length - currentIndex
                                        }
                                        className="
                                                p-2
                                                border-r
                                                border-gray-200
                                                text-center
                                                align-middle
                                            "
                                    >
                                        <div className="text-gray-300 text-xs italic py-4">
                                            -
                                        </div>
                                    </td>,
                                );
                            }

                            // =================================================
                            // BARIS HARI
                            // =================================================
                            return (
                                <tr
                                    key={hari}
                                    className="
                                            border-b
                                            border-gray-200
                                            hover:bg-gray-50/80
                                        "
                                >
                                    {/* -----------------------------------------
                                            NAMA HARI
                                        ----------------------------------------- */}
                                    <td
                                        className="
                                                p-3
                                                font-extrabold
                                                text-gray-800
                                                text-xs
                                                uppercase
                                                tracking-wide
                                                bg-gray-50
                                                border-r
                                                border-gray-200
                                                text-center
                                                sticky
                                                left-0
                                                z-10
                                            "
                                    >
                                        {hari}
                                    </td>

                                    {/* -----------------------------------------
                                            HASIL GROUPING
                                        ----------------------------------------- */}
                                    {cells}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

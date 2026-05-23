import { db } from "./db";
import fs from "fs";

function render(content: string): string {
  const layout = fs.readFileSync("./views/layout.html", "utf8");
  return layout.replace("{{content}}", content);
}

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/" && req.method === "GET") {
      const [rows]: any = await db.query("SELECT * FROM mahasiswa ORDER BY id DESC");
      let baris = rows.length === 0
        ? `<tr><td colspan="5" class="p-4 text-center text-gray-400">Belum ada data</td></tr>`
        : rows.map((m: any, i: number) => `
          <tr class="border-t hover:bg-gray-50">
            <td class="p-3">${i+1}</td>
            <td class="p-3 font-medium">${m.nama}</td>
            <td class="p-3">${m.jurusan}</td>
            <td class="p-3">${m.angkatan}</td>
            <td class="p-3 text-center space-x-2">
              <a href="/edit/${m.id}" class="bg-yellow-400 hover:bg-yellow-500 text-white text-sm px-3 py-1 rounded">Edit</a>
              <a href="/hapus/${m.id}" onclick="return confirm('Hapus data ini?')"
                 class="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded">Hapus</a>
            </td>
          </tr>`).join("");
      const msg = url.searchParams.get("pesan") || "";
      const flashHtml = msg
        ? `<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">${decodeURIComponent(msg)}</div>`
        : "";
      let view = fs.readFileSync("./views/mahasiswa.html", "utf8");
      view = view.replace("{{rows}}", baris).replace("{{flash}}", flashHtml);
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    if (path === "/tambah" && req.method === "GET") {
      let view = fs.readFileSync("./views/form.html", "utf8");
      view = view.replace("{{judul}}","Tambah Mahasiswa").replace("{{action}}","/simpan")
                 .replace("{{nama}}","").replace("{{jurusan}}","").replace("{{angkatan}}","");
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    if (path === "/simpan" && req.method === "POST") {
      const body = await req.formData();
      await db.query("INSERT INTO mahasiswa (nama,jurusan,angkatan) VALUES (?,?,?)",
        [body.get("nama"), body.get("jurusan"), body.get("angkatan")]);
      return Response.redirect(`/?pesan=${encodeURIComponent("Data berhasil ditambahkan!")}`, 302);
    }

    if (path.startsWith("/edit/") && req.method === "GET") {
      const id = path.split("/")[2];
      const [rows]: any = await db.query("SELECT * FROM mahasiswa WHERE id=?", [id]);
      if (!rows.length) return Response.redirect("/", 302);
      const m = rows[0];
      let view = fs.readFileSync("./views/form.html", "utf8");
      view = view.replace("{{judul}}","Edit Mahasiswa").replace("{{action}}",`/update/${m.id}`)
                 .replace("{{nama}}",m.nama).replace("{{jurusan}}",m.jurusan).replace("{{angkatan}}",m.angkatan);
      return new Response(render(view), { headers: { "Content-Type": "text/html" } });
    }

    if (path.startsWith("/update/") && req.method === "POST") {
      const id = path.split("/")[2];
      const body = await req.formData();
      await db.query("UPDATE mahasiswa SET nama=?,jurusan=?,angkatan=? WHERE id=?",
        [body.get("nama"), body.get("jurusan"), body.get("angkatan"), id]);
      return Response.redirect(`/?pesan=${encodeURIComponent("Data berhasil diperbarui!")}`, 302);
    }

    if (path.startsWith("/hapus/")) {
      const id = path.split("/")[2];
      await db.query("DELETE FROM mahasiswa WHERE id=?", [id]);
      return Response.redirect(`/?pesan=${encodeURIComponent("Data berhasil dihapus!")}`, 302);
    }

    return new Response("404 Not Found", { status: 404 });
  }
});
console.log("Server jalan di http://localhost:3000");

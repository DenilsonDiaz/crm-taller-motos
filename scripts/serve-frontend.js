import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const folder = fileURLToPath(new URL("../frontend/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const target = path.resolve(
        folder,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!target.startsWith(folder)) throw Error();
      const file = await readFile(target);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(file);
    } catch {
      res.writeHead(404);
      res.end("No se encontró el archivo.");
    }
  })
  .listen(5500, "127.0.0.1", () =>
    console.log("MotoGest vendedores: http://127.0.0.1:5500"),
  );

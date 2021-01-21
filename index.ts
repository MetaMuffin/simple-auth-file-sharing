
import express from "express"
import { join } from "path"
const app = express()
import { stat, readdir, access } from "fs/promises"
import http from "http"
import https from "https"

import { Response, Request } from "express"
import { existsSync, readFileSync } from "fs";
import { exec } from "child_process";
import { useCGI } from "./cgi"

app.set('view engine', 'ejs');

/*
app.get("/", (req, res) => {
    res.send("Muffins file sharing server")
})*/

function safePathName(s: string): string {
    return s.replace(/[\.\/]/, "")
}

function sanitizeFn(s: string): string {
    return s.replace("..", "").replace(/^\//g,"").replace("//", "").replace(/[0x00–0x1f0x80–0x9f\\\|\:\<\>\"\?\*]/g, "")
}


function authRefuse(res: Response) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="incorrect credencials"' });
    return res.end("Incorrect credentials")
}

app.use(async (req, res, next) => {
    if (req.headers.authorization) {
        var userpass = Buffer.from((req.headers.authorization).split(' ')[1] || '', 'base64').toString();

        var fname = safePathName(userpass)
        var spath = sanitizeFn(req.url)
        var fpath = join(__dirname, "files", fname, spath).replace(/\/$/g, "")
        console.log(`[${req.ip}] ${fpath}`);
        var s;
        try {
            s = await stat(fpath)
        } catch (e) {
            return authRefuse(res)
        }

        if (s.isDirectory()) {
            var files = await Promise.all((await readdir(fpath)).map(async (fn) => {
                var sta = await stat(join(fpath, fn))
                var dir = sta.isDirectory()
                var cgi = !!(sta.mode % 2 == 1) && !dir
                return { name: fn, cgi, dir }
            }))
            return res.render("dirlist", { files, dirname: "/" + spath })
        }

        if (s.mode % 2 == 1) {
            return useCGI(req, res, fpath)
        }
        if (s.isFile()) {
            return res.sendFile(fpath)
        }
        res.status(500).send("Content not availible.")
    }
    return authRefuse(res)
});

app.disable("x-powered-by")

const srv = http.createServer(app)
srv.listen(8089, "0.0.0.0", () => {
    console.log("listening http service on :::8089");
})

if (existsSync(join(__dirname, "../certs"))) {
    const srvs = https.createServer({
        cert: readFileSync(join(__dirname, "../certs/cert.pem")),
        key: readFileSync(join(__dirname, "../certs/key.pem")),
    }, app)
    srvs.listen(8088, "0.0.0.0", () => {
        console.log("listening https service on :::8088");
    })
}


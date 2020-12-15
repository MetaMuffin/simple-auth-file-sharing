
import auth from "basic-auth";
import express from "express"
import { join } from "path"
const app = express()
import { stat, readdir } from "fs/promises"

import { Response } from "express"


app.set('view engine', 'ejs');

/*
app.get("/", (req, res) => {
    res.send("Muffins file sharing server")
})*/

function safePathName(s: string): string {
    return s.replace(/[\.\/]/, "")
}

app.use(async (req, res, next) => {
    const credentials = auth(req);
    if (credentials) {
        var fname = safePathName(credentials.name) + ":" + safePathName(credentials.pass)
        var spath = req.url.replace(".","").replace("\\","").replace("//","")
        var fpath = join(__dirname, "files", fname, spath).replace(/\/$/g,"")
        console.log(`[${req.ip}] ${fpath}`);
        var s;
        try {
            s = await stat(fpath)
        } catch (e) {
            return res.status(401).send("Halt Stop!")
        }
        if (s.isDirectory()) {
            var files = await readdir(fpath)
            return res.render("dirlist", { files })
        }
        if (s.isFile()) {
            return res.sendFile(fpath)
        }
        res.status(500).send("Content not availible.")
    }
    res.set('WWW-Authenticate', 'Basic realm="kekkekekek"');
    return res.status(401).send("Halt Stop!");
});

app.listen(8089, "0.0.0.0", () => {
    console.log("Listening on :::8089");
})
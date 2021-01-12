import { exec, spawn } from "child_process"
import { Response, Request } from "express"
import { dirname } from "path"
import { stdout } from "process"

export async function useCGI(req: Request, res: Response, fpath: string) {
    var proc = spawn(fpath, {
        env: {
            METHOD: req.method
        },
        cwd: dirname(fpath),
        argv0: fpath,
    })
    console.time("cgi")
    if (req.body) proc.stdin.write(req.body)
    var output = ""
    var erroutput = ""
    proc.stdout.on("data", (chunk) => { output += chunk.toString(); })
    proc.stderr.on("data", (chunk) => erroutput += chunk.toString())
    proc.on("exit", (code: number) => {
        console.timeEnd("cgi")
        if (proc.exitCode == 0) code = 200
        if (proc.exitCode == 1) code = 500
        res.status(code)
        var content = output + "\n" + (erroutput.length > 0 ? "" : `Errors:\n${erroutput.split("\n").map(s => `\t${s}`).join("\n")}`)
        res.send(content)
    })
}

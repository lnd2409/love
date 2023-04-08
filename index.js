const fileSystem = require("browserify-fs")

fileSystem.readFile("./note.json", (err, data) => {
    if(err) {
        console.log("File reading failed", err)
        return
    }
    console.log("File data:", data)
})
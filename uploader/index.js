const http = require("http");
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");
const server = http.createServer();

server.on("request", async (req, res) => {

  if (req.url === '/' || /\w+\.\w+$/.test(req.url)) {
    const filename = req.url === '/' ? 'index.html' : req.url.slice(1)
    fs.readFile(filename, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end()
      }
      res.end(data)
    })
  }

	if (req.url === '/upload' && req.method === 'POST') {
		const form = new multiparty.Form({
			uploadDir: path.resolve(__dirname, 'static')
		});

		form.parse(req, (err, fields, files) => {
			if (err) return
      
      files.file.forEach(item => {
        fs.rename(item.path, './static/' + new Date().getTime() + item.originalFilename, () => {})
      })
			
      res.end(JSON.stringify({
        success: 1,
        data: fields || {}
      }));
		});
  }
});

server.listen(3000, () => console.log("application is listening at http://localhost:3000"));
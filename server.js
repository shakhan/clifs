var sys = require("sys");
var url = require("url");
var fs = require("fs");
var childp = require("child_process");
var path = require("path");
var qs = require("querystring");
var fu = require("./fu");

// basic setup
HOST = null; //localhost
PORT = 3000;
fu.listen(PORT, HOST);
initialSetup();

// setup routes to files
fu.get("/", fu.staticHandler("index.html"));
fu.get("/style.css", fu.staticHandler("style.css"));
fu.get("/jquery-1.4.2.min.js", fu.staticHandler("jquery-1.4.2.min.js"));
fu.get("/jquery.hotkeys-0.7.9.js", fu.staticHandler("jquery.hotkeys-0.7.9.js"));
fu.get("/jquery.browser.js", fu.staticHandler("jquery.browser.js"));
fu.get("/cli.js", fu.staticHandler("cli.js"));
fu.get("/clifs.js", fu.staticHandler("clifs.js"));

fu.get("/c_cd", function (req, res) {
	var message = qs.parse(url.parse(req.url).query).message;
	if (message[0] == '/') {
		path.exists(message, function(exists) {
			if (exists) {
				res.simpleJSON(200, { message: message });
			} else
				res.simpleJSON(200, {});
		});
	} else {
		var currentdir = qs.parse(url.parse(req.url).query).currentdir;
		var x = path.normalize(currentdir + '/' + message);
		path.exists(x, function(exists) {
			if (exists) {
				res.simpleJSON(200, { message: x });
			} else
				res.simpleJSON(200, {});			
		});
	}
});

fu.get("/c_pwd", function (req, res) {
	childp.exec("pwd", function (err, stdout, stderr) {
  		if (err)
  			res.simpleJSON(200, {});
  		res.simpleJSON(200, { message: stdout });
	});	
});

fu.get("/c_ls", function (req, res) {
	var currentdir = qs.parse(url.parse(req.url).query).currentdir;
	var message = [];
	var files = fs.readdirSync(currentdir);
	files.forEach(function(file) {
		var stats = fs.statSync(path.normalize(currentdir + '/' + file));
		message.push({name: file, isdir: stats.isDirectory()});
	});
	res.simpleJSON(200, { message: message });
});

fu.get("/c_cat", function (req, res) {
	var currentdir = qs.parse(url.parse(req.url).query).currentdir;
	var file = qs.parse(url.parse(req.url).query).file;
	file = path.normalize(currentdir + '/' + file);
        fs.readFile(file, 'utf8', function (err, data) {
		if (!err) {
			res.simpleJSON(200, { message: data });
		}        
	});
});

function initialSetup() {
	sys.puts("Booting up...");
}

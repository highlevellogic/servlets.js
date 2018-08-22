const http = require('http');
global.fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

if (process.env.NODE_ENV === undefined) process.env.NODE_ENV = 'production';

let moduleLoadTimes = {};

let reqCount = 0;

   // basePath is the root directory for applications. (Like webapps on Tomcat or htdocs on Apache httpd.)
   // The default is the directory of the entry point or main module for the application.
   // It can be reset by the app developer using .setAppPath(appDir);
   let basePath = path.normalize(require.main.filename.substring(0,require.main.filename.lastIndexOf(path.sep)));
   let rootPath=basePath;
   let relRootPath="";
   let rootDir=false, showMimes=false;
   let corsdomains=[];
   let version = "HLL Servlets vx.xx";
   let shortVersion = "01";
   let etagString = nodeVersion() + shortVersion;

exports.showMimeTypes = function () {
  showMimes=true;
}
exports.setNodeEnv = function (env) {
  process.env.NODE_ENV=env;
  console.log("NODE_ENV set to " + env);
}
exports.setRootDir = function (root) {
  var theRootPath = path.join(basePath,root);
  if (!fs.existsSync(theRootPath)) fs.mkdirSync(theRootPath);
  if (fs.statSync(theRootPath).isDirectory()) {
    rootDir=true;
    rootPath=theRootPath;
    relRootPath=path.join("/",root);
  }
}
exports.setAppPath = function (bp) {
  try {
  let newPath = path.normalize(bp);
  if (!fs.existsSync(newPath)) {
    console.log("\nWARNING: App. Path: " + newPath + " does not exist.");
  } else {
    basePath = newPath;
    rootPath = basePath;
  }
  } catch (err) {console.log(err);}
}
exports.listen = function (port) {
  try {
  if (port === undefined) {
    port=80;
  } else if (Number.isNaN(port)) {
    console.log(port + " is not a number. Setting port to default.");
    port=80;
  } else if (port<1024 || port>49151) {
    console.log("Port " + port + " is outside acceptable range. (1024-49151) Setting port to default.");
    port=80;
  }
  } catch (err) {
    console.log("Error setting port in listen(). Setting port to default.")
    port=80;
  }
  
let server = http.createServer(function (req, res) {
   // Get information about the requested file or application.
   let fileInfo = setFileInfo(req,res,basePath);
 // display(fileInfo);
   // If request is a directory, it must have a trailing slash (otherwise resources such as css and js won't be loaded).
   if (fileInfo.redirect) {
	 var newUrl = path.join(req.url, "/");
     res.statusCode = 301;
     res.setHeader('Content-Type', 'text/plain');
     res.setHeader('Location', newUrl);
     res.end('Redirecting to ' + newUrl);
   } else if (fileInfo.contentType === undefined) {
     res.statusCode = 415;
     res.setHeader('Content-Type', 'text/plain');
     res.end('Media type is not supported. Use server.addMimeType() in your application.'); // currently, defaults to text/plain
   // If file does not exist, return 404 File not found error.
   } else if (fileInfo.noSuchFile) {
	   reportError(res,fileInfo.fullPath,404,"File not found: " + fileInfo.fullPath);
   // Otherwise, a JavaScript file should be loaded. 
   } else {
	   // Checks and adds JavaScript file.
	   let accountInfo = getAccount(res,fileInfo);
     if (accountInfo.code == 200) {
	     try {
		     // Executes the JavaScript.
		     new startObject(req,res,fileInfo).init();
	     } catch (err) {}
	   } else {
	     reportError(res,accountInfo.account,accountInfo.code,accountInfo.reason);
	   }
   }
}).listen(port);
  console.log("\n" + version + " is running on port " + port + ". (Node.js version " + process.version + ")");
  console.log("Path to application base: " + basePath);
  console.log("Path to root application: " + rootPath);
  if (showMimes) {
    console.log("Mime Types:");
    for (var type in mimeList) {
        console.log(" " + type + ": " + mimeList[type]);
    }
  }
  console.log("\n");
}
function reportError (res,account,statusCode,reason) {
  if (statusCode === undefined) statusCode = 500;
  try {
    delete require.cache[require.resolve(account)];
  } catch (err) {
  } finally {
	  console.log(statusCode + ": " + reason);
    res.statusCode=statusCode;
    res.setHeader('Content-Type','text/plain');
    res.end(reason);
  }
}
function FileInfo (basePath,path,fullPath,dirPath,suffix,headers,contentType,queryString,serveFile,redirect,noSuchFile,reload,etag) {
  this.basePath = basePath;
  this.path = path;
  this.fullPath = fullPath;
  this.dirPath = dirPath;
  this.suffix = suffix;
  this.headers = headers;
  this.contentType = contentType;
  this.queryString = queryString;
  this.serveFile = serveFile;
  this.redirect = redirect;
  this.noSuchFile = noSuchFile;
  this.reload = reload;
  this.etag = etag;
}
function Context (req,res,parms,dirPath,load) {
  this.request = req;
  this.response = res;
  this.parms = parms;
  this.dirPath = dirPath;
  this.load = load;
}
function PathInfo (filePath,reload,action,stats) {
  this.filePath = filePath;
  this.reload = reload;
  this.action = action;
  this.stats = stats;
}
function checkPath (basePath,relativePath) {
  // Build full path.
  let action="";
  if (relativePath.length == 0) relativePath="/";
  let fullPath = path.join(basePath,relativePath);
  let stats, checkPath;
  let reload=false;
  if (rootDir && (fs.existsSync(rootPath+relativePath) || fs.existsSync(rootPath+relativePath+".js"))) {
    fullPath = path.join(rootPath,relativePath);
    relativePath = path.join(relRootPath,relativePath);
  }
    try {
      // Does fullPath exist?
	    stats = fs.statSync(fullPath); 
    } catch (err) {
          
    if (fs.existsSync(fullPath+".js")) {
	    stats = fs.statSync(fullPath+".js");
	    if (moduleLoadTimes[fullPath+".js"] === undefined || moduleLoadTimes[fullPath+".js"] < stats.mtimeMs) reload = true;
	    return new PathInfo(path.normalize(relativePath),reload,"servlet",stats);
	  } 
    return new PathInfo(path.normalize(relativePath),false,"noSuchFile",stats);
    }
  // If fullPath points to a directory:
  if (stats.isDirectory()) {
	// directory requests without trailing '/' are redirected with '/' added
    if (fullPath.charAt(fullPath.length-1) != path.sep) return new PathInfo(path.normalize(relativePath),false,"redirect",stats);
      checkPath = path.join(fullPath,"index.js");
	    if (fs.existsSync(checkPath)) {
		  	  stats = fs.statSync(checkPath);
			    if (moduleLoadTimes[checkPath] === undefined || moduleLoadTimes[checkPath] < stats.mtimeMs) reload = true;
			    df = "index";
          action = "servlet";
		    } else {
          action = "noSuchFile";
        }
		    return new PathInfo(path.join(relativePath,df),reload,action,stats);
	    }

  return new PathInfo(relativePath,false,"noSuchFile",stats);
}
function setFileInfo (req, res, basePath) {
   let serveFile=true;
   let headers=req.headers;
   let fullPath="", suffix="", queryString="", contentType="",dirPath="",etag="";
   if (!headers['accept-encoding']) headers['accept-encoding'] = '';  // gzip, etc. 
   let reload=false;
   let thisBasePath=basePath;
console.log("req.url: " + req.url);
   let pathObj = url.parse(req.url,true);
   let uncheckedPath = pathObj.pathname;
   // If undefined, noSuchFile in FileInfo object is set to true.
   if (uncheckedPath === undefined) return new FileInfo(thisBasePath,req.url,fullPath,dirPath,suffix,headers,contentType,queryString,false,false,true,reload,etag);
   // Check to see if the ROOT directory is used, and if so; whether it still exists
 //  if (rootDir && uncheckedPath.lastIndexOf("/") == 0) thisBasePath = rootPath;
   // checkPath returns path request after performing various checks, (See checkPath() for details.)
   let checkedPath = checkPath(thisBasePath,uncheckedPath);
   if (checkedPath.action == "noSuchFile") return new FileInfo(thisBasePath,req.url,checkedPath.filePath,dirPath,suffix,headers,contentType,queryString,false,false,true,reload,etag);
   // If null, redirect in FileInfo object is set to true. (Needs redirect to add trailing slash.)
   if (checkedPath.action == "redirect") return new FileInfo(thisBasePath,req.url,fullPath,dirPath,suffix,headers,contentType,queryString,false,true,false,reload,etag);
   let urlArray = req.url.split("?");
   let currentPath = checkedPath.filePath;
   queryString = urlArray[1] || ""; // without '?'
   suffix = path.extname(currentPath).substring(1) || "";
   fullPath = path.join(thisBasePath,currentPath);
   dirPath = path.dirname(fullPath);
   if (suffix.length == 0) {
	 // Requests for JavaScript files without .js suffix are executed rather than served.
	 if (fs.existsSync(fullPath+".js")) {
	   suffix = "servlet"; // This special app suffix does not indicate MIME type.
	   currentPath += ".js";
	   fullPath += ".js";
	   serveFile=false;
     } else {
	   // If file exists with no suffix, attempt to serve it as text.
	   suffix = "txt";
     }
   }
   // Get MIME type.
 //  contentType = mimeList[suffix];
   // 415 Unsupported Media type is supported above.
   // Remove or conditionalize the following undefined check to make it work
   // This is here because it feels less confusing (new students) - but I want to rethink that
   if (contentType === undefined) {
     contentType = "text/plain";
   }
   return new FileInfo(thisBasePath,currentPath,fullPath,dirPath,suffix,headers,contentType,queryString,serveFile,false,false,checkedPath.reload,etag);
}
function checkCPath (path,ext,oAge) {
  try {
    if (fs.existsSync(path+ext)) {
      let cstats = fs.statSync(path+ext);
      if (oAge > cstats.mtimeMs) {
        if (ext == ".gz") {
          fs.writeFileSync(path+ext,zlib.gzipSync(fs.readFileSync(path)));
        } else if (ext == ".zl") {
          fs.writeFileSync(path+ext,zlib.deflateSync(fs.readFileSync(path)));
        }
      }
    } else {
      if (ext == ".gz") {
        fs.writeFileSync(path+ext,zlib.gzipSync(fs.readFileSync(path)));
      } else if (ext == ".zl") {
        fs.writeFileSync(path+ext,zlib.deflateSync(fs.readFileSync(path)));
      }
    }
  } catch (err) {
    console.log(path + "  Compression failed.\n" + err);
    return false;
  }
}
function nodeVersion () {
  var result="";
  var temp;
  var v = process.version;
  for (var i=0; i<v.length; i++) {
    temp = v.charAt(i);
    if (!isNaN(parseInt(temp))) result += temp;
  }
  return result;
}
function display (fi) {
  console.log("\nFile Info: " + reqCount++);
  var propValue;
  for(var propName in fi) {
    propValue = fi[propName];
    console.log("  " + propName,propValue);
  }
}
function Account (account,start,code,reason) {
  this.account = account;
  this.start = start;
  this.code = code;
  this.reason = reason;
}
// getAccount() is called only if JavaScript is to run on the server
// It loads the JavaScript file and creates a new Account object to provide that information or error information.
function getAccount (res,fileInfo) {
	let startPage = fileInfo.fullPath;
	let accountRoot = null;  // handle to loaded JavaScript page.
	let accountInfo; // for the new Account object
	let code = 200;  // default
	let reason;  // reason for error
	// Redundant check. Was also checked in setFileInfo()
	if (!fs.existsSync(startPage)) {
	  code = 404;
	  reason = startPage + " not found.";
	  accountInfo = new Account(null,startPage,code,reason);
	  return accountInfo;
    }
	try {
	  // Load the page and get its handle.
    if (fileInfo.reload) delete require.cache[require.resolve(startPage)];
	  accountRoot = require(startPage);
	  // Make sure that the required servlet(context) function exists in the loaded file.
	  // This is how this system automatically runs code in the newly loaded file. 
	  if (typeof accountRoot.servlet !== 'function') {
		  code = 500;
		  reason = startPage + " does not have a valid servlet() function.";
      delete require.cache[require.resolve(startPage)];
	  }
	} catch (err) {
	   var stop1 = err.stack.indexOf(err.message);
	   var stop = err.stack.substring(0,stop1).lastIndexOf('\n');
	   var errDescription = err.stack.substring(fileInfo.basePath.length,stop).replace(/\\/g,"/");
     code = 500;
	   reason = "Failed to load module: " + err.message + " \nreason: " + errDescription;
	   accountRoot = null;
	}
  accountInfo = new Account(accountRoot,startPage,code,reason);
	return accountInfo;
}
// startObject's init() method runs the code that was loaded by getAccount()
// It will get parameter values from the request and call the loaded application's init() method.
function startObject (req,res,fileInfo) {
  this.req = req;
  this.res = res;
  this.fileInfo = fileInfo;
  this.fsapp = fs; // global fs
  this.load = load;
  // this.init() is called to extract data from request, run the application, and send response
  this.init = function () {
	let request = this.req;
	let response = this.res;
  let goodPath = false;
	let fsapp = this.fsapp;
  let fileInfo = this.fileInfo;
  let myAppPath = this.fileInfo.fullPath;
	let shortPath = this.fileInfo.path;
	let reload = this.fileInfo.reload;
  let load = this.load;
	let contentType = this.fileInfo.contentType;
    let myApp;
	// Load the application file if it exists.
  if (fs.existsSync(myAppPath)) {
	  if (reload) {
		  delete require.cache[require.resolve(myAppPath)];
		  moduleLoadTimes[myAppPath] = new Date().getTime();
	  }
    myApp = require(myAppPath);
	  goodPath = true;
  }
	// This service loads the application file and calls exports.servlet(context)
    if (goodPath && typeof myApp.servlet == 'function') {
	  // Extract data sent from the browser for POST or GET
	  let queryData="";
        if (this.req.method == "POST") {
	      this.req.on('data', function(data) {
			try {
              queryData += data;
              if(queryData.length > 1e6) {
                queryData = "";
              }
			} catch (err) {
		      console.log("Error reading data: " + err.stack);
		    }
          });
          this.req.on('end', function() {
			try {
        request.post = querystring.parse(queryData);
        let boundLoader = load.bind({request:request,response:response,dirPath:fileInfo.dirPath});
        // This is where the application code is "called"
        let context = new Context(request,response,request.get,fileInfo.dirPath,boundLoader);
        let content = myApp.servlet(context);
        if (response.finished) {
          console.log("INFO: POST " + fileInfo.path + " Session ended by application.");
          return;
        }
			  	response.writeHead(200, {'Content-Type': fileInfo.contentType, 'server': version});
			    response.write(content.toString());
		    } catch (err) {
			    response.writeHead(500, {'Content-Type': 'text/plain'});
	        response.write(rtErrorMsg(err,shortPath));
			    console.log("Error running servlet: " + err.stack);
        } finally {
		      response.end();
			}
	      });
        } else if (this.req.method == "GET") {
          console.log("get");
		  try {
         request.get =  querystring.parse(fileInfo.queryString);
			let boundLoader = load.bind({request:request,response:response,dirPath:fileInfo.dirPath});
        // This is where the application code is "called"
        let context = new Context(request,response,request.get,fileInfo.dirPath,boundLoader);
        let content = myApp.servlet(context);
        console.log(fileInfo.path + " started " + response.finished);
       if (response.finished) {
          console.log("INFO: GET " + fileInfo.path + " session ended by application.");
          return;
       }
			  response.writeHead(200, {'Content-Type': fileInfo.contentType, 'server': version});
			  response.write(content.toString());
		  } catch (err) {
	  		response.writeHead(500, {'Content-Type': 'text/plain'});
	      response.write(rtErrorMsg(err,shortPath));
		  	console.log("Error running servlet: " + err.stack);
		  } finally {
		    response.end();
		  }
        } else if (this.req.method == "HEAD") {
          response.statusCode = 200;
          response.setHeader('server',version);
          response.setHeader('content-type', fileInfo.contentType);
          response.setHeader('transfer-encoding','chunked');
          response.end();
        } else {
          response.statusCode = 501;
          response.end(this.req.method + "request method is not yet supported on the server: " + version);
        }
    } else if (goodPath) {
	  response.write("No .servlet function in file: " + myAppPath);
	  response.end();
	//  delete require.cache[require.resolve(myAppPath)];
    } else {
	  response.write(myAppPath + " not found.");
	  response.end();
	//  delete require.cache[require.resolve(myAppPath)];
    }
  };
}
// rtErrorMsg() extracts useful information from the error stack
// when a runtime error occurs in the application code.
// The message can be written to the server's console and it is also
// returned so that it can be be sent to browser and displayed in its console.
// (Display in browser console requires cooperating AJAX handling in the browser
//    when http response status code != 200; console.error(..responseText))
function rtErrorMsg (err,shortPath) {
  var part1 = err.stack.substring(0,err.stack.indexOf('\n'));
  var fileName = shortPath.substring(shortPath.lastIndexOf("\\")+1);
  var stop1 = err.stack.indexOf(shortPath);
  var part2 = err.stack.substring(stop1);
  part2 = part2.substring(0,part2.indexOf('\n')-1).replace(/\\/g,"/");
  var reason = "Runtime error: " + part2 + "\n  " + part1;
  console.log("Error running servlet: " + reason);
  return reason;
}
let load = function (filePath) {
  let dirname=this.dirPath;
  let fullPath = path.join(dirname,filePath+".js");
  try {
    stats = fs.statSync(fullPath);
	  if (moduleLoadTimes[fullPath] === undefined || moduleLoadTimes[fullPath] < stats.mtimeMs) {
	    delete require.cache[require.resolve(fullPath)];
	  }
    return require(fullPath);
  } catch (err) {
    this.response.setHeader('Transfer-Encoding', 'chunked');
    this.response.writeHead(500, {'Content-Type': 'text/plain'});
    var stop1 = err.stack.indexOf(err.message);
	  var stop = err.stack.substring(0,stop1).lastIndexOf('\n');
	  var errDescription = err.stack.substring(basePath.length,stop).replace(/\\/g,"/");
	  reason = "Failed to load module: " + err.message + " \nreason: " + errDescription;
	  console.log(reason);
  	this.response.write(reason);
  } 
}

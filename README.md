# servlets.js
<h1>JavaScript Servlets</h1>
<p>JavaScript Servlets provide a fast and convenient way to create back end processes on Node.js. They were developed 
as an integral part of Achieve; a complete server for Node.js.<p>
<p>The Achieve tutorial provides details about using servlets, <a href="" target="http://hll.nu/achieve/">click here</a></p>
<h2>Features Summary</h2>
<ul>
<li>Runs back-end JavaScript programs (via JavaScript Servlets).</li>
<li>Supports default index.js</li>
<li>No knowledge of Node.js required to start using JS Servlets.</li>
<li>Little knowledge of JavaScript required to start using JS Servlets.</li>
<li>JS Servlets handle HTTP Response. App just uses return statement.</li>
<li>Useful app error reports - without crashing the server.</li>
<li>Automatic reload of modified files.</li>
<li>Servlet Context Object allows developer to take complete control.</li>
<li>Node.js environment configuration. (development,production)</li>
<li>Configurable apps folder path and path to the ROOT application.</li>
</ul>

<h2>Quick Start</h2>
<p>Install Node.js v8.1 or later. (Developed / tested with v8.9.4)</p>
<h3>Using:</h3>
<pre><code>
const server = require('servlets');
server.setAppPath(__dirname);  // Sets the application root to wherever you run this code
server.listen();  // defaults to port 80
</code></pre>
<h3>Running servlets with options:</h3>
<pre><code>
const server = require('servlets');

server.setAppPath("c:/myachieve/myapps");                // set root directory for all applications
server.setRootDir('root');                               // set a subdirectory under the root directory for THE ROOT application
server..showMimeTypes();                                 // Show the current list of supported Mime Types
server.addMimeType("xsl", "application/vnd.ms-excel");   // add an unsupported mime type
server.setNodeEnv("development");                        // set Node environment 

server.listen(8989);  // listens on port 8989
</code></pre>
<h3>Hello World Servlet:</h3>
<pre><code>
// Save this code in file index.js in the apps directory ("application base" - directory where you are running the server)<br>
exports.servlet = function (context)  {
  return "Hello World!";  // Achieve handles the response.
}
</code></pre>
<p>Display results in browser: http://localhost:8989 (assuming port 8989 and the file is named index.js.</p>
<p>Achieve will reload your programs when they've been modified. No need to restart the server.</p>
<h3>Application Code Error Messages in browser console:</h3>
<p>Modify your servlet to cause an error by deleting a few characters from the end of the return statement: 
<code style="margin-left:0px;display:inline-block;font-weight:bold;">return "Hello World</code>. Refresh the page.</p>
<h3>Access parameter values that were sent with the request:</h3>
<pre><code>
    var myParm = context.parms.myParm;  // or
    var myParm = context.parms['myParm'];
</code></pre>

<h3>Servlets can use other functions:</h3>
<pre><code>
exports.servlet = function (context)  {
  return hello();
}
function hello ()  {
   return "Hello World!";
}
</code></pre>
<h3>Servlets can use functions in other files.</h3>
<pre><code>
// in otherfile.js
exports.hello () {
  Return "Hello World!";
}

// in myservlet.js
exports.servlet = function (context) {
  var other = context.load("otherfile.js");  // Extends servlet features to otherfile; reloads if cache is stale.
  return other.hello();
}
</code></pre>
<h3>The Servlet Context</h3>
<p style="margin-bottom:0px;">You can use the Servlet Context to take control of your back end process. The Servlet Context contains:</p>
<pre><code>
  context.request    // The session request object.
  context.response   // The session response object.
  context.parms      // Parameters sent with the request
  context.dirPath    // The current application path on your computer
  context.load       // The JavaScript Servlet load() method (see above)
</code></pre>

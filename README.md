<section style="background-color:LightSkyBlue;">
<a href="https://hll.nu"><img src="https://hll.nu/achieve/skyhigh1.jpg" alt="High Level Logic"></a>

<h1>JavaScript Servlets</h1>

<h2>servlets.js is no longer supported — Use <a href="https://www.npmjs.com/package/achieve">Achieve 3</a></h2>

<p>JavaScript Servlets provide a fast and convenient way to create backend processes using ordinary JavaScript on Node.js. They were originally developed as an integral part of Achieve, a Node.js web server and HTTP application server.</p>

<p><code>servlets.js</code> was an experimental effort to separate JavaScript Servlet handling from Achieve. It was an extraction from Achieve, not its predecessor. The experiment was discontinued because servlet handling required much of the same routing and file management already provided by Achieve.</p>

<p><strong>JavaScript Servlets continue to be developed and supported in <a href="https://www.npmjs.com/package/achieve">Achieve 3</a>.</strong> Achieve integrates JavaScript Servlets with static file serving, routing, and other features needed to build web applications.</p>

<p><strong>Current Achieve 3 resources:</strong></p>
<ul>
<li><a href="https://www.npmjs.com/package/achieve">Achieve npm package</a></li>
<li><a href="https://highlevellogic.github.io/achieve/">Achieve 3 documentation</a></li>
<li><a href="https://github.com/highlevellogic/achieve">Achieve repository</a></li>
</ul>

<h2>Features Summary</h2>

<p>JavaScript Servlets offer a simple programming model:</p>

<ul>
<li>Run ordinary JavaScript programs as HTTP request handlers.</li>
<li>Start with little knowledge of Node.js or JavaScript.</li>
<li>Return content directly without manually handling the HTTP response.</li>
<li>Access request parameters through the Servlet Session.</li>
<li>Use ordinary JavaScript functions and Node.js modules.</li>
<li>Access the Node.js request and response objects for complete control.</li>
<li>Automatically reload modified servlet files during development.</li>
<li>Receive useful application error reports.</li>
</ul>

<p>These features are integrated into Achieve, a complete Node.js web server and HTTP application server.</p>

<h2>Quick Start — Original servlets.js Examples</h2>

<p>The following examples illustrate the original JavaScript Servlet programming model. They are retained for historical reference. For new projects, use <a href="https://www.npmjs.com/package/achieve">Achieve 3</a>.</p>

<h3>Starting the original server</h3>

<pre><code>const server = require('servlets');

server.listen(8989);
</code></pre>

<p>By default, the application directory is the directory containing the program used to start the server.</p>

<h3>Hello World Servlet</h3>

<p>Create a file named <code>index.js</code> in the application directory:</p>

<pre><code>exports.servlet = function (session) {
  return "Hello World!";
};
</code></pre>

<p>Open <code>http://localhost:8989/</code> in your browser.</p>

<p>The server executes the servlet and sends the returned value as the HTTP response. No additional response-handling code is required.</p>

<p><strong>This simple approach remains central to JavaScript Servlets in Achieve.</strong></p>

<h3>Automatic reloading</h3>

<p>Change the servlet:</p>

<pre><code>exports.servlet = function (session) {
  return "Hello Again!";
};
</code></pre>

<p>Refresh the browser. The modified servlet is loaded without restarting the server.</p>

<h3>Access request parameters</h3>

<pre><code>exports.servlet = function (session) {
  return "Hello " + session.parms.name;
};
</code></pre>

<p>For example, a request to <code>http://localhost:8989/?name=World</code> returns <code>Hello World</code>.</p>

<p><em>The original servlets.js package uses <code>session.parms</code>. See the current Achieve documentation for its updated parameter interface.</em></p>

<h3>Servlets can use other functions</h3>

<pre><code>exports.servlet = function (session) {
  return hello();
};

function hello() {
  return "Hello World!";
}
</code></pre>

<h3>Servlets can use functions in other files</h3>

<p>JavaScript Servlets are ordinary Node.js modules and can use functions defined in other modules.</p>

<p>For example, create <code>otherfile.js</code>:</p>

<pre><code>exports.hello = function () {
  return "Hello World!";
};
</code></pre>

<p>Then create <code>myservlet.js</code>:</p>

<pre><code>exports.servlet = function (session) {
  const other = require('./otherfile.js');
  return other.hello();
};
</code></pre>

<h3>The Servlet Session</h3>

<p>The original Servlet Session provided access to:</p>

<pre><code>session.request   // Node.js HTTP request object
session.response  // Node.js HTTP response object
session.parms     // Request parameters
session.dirPath   // Current application directory
session.load      // Original servlet module loader
</code></pre>

<p>Servlet developers could return simple content or use the underlying Node.js HTTP objects to manage responses directly.</p>

<h2>Continue with Achieve 3</h2>

<p>The standalone <code>servlets.js</code> package is discontinued. Its JavaScript Servlet concept remains an integral part of <a href="https://www.npmjs.com/package/achieve">Achieve</a>.</p>

<p><strong><a href="https://www.npmjs.com/package/achieve">Achieve 3</a></strong> is a developer-friendly web server and HTTP application server for Node.js. It supports JavaScript Servlets, static resources, and URL routing in a single server.</p>

</section>
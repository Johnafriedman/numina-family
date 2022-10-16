console.log('Starting server in ' + process.env.NODE_ENV + ' mode');

// var express = require('express');
// var app = express();
// app.use(express.static('www'));
// var port = process.env.PORT || 3000;
// app.listen(port);
// console.log('Web server listening on port ' + port);

var sslRedirect = require('heroku-ssl-redirect');
var express = require('express');
var vhost = require('vhost');


var fraterdeusApp = express();
fraterdeusApp.use(express.static("www/www.fraterdeus.com"))

var makeamindfulmarkApp = express();
makeamindfulmarkApp.use(express.static("www/www.makeamindfulmark.com"));

var katefriedmanApp = express();
katefriedmanApp.use(express.static("www/www.katefriedman.com"));

var numinaApp = express();
numinaApp.use(express.static("www/www.numina.org"));

var slowsolveApp = express();
slowsolveApp.use(express.static("www/www.slowsolve.org"));

var debugHandler = function handle (req, res, next) {
    // for match of "foo.bar.example.com:8080" against "*.*.example.com":
    console.dir(req.vhost.host) // => 'foo.bar.example.com:8080'
    console.dir(req.vhost.hostname) // => 'foo.bar.example.com'
    console.dir(req.vhost.length) // => 2
    console.dir(req.vhost[0]) // => 'foo'
    console.dir(req.vhost[1]) // => 'bar'
};


var app = express();
app.use(sslRedirect());
app.use(sslRedirect());

app.use(vhost("*.fraterdeus.com", fraterdeusApp));
app.use(vhost("fraterdeus.com", fraterdeusApp));
app.use(vhost("*.ideaswords.com", fraterdeusApp));
app.use(vhost("ideaswords.com", fraterdeusApp));

app.use(vhost("*.katefriedman.com", katefriedmanApp));
app.use(vhost("katefriedman.com", katefriedmanApp));

app.use(vhost("*.makeamindfulmark.com", makeamindfulmarkApp));
app.use(vhost("makeamindfulmark.com", makeamindfulmarkApp));

app.use(vhost("*.numina.org", numinaApp));
app.use(vhost("numina.org", numinaApp));

app.use(vhost("*.slowsolve.org", slowsolveApp));
app.use(vhost("slowsolve.org", slowsolveApp));

app.use(vhost("*", numinaApp));


var port = process.env.PORT || 3000;
app.listen(port);
console.log('Web server listening on port ' + port);
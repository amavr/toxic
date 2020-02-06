'use strict';

const config = require('config');
const restify = require('restify');
const crypto = require('crypto');
const redis = require('redis');
const url = require('url');

// const redis_url = config.get('redis.uri');
// const redis_client = redis.createClient(redis_url);

//var redisURL = url.parse(process.env.REDISCLOUD_URL);
var redisURL = url.parse(process.env.PORT || config.get('redis.uri'));
var redis_client = redis.createClient(redisURL.port, redisURL.hostname, {
    no_ready_check: true
});
if (redisURL.auth) redis_client.auth(redisURL.auth.split(":")[1]);

const server = restify.createServer();

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());

server.get('/api/v1/:x', (req, res, next) => {
    const url = req.params.x;
    const url_key = crypto.createHash('md5').update(url).digest('hex');
    console.log(url_key);

    redis_client.exists(url_key, (err, exists) => {
        if (exists === 1) {
            redis_client.get(url_key, (err, reply) => {

                if (err) {
                    console.log(err);
                    res.send(400, {
                        message: err
                    });
                    next();
                } else {
                    res.send(200, {
                        toxic: reply
                    });
                    next();
                }
            });
        } else {
            res.send(200, {
                toxic: 0
            });
            next();
        }
    });
});

server.post('/api/v1/:x', (req, res, next) => {
    const url = req.params.x;
    const url_key = crypto.createHash('md5').update(url).digest('hex');
    console.log(url_key);

    const fp = req.body;
    const fp_str = JSON.stringify(fp);
    const user_fp = crypto.createHash('md5').update(fp_str).digest('hex');
    const user_key = url_key + '-' + user_fp;
    console.log(user_key);

    redis_client.exists(user_key, (err, exists) => {
        if (exists === 1) {
            /// nothing! 
            console.log('double!')
        } else {
            /// URL key contains counter
            redis_client.exists(url_key, (err, exists) => {
                if (exists === 1) {
                    console.log('increment')
                    redis_client.incr(url_key)
                } else {
                    console.log('new page')
                    redis_client.set(url_key, 1)
                }
            });

            /// USER key contains Unix time (seconds)
            const sec_utc = Date.now() / 1000;
            redis_client.set(user_key, sec_utc)
            console.log('fix user')
        }
    });

    res.send(204, null);
    next();
});


function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
}

server.get('/hello/:name', respond);
server.head('/hello/:name', respond);


server.get('/', restify.plugins.serveStatic({
    directory: './public',
    default: 'index.html'
}));

server.get('/*', restify.plugins.serveStatic({
    directory: './public'
}));

const port = process.env.PORT || config.get('server.port');

server.listen(port, function () {
    console.log('%s listening at %s', server.name, server.url);
});
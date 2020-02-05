const API_URL = location.protocol + '//' + location.host + '/api'

var Query = function () {
    var me = this;

    var makeHeaders = function (reqHeaders) {
        var headers = {
            "Content-Type": "application/json"
        };

        if (reqHeaders) {
            for (var key in reqHeaders) {
                headers[key] = reqHeaders[key];
            }
        }

        return headers;
    }

    var ajax = function (url, options, onSuccess, onError) {

        if (options.async === undefined) options.async = true;

        var req = {
            url: API_URL + url,
            type: options.method,
            async: options.async,
            success: function (data) {
                // console.debug(data);
                onSuccess(data);
                try {
                    // done(data);
                } catch (ex) {
                    console.log(ex);
                    onError(ex.message);
                }
            },
            error: function (xhr, status, error) {
                if (xhr && xhr.status === 401) {
                    delete localStorage["auth"];
                    document.location = "auth.html"
                }
                console.log(xhr);
                console.log(error);
                try {
                    var err = JSON.parse(xhr.responseText);
                    let msg = err.msg ? err.msg : err.message ? err.message : null;
                    if (msg) {
                        onError(error + ': ' + msg);
                    } else if (err.errors && err.errors[0].status === 404) {
                        onError("Resource not found");
                    } else {
                        onError(error);
                    }
                } catch (ex) {
                    console.log(xhr.status);
                    onError(xhr.status + ': ' + xhr.statusText + ' on Route: ' + url);
                }
            }
        }

        // console.log(req);

        var json = (options.data === null || options.data === undefined) ? null : JSON.stringify(options.data);
        // console.log(json);

        if (json !== null) {
            req.data = json;
        }

        $.ajax(req);
    }


    me.get = function (req, done, error) {
        var options = {
            method: 'GET'
        };
        options.headers = makeHeaders(req.headers);
        ajax(req.url, options, done, error);
    }

    var sendBody = function (reqMethod, req, done, error) {
        console.debug("method:" + reqMethod);
        console.debug(req);
        var options = {
            method: reqMethod
        };
        options.headers = makeHeaders(req.headers);
        options.data = req.data;
        console.debug(options);
        ajax(req.url, options, done, error);
    }

    me.post = function (req, done, error) {
        sendBody('POST', req, done, error);
    }

    me.put = function (req, done, error) {
        sendBody('PUT', req, done, error);
    }

    me.patch = function (req, done, error) {
        sendBody('PATCH', req, done, error);
    }

    me.delete = function (req, done, error) {
        var options = {
            method: 'DELETE'
        };
        options.headers = makeHeaders(req.headers);
        ajax(req.url, options, done, error);
    }

    var constructor = function () {
    }

    constructor();
}

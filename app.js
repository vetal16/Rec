var express = require("express"),
    app = express(),
    server = require("http").Server(app),
    bodyParser = require("body-parser"),
    port = process.env.PORT || 5000;

//var najax = $ = require('najax');

const CLIENT_ID = 'mlkYfCOXdOOHrcZ5oOmARidOEqiJN47gd1i4FEU4';
const CLIENT_SECRET = 'vMtCkVDx96VyegkROV_oYWESWLDlSN4NRyUA3dVs';
const TOKEN = "ro3i65KzJX5K4a94fdmylIyQBl5Xu0";

var Clarifai = require('clarifai');
var clarifApp = new Clarifai.App(
  'mlkYfCOXdOOHrcZ5oOmARidOEqiJN47gd1i4FEU4',
  'vMtCkVDx96VyegkROV_oYWESWLDlSN4NRyUA3dVs'
);

//cross domain access
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(bodyParser.json());

app.post("/examineImage", function (req, resp) {
    var imageURL = req.body.imageRequested;
    console.log("Recognizing image: ", imageURL);
    
    //version 2
    clarifApp.models.predict(Clarifai.GENERAL_MODEL, imageURL).then(
        function(response) {
            console.log("Clarifai response: ", response.data.outputs[0].data);
            var concepts = response.data.outputs[0].data.concepts;
            var tags = [];
            concepts.forEach(function(concept) {
                tags = tags.concat(concept.name);
            });
                
            console.log('Got tags: ' + tags);
            resp.send(tags);
        },
        function(err) {
            console.log('Sorry, something is wrong.');
            resp.send("Error examining the image!");
        }
    )
    
    //version 1
    /*requestTags(imageURL, function(response) {
    //useToken(TOKEN, imageURL, function(response) {
        console.log("Getting response..." + response);
        var tags = [];

        if (response.status_code === 'OK') {
            var results = response.results;
            tags = results[0].result.tag.classes;
            console.log('Got tags: ' + tags);
            resp.send(tags);
        } else {
            console.log('Sorry, something is wrong.');
            console.log("We had an error... Details: " + " docid=" + response.results[0].docid + " local_id=" + response.results[0].local_id + " status_code=" + response.results[0].status_code + " error = " + response.results[0]["result"]["error"]);
            resp.send("Error: " + response.results[0]["result"]["error"]);
        }   
    });*/
});

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});

app.get(/^(.+)$/, function (req, res) {
    res.sendFile(__dirname + "/" + req.params[0]);
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});
server.listen(port, function () {
    console.log("Listening on " + port);
});

function requestTags(imurl, callback) {
    getToken(imurl, callback);
}

// Obtain token using client id and secret
function getToken(imurl, callback) {

    var token;

    var clientData = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    };

    najax({
        'url': 'https://api.clarifai.com/v1/token',
        'data': clientData,
        'type': 'POST',
        success: function (response) {
            console.log("Getting token: " + response);
            response = JSON.parse(response);
            console.log("Token = " + response.access_token);
            return useToken(response.access_token, imurl, callback);
        }
    });
}

function useToken(accessToken, imgurl, callback) {

    var imgData = {
        'url': imgurl
    };

    najax({
        'url': 'https://api.clarifai.com/v1/tag',
        'headers': {
            'Authorization': 'Bearer ' + accessToken
        },
        'data': imgData,
        'type': 'POST',
        success: function (response) {
            console.log("Obtained response from Clarifai");
            callback(JSON.parse(response));
        },
        error: function(response) {
            console.log("error!");
        }
    });
}

function parseResponse(r) {
    var tags = [];

    if (r.status_code === 'OK') {
        var results = r.results;
        tags = results[0].result.tag.classes;
    } else {
        console.log('Sorry, something is wrong.');
    }

    $('#tags').text(tags.toString().replace(/,/g, ', '));
    return tags;
}
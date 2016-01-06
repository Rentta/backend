// imports
var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var jsonfile = require('jsonfile');
var dataapi = require('./tools/data_api.js');
var mongoose = require('mongoose');

// declare variables
var server = 'localhost';
var port = 27017;
var database_name = 'test';
// start mongo
var url = 'mongodb://' + server + ':' + port + '/' + database_name;
var app_mongo = dataapi.mongo_init(mongoose, url);

var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        displayForm(res);
    } else if (req.method.toLowerCase() == 'post') {
        //processAllFieldsOfTheForm(req, res);
        processFormFieldsIndividual(req, res);
    }
});

function displayForm(res) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function processAllFieldsOfTheForm(req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //Store the data from the fields in your data store.
        //The data store could be a file or database or any other store based
        //on your application.
        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('received the data:\n\n');
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
    });
}

function processFormFieldsIndividual(req, res) {
    //Store the data from the fields in your data store.
    //The data store could be a file or database or any other store based
    //on your application.
    var fields = [];
    var form = new formidable.IncomingForm();
    var json_string = "{";
    //Call back when each field in the form is parsed.
    form.on('field', function (field, value) {
        console.log(field);
        console.log(value);
        fields[field] = value;
        //json_string = util.format("%j:%j,", field, value)
        json_string = json_string.concat(util.format("%j:%j,", field, value));
    });
    //Call back when each file in the form is parsed.
    form.on('file', function (name, file) {
        console.log(name);
        console.log(file);
        fields[name] = file;
        //Storing the files meta in fields array.
        //Depending on the application you can process it accordingly.
    });

    //Call back for file upload progress.
    form.on('progress', function (bytesReceived, bytesExpected) {
        var progress = {
            type: 'progress',
            bytesReceived: bytesReceived,
            bytesExpected: bytesExpected
        };
        console.log(progress);
        //Logging the progress on console.
        //Depending on your application you can either send the progress to client
        //for some visual feedback or perform some other operation.
    });

    //Call back at the end of the form.
    form.on('end', function () {
        res.writeHead(200, {
            'content-type': 'text/plain'
        });

        //set json to insertion
        json_string = json_string.slice(0,-1) + '}';
        var jsonObj = JSON.parse(json_string); //JSON.stringify(json_string)

        //write json to Mongo:
        var doc_id = dataapi.insert_doc(app_mongo, jsonObj);

        // write json to HD:
        var file_name = '/Users/Omri/Downloads/temp/' + doc_id + '.json';
        res.write('\nwriting json to file on disk\n');
        res.write(file_name);
        jsonfile.writeFileSync(file_name, jsonObj);
        res.write('\ndone writing json file to disk\n\n');

        res.end(util.inspect({ fields: fields }));
    });
    form.parse(req);
}

server.listen(1185);
console.log("server listening on 1185");

//TODO write images as base 64
//TODO write to disk and mongo
//TODO change file name to mongo key
//TODO use geo 2d index in mongo for location
//TODO user and pw for mongo
//TODO deal with numbers in json, now it's "5" and not just 5
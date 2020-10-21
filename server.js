var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
const path = require('path');// Serve the static files from the React app


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

let mydb, cloudant;
var vendor; // Because the MongoDB and Cloudant use different API commands, we
            // have to check which command should be used based on the database
            // vendor.
var dbName = 'mydb';

var start_building_list = [
    "Command Centre",
    "Resource Buildings",
]

var res_details = {
  "oxy": 500,
  "hyd": 500,
  "irn": 500,
  "fud": 500,
  "wud": 500,
  "crys": 500,
  "oxy_speed": 1000,
  "hyd_speed": 1000,
  "irn_speed": 1000,
  "fud_speed": 1000,
  "wud_speed": 1000,
  "crys_speed": 1500
}

  var all_buildings = [
      "Command Centre",
      "Guild Hall",
      "Resource Buildings",
      "Barracks",
      "Radar",
      "Market",
      "Storage",
      "Infirmary",
      "Tech Centre", // shield, towers, walls, traps
      "Research Lab",
      "Resource Bunker",
      "Settlements"
  ]

  var building_link_list = {
      "Command Centre": "commCentre.html",
      "Guild Hall": "guild.html",
      "Resource Buildings": "resbuilds.html",
      "Barracks": "barracks.html",
      "Radar": "radar.html",
      "Market": "market.html",
      "Storage": "storage.html",
      "Infirmary": "infirmary.html",
      "Tech Centre": "tech.html",
      "Research Lab": "lab.html",
      "Resource Bunker": "bunker.html",
      "Settlements": "settlements.html"
  }

  var building_index_list = {
      "Command Centre": "0",
      "Guild Hall": "1",
      "Resource Buildings": "2",
      "Barracks": "3",
      "Radar": "4",
      "Market": "5",
      "Storage": "6",
      "Infirmary": "7",
      "Tech Centre": "8",
      "Research Lab": "9",
      "Resource Bunker": "10",
      "Settlements": "11"
  }

  var building_color_list = {
      "Command Centre": "blue",
      "Guild Hall": "gold",
      "Resource Buildings": "lime",
      "Barracks": "darkred",
      "Radar": "cyan",
      "Market": "orangered",
      "Storage": "silver",
      "Infirmary": "red",
      "Tech Centre": "orange",
      "Research Lab": "green",
      "Resource Bunker": "darkblue",
      "Settlements": "yellow"
  }

// Separate functions are provided for inserting/retrieving content from
// MongoDB and Cloudant databases. These functions must be prefixed by a
// value that may be assigned to the 'vendor' variable, such as 'mongodb' or
// 'cloudant' (i.e., 'cloudantInsertOne' and 'mongodbInsertOne')

var insertOne = {};
var getAll = {};

insertOne.cloudant = function(doc, response) {
  mydb.insert(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insert] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
}

getAll.cloudant = function(response) {
  var names = [];
  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });
  //return names;
}

let collectionName = 'mycollection'; // MongoDB requires a collection name.

insertOne.mongodb = function(doc, response) {
  mydb.collection(collectionName).insertOne(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insertOne] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
}

getAll.mongodb = function(response) {
  var names = [];
  mydb.collection(collectionName).find({}, {fields:{_id: 0, count: 0}}).toArray(function(err, result) {
    if (!err) {
      result.forEach(function(row) {
        names.push(row.name);
      });
      response.json(names);
    }
  });
}

/* Endpoint to greet and add a new visitor to database.
* Send a POST request to localhost:3000/api/visitors with body
* {
*   "name": "Bob"
* }
*/
app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  var doc = { "name" : userName };
  if(!mydb) {
    console.log("No database.");
    response.send(doc);
    return;
  }
  insertOne[vendor](doc, response);
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {
  var names = [];
  if(!mydb) {
    response.json(names);
    return;
  }
  getAll[vendor](response);
});


////////////////////////////////////////////////////////////////////////////////
///////////////////// Start my code ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.get("/api/start_buildings", function (request, response) {
  response.json(start_building_list);
});

app.get("/api/start_res_details", function (request, response) {
  response.json(res_details);
});

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['compose-for-mongodb'] || appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/)) {
  // Load the MongoDB library.
  var MongoClient = require('mongodb').MongoClient;

  dbName = 'mydb';

  // Initialize database with credentials
  if (appEnv.services['compose-for-mongodb']) {
    MongoClient.connect(appEnv.services['compose-for-mongodb'][0].credentials.uri, null, function(err, db) {
      if (err) {
        console.log(err);
      } else {
        mydb = db.db(dbName);
        console.log("Created database: " + dbName);
      }
    });
  } else {
    // user-provided service with 'mongodb' in its name
    MongoClient.connect(appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/).credentials.uri, null,
      function(err, db) {
        if (err) {
          console.log(err);
        } else {
          mydb = db.db(dbName);
          console.log("Created database: " + dbName);
        }
      }
    );
  }

  vendor = 'mongodb';
} else if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/[Cc][Ll][Oo][Uu][Dd][Aa][Nn][Tt]/)) {
  // Load the Cloudant library.
  var Cloudant = require('@cloudant/cloudant');

  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
    // CF service named 'cloudantNoSQLDB'
    cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
  } else {
     // user-provided service with 'cloudant' in its name
     cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }
} else if (process.env.CLOUDANT_URL){
  cloudant = Cloudant(process.env.CLOUDANT_URL);
}
if(cloudant) {
  //database name
  dbName = 'mydb';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);

  vendor = 'cloudant';
}


//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));


var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});

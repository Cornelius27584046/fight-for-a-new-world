var express = require("express");
var app = express();
var serv = require('http').Server(app);
const path = require('path');
var bodyParser = require('body-parser');
const FPS = 25;
var fs = require('fs');
const INDEX = '/views/index.html';

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// DUMMY DATA /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function removeUser(id) {
  delete users[id];
  delete userBuildings[id];
  delete userRes[id];
  delete userStates[id];
}

function createNewUser(id) {
  new_user_details(id);
  new_buildings(id);
  new_resources(id);
}

function setUserState(id, state) {
  { id: state }
}

function new_user_details(id) {
  users.push({id, id});
}

function new_buildings(id) {
  //console.log(id)
  userBuildings[id] = {
     "Command Centre": 1 ,
     "Resource Buildings": 1
  }
}

function new_resources(id) {
  userRes.push({
    id: {
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
  })
}

var users = [
  { "user": "123" }
]

var userBuildings = {
  "user": {
     "Command Centre": 1 ,
     "Resource Buildings": 1
  }
}

var userRes = [
  {
    "user": {
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
  }
]

var allBuildings = [
  {
    "names": [
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
      "Bunker",
      "Settlements"
    ]
  },
  {
    "links": [
        {"Command Centre": "commCentre.html"},
        {"Guild Hall": "guild.html"},
        {"Resource Buildings": "resbuilds.html"},
        {"Barracks": "barracks.html"},
        {"Radar": "radar.html"},
        {"Market": "market.html"},
        {"Storage": "storage.html"},
        {"Infirmary": "infirmary.html"},
        {"Tech Centre": "tech.html"},
        {"Research Lab": "lab.html"},
        {"Bunker": "bunker.html"},
        {"Settlements": "settlements.html"}
    ]
  },
  {
    "price": [
        {"Command Centre": [ [0, 0, 0, 0, 0, 0] ]},
        {"Guild Hall": [ [500, 500, 500, 500, 500, 500] ]},
        {"Resource Buildings": [ [0, 0, 0, 0, 0, 0] ]},
        {"Barracks": [ [500, 500, 500, 500, 500, 500] ]},
        {"Radar": [ [500, 500, 500, 500, 500, 500] ]},
        {"Market": [ [500, 500, 500, 500, 500, 500] ]},
        {"Storage": [ [500, 500, 500, 500, 500, 500] ]},
        {"Infirmary": [ [500, 500, 500, 500, 500, 500] ]},
        {"Tech Centre": [ [500, 500, 500, 500, 500, 500] ]},
        {"Research Lab": [ [500, 500, 500, 500, 500, 500] ]},
        {"Bunker": [[500, 500, 500, 500, 500, 500] ]},
        {"Settlements": [ [500, 500, 500, 500, 500, 500] ]}
    ]
  }
]

var userStates = [
  { 'user': 'home'}
]

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// EXPRESS CODE ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.get("/api/user_building_list", function (request, response) {
  response.json(cur_building_list[request]);
});

app.get("/api/user_resources_list", function (request, response) {
  response.json(userRes[request]);
});

express_update = (fps) => {
  for (let i in userRes) {
    userRes[i]["oxy"] = userRes[i]["oxy"] + userRes[i]["oxy_speed"] / 60 / 60 / fps;
    userRes[i]["hyd"] = userRes[i]["hyd"] + userRes[i]["hyd_speed"] / 60 / 60 / fps;
    userRes[i]["irn"] = userRes[i]["irn"] + userRes[i]["irn_speed"] / 60 / 60 / fps;
    userRes[i]["fud"] = userRes[i]["fud"] + userRes[i]["fud_speed"] / 60 / 60 / fps;
    userRes[i]["wud"] = userRes[i]["wud"] + userRes[i]["wud_speed"] / 60 / 60 / fps;
    userRes[i]["crys"] = userRes[i]["crys"] + userRes[i]["crys_speed"] / 60 / 60 / fps;
  }
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));


var PORT = process.env.PORT || 3000
/*var server = app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});*/
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// SOCKET CODE ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var SOCKET_LIST = {};
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  createNewUser(socket.id);
  socket.emit('state', 'home');

  socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		removeUser(socket.id);
	});

  socket.on('root_done', function(data) {
    if(data == 'home') {
      let to_add = "";
      let tempBuilds = [];
      tempBuilds = userBuildings[socket.id];
      //console.log(tempBuilds)
      for (i in tempBuilds) {
        //console.log(i)
        to_add = to_add + `<li><a onclick="newPage('${i.split(" ")[0]}')" id="${i.split(" ")[0]}">${i}</a></br></li>`;
      }
      socket.emit('add_buildings', to_add);
    }
  })

	/*socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('signIn',function(data){ //{username,password}
		Database.isValidPassword(data,function(res){
			if(!res)
				return socket.emit('signInResponse',{success:false});
			Database.getPlayerProgress(data.username,function(progress){
				Player.onConnect(socket,data.username,progress);
				socket.emit('signInResponse',{success:true});
			})
		});
	});
	socket.on('signUp',function(data){
		Database.isUsernameTaken(data,function(res){
			if(res){
				socket.emit('signUpResponse',{success:false});
			} else {
				Database.addUser(data,function(){
					socket.emit('signUpResponse',{success:true});
				});
			}
		});
	});


	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});*/


  socket.on('state', function(data) {
    setUserState(socket.id, data);
    if(data == "home") {
      filename = __dirname + '\\views\\home.html';
      fs.readFile(filename, 'utf8', function(err, data) {
      if (err) throw err;
        console.log('OK: ' + filename);
        socket.emit('root', data);
      });
    }
  })

});


















////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// UPDATE LOOP ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


setInterval( () => {
  express_update(FPS);
}, 1000/FPS);

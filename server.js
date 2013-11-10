var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'),
    fs = require('fs');

var connections = 0;
app.get('/', function (req, res) {
	connections++;
	console.log('New connection ['+connections+']');
    res.sendfile(__dirname + '/app/index.html');
});

app.get('*.css', function (req, res) {
    res.sendfile(__dirname + '/app/css/bootstrap.min.css');
});

app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.send(404, 'Erreur 404 : Page introuvable !');
});

var allClients = [];
var nbClients = 0.

//
io.sockets.on('connection', function (client, nickname){
	// First connection event
	client.on('join', function(nickname) {
		nickname = ent.encode(nickname);  // Avoid XSS
		client.set('nickname', nickname); // Add properties to this client
		
		allClients.push(client); // Store an array of all clients in RAM
		nbClients++;			 // Total of connected clients

		console.log(nickname + ' join the channel.');
		client.broadcast.emit('join', nickname);
	});
	// Leave the server event
	client.on('disconnect', function() {
		client.get('nickname', function(error, nickname) {
			console.log(nickname + ' left the channel.');
			client.broadcast.emit('left', nickname);
		});

		var i = allClients.indexOf(client);
		delete allClients[i];
		console.log( --nbClients + ' clients left.');
	});

	// Broadcast some text
	client.on('send', function(text) {
		client.get('nickname', function(error, nickname) {
			text = ent.encode(text);
			console.log(nickname +' : '+text);
			client.broadcast.emit('send', {nickname: nickname, text: text});
		});
	});
});
 
server.listen(8080);
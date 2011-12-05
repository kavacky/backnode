io = require('socket.io').listen(81);

var users = {};
var talk = [];


talk[1] = 'BITCHES';
talk[2] = 'LITTLE PUSSIES';
talk[3] = 'MOTHERFUCKERS';
talk[4] = 'MIDGET SEX';
talk[5] = 'DO YOU HAVE A PROBLEM?';
talk[6] = 'WALK AWAY!';
talk[7] = 'YOU ALL GOING TO DIE!!';

var mob = {};

function mob_say() {
	
	var date = new Date();

	io.sockets.emit('say', {
		id : 'boss',
		name : mob.name,
		message : talk[Math.floor(Math.random()*8)],
		time : date.getHours() + ':' + date.getMinutes()
	} );	

	setTimeout(mob_say, Math.floor(Math.random()*14000));
}


mob = {
	id : 'boss',
	x : 30,
	y : 20,
	name : 'TEH BOSS',
	move_lock : false,
	sprite : 'mob.gif'
};


mob_say();

io.sockets.on('connection', function (socket) {


	// PING
	socket.on('pong', function(token) {

		if (token == users[socket.id]['token']) {
			clearTimeout(users[socket.id].timeout);
			ping(socket);
		}

	});

	// AUTH
	socket.on('nickname', function(nickname) {

		users[socket.id] = {};
		users[socket.id].x = 50;
		users[socket.id].y = 50;
		users[socket.id].move_lock = false;
		users[socket.id].name = nickname;

		socket.emit('ready', 'ok');

		io.sockets.emit('info', nickname + ' joined the chat!');

		socket.emit('positions', send_positions() );

		ping(socket);


	});


	// SAY
	socket.on('say', function(message) {
	
		var date = new Date();

		io.sockets.emit('say', {
			id : socket.id,
			name : users[socket.id].name,
			message : message,
			time : date.getHours() + ':' + date.getMinutes()
		} );		
	
	});

	// MOVE
	socket.on('move', function(direction) {



		if (users[socket.id] != undefined && !users[socket.id].move_lock) {

			switch(direction) {
				case 'up':

					if (users[socket.id].y > 0) {
						users[socket.id].y -= 1;
						users[socket.id].move_lock = true;
						clear_move(socket.id);
						broadcast_user_position(socket.id);
					}
					break;

				case 'down':

					if (users[socket.id].y < 100) {
						users[socket.id].y += 1;
						users[socket.id].move_lock = true;	
						clear_move(socket.id);	
						broadcast_user_position(socket.id);						
					}
					break;

				case 'left':

					if (users[socket.id].x > 0) {
						users[socket.id].x -= 1;
						users[socket.id].move_lock = true;
						clear_move(socket.id);	
						broadcast_user_position(socket.id);
					}
					break;

				case 'right':

					if (users[socket.id].x < 100) {
						users[socket.id].x += 1;
						users[socket.id].move_lock = true;	
						clear_move(socket.id);	
						broadcast_user_position(socket.id);
					}
					break;
												
				default:

			}
		}

	});

	// DISCONNECT
	socket.on('disconnect', function() {

		
		if (users[socket.id] != undefined) {

			var user = {};

			var user = {
				id : socket.id,
				name : users[socket.id].name
			};			

			io.sockets.emit('remove', user );
		}



		disconnect(socket);

		
	});

});


function clear_move(user_id) {
	setTimeout(function() {
		users[user_id].move_lock = false;
	}, 100);
}


function broadcast_user_position(user_id) {

	var pos = {};
	pos[user_id] = {
		id : user_id,
		name : users[user_id].name,
		x : users[user_id].x,
		y : users[user_id].y
	};

	io.sockets.emit('move',  pos );
}

/* Generete user positions */
function send_positions() {
	var json = {};
	for(i in users) {
		json[i] = {
			id : i,
			name : users[i].name,
			x : users[i].x, 
			y : users[i].y
		}
	}

	json['boss'] = mob;

	return json;
}

/* Ping */
function ping(socket) {
	
	setTimeout(function() {

		var token = (+new Date());

		socket.emit('ping', token);

		if (users[socket.id]) {

			users[socket.id].token = token;
			users[socket.id].timeout = setTimeout(function() {

				socket.disconnect();
		
			}, 3000);			

		}

	}, 3000);

}

function disconnect(socket) {
	
	if (users[socket.id] != undefined) {

		if (users[socket.id]['timeout'] != undefined) {
			clearTimeout(users[socket.id].timeout);
		}		
		
		delete users[socket.id];
		
	}

}
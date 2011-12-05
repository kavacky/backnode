io = require('socket.io').listen(81);

var users = {};


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
		users[socket.id].direction = 'down';
		users[socket.id].move_lock = false;
		users[socket.id].action_lock = false;
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
						users[socket.id].direction = 'up';
						users[socket.id].move_lock = true;
						clear_move(socket.id);
						broadcast_user_position(socket.id);
					}
					break;

				case 'down':

					if (users[socket.id].y < 100) {
						users[socket.id].y += 1;
						users[socket.id].direction = 'down';
						users[socket.id].move_lock = true;	
						clear_move(socket.id);	
						broadcast_user_position(socket.id);						
					}
					break;

				case 'left':

					if (users[socket.id].x > 0) {
						users[socket.id].x -= 1;
						users[socket.id].direction = 'left';
						users[socket.id].move_lock = true;
						clear_move(socket.id);	
						broadcast_user_position(socket.id);
					}
					break;

				case 'right':

					if (users[socket.id].x < 100) {
						users[socket.id].x += 1;
						users[socket.id].direction = 'right';
						users[socket.id].move_lock = true;	
						clear_move(socket.id);	
						broadcast_user_position(socket.id);
					}
					break;
												
				default:

			}
		}

	});
	
	// ACTION
	socket.on('action', function(action) {

		if (users[socket.id] != undefined && !users[socket.id].action_lock) {

			switch(action) {
				case 'instagib':
				
					users[socket.id].action_lock = true;
					clear_action(socket.id, 100);
				
					if (users[socket.id].direction == 'right') {
						for(i in users) {
							if (users[i].y == users[socket.id].y && users[i].x > users[socket.id].x) {
								broadcast_instagib(users[socked.id], users[i]);
							}
						}
					}
					else if (users[socket.id].direction == 'left') {
						for(i in users) {
							if (users[i].y == users[socket.id].y && users[i].x < users[socket.id].x) {
								broadcast_instagib(users[socked.id], users[i]);
							}
						}
					}
					else if (users[socket.id].direction == 'up') {
						for(i in users) {
							if (users[i].x == users[socket.id].x && users[i].y < users[socket.id].y) {
								broadcast_instagib(users[socked.id], users[i]);
							}
						}
					}
					else if (users[socket.id].direction == 'down') {
						for(i in users) {
							if (users[i].x == users[socket.id].x && users[i].y > users[socket.id].y) {
								broadcast_instagib(users[socked.id], users[i]);
							}
						}
					}
					
					break;

			default:
				// No action

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

function clear_action(user_id, timeout = 100) {
	setTimeout(function() {
		users[user_id].action_lock = false;
	}, timeout);
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

function broadcast_instagib(killer, victim) {

	io.sockets.emit('info', killer.nickname + ' killed ' + victim.nickname);
	
	users[victim.id].x = 50;
	users[victim.id].y = 50;
	users[victim.id].direction = 'down';
	users[victim.id].move_lock = false;
	users[victim.id].action_lock = false;
	
	broadcast_user_position(victim.id);
	
	// @TODO: emit action -> instagib + params
	// @TODO: user respawn @ center

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

	console.log(json);


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

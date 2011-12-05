io = require('socket.io').listen(81);

io.set('log level', 1);



var users = {};
var talk = [];

talk[9] = 'LOL';
talk[1] = 'BITCHES';
talk[2] = 'LITTLE PUSSIES';
talk[3] = 'MOTHERFUCKERS';
talk[4] = 'MIDGET SEX :D';
talk[5] = 'DO YOU HAVE A PROBLEM?';
talk[6] = 'WALK AWAY!';
talk[7] = 'YOU ALL GOING TO DIE!!';
talk[8] = 'NOOBS';

// add boss
users['boss'] = {
	id : 'boss',
	x : 30,
	y : 20,
	name : 'CEO',
	move_lock : false,
	sprite : 'mob.gif',
	frags : 0,
	deaths : 0
};


/*
	Boss talking shit
*/
function mob_say() {
	
	var date = new Date();

	io.sockets.emit('say', {
		id : 'boss',
		name : users['boss'].name,
		message : talk[1 + Math.floor(Math.random()*8)],
		time : date.getHours() + ':' + date.getMinutes()
	} );	

	setTimeout(mob_say, 5000 + Math.floor(Math.random()*10000));
}


function mob_walk() {


	var rand1 = Math.floor(Math.random()*2);
	var rand2 = Math.floor(Math.random()*3);

	// x
	if (rand1) {
		if (rand2 == 0) {
			users['boss'].x -= 1;
		}
		if (rand2 == 2) {
			users['boss'].x += 1;
		}		
	} // y
	else {
		if (rand2 == 0) {
			users['boss'].y -= 1;
		}
		if (rand2 == 2) {
			users['boss'].y += 1;
		}			
	}

	broadcast_user_position('boss');


	setTimeout(mob_walk, Math.floor(Math.random()*300));	
}


mob_say();
mob_walk();


function users_online() {

	var json = {};
	for(i in users) {
	
		json[i] = {
			name: users[i].name
		}
		
	}	

	console.log('Users online: ',  json );
}


/*
	MAIN
*/
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
		users[socket.id].frags = 0;
		users[socket.id].deaths = 0;

		socket.emit('ready', 'ok');

		io.sockets.emit('info', nickname + ' joined the chat!');

		socket.emit('positions', send_positions() );

		broadcast_scoretable();

		ping(socket);


		users_online();

	});

	// SAY
	socket.on('say', function(message) {
	
		var date = new Date();

		if (users[socket.id] != undefined) {
			
			io.sockets.emit('say', {
				id : socket.id,
				name : users[socket.id].name,
				message : message,
				time : date.getHours() + ':' + date.getMinutes()
			} );	
				
		}

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

			broadcast_action(socket.id, action);

			switch(action) {
			
				case 'instagib':

					users[socket.id].action_lock = true;
					clear_action(socket.id, 1500);
				
					if (users[socket.id].direction == 'right') {
						for(i in users) {
							if (users[i].y == users[socket.id].y && users[i].x > users[socket.id].x) {
								
								broadcast_instagib(socket.id, i);
							}
						}
					}
					else if (users[socket.id].direction == 'left') {
						for(i in users) {
							if (users[i].y == users[socket.id].y && users[i].x < users[socket.id].x) {
								broadcast_instagib(socket.id, i);
							}
						}
					}
					else if (users[socket.id].direction == 'up') {
						for(i in users) {
							if (users[i].x == users[socket.id].x && users[i].y < users[socket.id].y) {
								broadcast_instagib(socket.id, i);
							}
						}
					}
					else if (users[socket.id].direction == 'down') {
						for(i in users) {
							if (users[i].x == users[socket.id].x && users[i].y > users[socket.id].y) {
								broadcast_instagib(socket.id, i);
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
		
		users_online();

	});

});

/*
	Re-enables user to move again (flood protection)
*/
function clear_move(user_id) {

	if (users[user_id] != undefined) {
		setTimeout(function() {
			users[user_id].move_lock = false;
		}, 100);
	}
}

/*
	Re-enables user to do something again (flood protection)
*/
function clear_action(user_id, timeout) {

	if (users[user_id] != undefined) {

		setTimeout(function() {
			users[user_id].action_lock = false;
		}, timeout);		

	}

}

/*
	User moved
*/
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

/*
	Send reply to action
*/
function broadcast_action(user_id, action) {

	if (users[user_id] != undefined) {

		var pos = {};
		pos[user_id] = {
			id : user_id,
			action: action,
			direction : users[user_id].direction
		};

		io.sockets.emit('action',  pos);
		
	}
}

/*
	Send reply to kill
*/
function broadcast_instagib(killer, victim) {

	if (users[victim] != undefined && users[killer] != undefined) {
		
		users[victim].x = 50;
		users[victim].y = 50;
		users[victim].direction = 'down';
		users[victim].move_lock = false;
		users[victim].action_lock = false;
		users[victim].deaths += 1;
		
		users[killer].frags += 1;
		
		var frag = {};
		frag = {
			id : victim,
			killer: killer,
			weapon: 'instagib',
			new_x: users[victim].x,
			new_y: users[victim].y
		};
		
		io.sockets.emit('frag', frag);
		
		broadcast_scoretable();

	}

}

/*
	Send new scores
*/
function broadcast_scoretable() {
	
	var leader = {name: '', frags: 0};
	
	// Scoreboard
	var json = {};
	for(i in users) {
	
		json[i] = {
			id : i,
			frags: users[i].frags,
			deaths: users[i].deaths,
			name : users[i].name
		}
		
		if (leader.frags < users[i].frags) {
			leader.name = users[i].name;
			leader.frags = users[i].frags;
		}
		
	}

	io.sockets.emit('scoretable', json);
	io.sockets.emit('pwnerer', leader);
	
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

/* Disconnect user */
function disconnect(socket) {
	
	if (users[socket.id] != undefined) {

		if (users[socket.id]['timeout'] != undefined) {
			clearTimeout(users[socket.id].timeout);
		}		
		
		delete users[socket.id];
		
	}

}

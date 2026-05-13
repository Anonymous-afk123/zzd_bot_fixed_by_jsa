function deepClone(target) {
	let result;
	if (typeof target === 'object') {
		if (Array.isArray(target)) {
			result = [];
			for (let i in target) {
				result.push(deepClone(target[i]))
			}
		} else if (target === null) {
			result = null;
		} else if (target.constructor === RegExp) {
			result = target;
		} else {
			result = {};
			for (let i in target) {
				result[i] = deepClone(target[i]);
			}
		}
	} else {
		result = target;
	}
	return result;
}
function clone(a) {
	return deepClone(a);
	//	return JSON.parse(JSON.stringify(a));
}
function equal(a, b) {
	return JSON.stringify(a) == JSON.stringify(b);
}
function sign(a) {
	return a === 0 ? 0 : a < 0 ? -1 : 1;
}
function array_erase(a,x){
    let v = a.findIndex((v)=>v===x);
    if (v!==-1){
		for (let i = v; i < a.length - 1; i++)
			a[i]=a[i+1];
		a.pop();
		return true;
	}
	return false;
}
let queue_base = new Array(2000);
class Queue {
    constructor() {
        this.h = this.t = 0; // 修复：这里加了 h 代表 head
    }
    clear() {
        this.h = this.t = 0; // 修复：这里加了 h
    }
    push(x) {
        queue_base[this.t++] = x;
    }
    front() {
        return queue_base[this.h]; // 修复：这里加了 h
    }
    pop() {
        return queue_base[this.h++]; // 修复：这里加了 h
    }
    empty() {
        return this.h == this.t; // 修复：这里加了 h
    }
    size() {
        return this.t - this.h; // 修复：这里加了 h
    }
}
let max = Math.max, min = Math.min, abs = Math.abs, floor = Math.floor, ceil = Math.ceil, pow = Math.pow, random = Math.random, log = Math.log, Eps = 1e-5;
let socket = io('https://ws.generals.io');
let accounts = {
	bot: ['asudhfiou','nimasabibc'],
};
let [user_id, myusername] = ['userid', 'chenzi'], custom_game_id = 'jsahuaehx', user_idANDkey = [user_id, 'sd09fjdZ03i0ejwi_changeme'];
let chat_room, replay_url;
let keep_playing = true, isconnected = false, game_end = true;
let stepdelta = [[0, 1], [0, -1], [1, 0], [-1, 0]];
let TILE_EMPTY = -1, TILE_MOUNTAIN = -2, TILE_FOG = -3, TILE_FOG_OBSTACLE = -4;
let M, E, playerCount, usernames, teams, replay_id, scores = [], stars, turn;
let generals, city_set = [], tmp_cities = [], map = [];
let army, width, height, terrain;
socket.on('disconnect', function () {
	console.error('Disconnected from server.');
	isconnected = false;
	console.log('The replay is at ' + replay_url);
});
socket.on('connect', function () {
	console.log('Connected to server.');
	socket.emit(user_id, myusername,'sd09fjdZ03i0ejwi_changeme');
	isconnected = true;
	playgames();
});
socket.on('game_start', function (data) {
	game_end = false;
	M = data.playerIndex;
	E = M ^ 1;
	replay_id = data.replay_id;
	chat_room = data.chat_room;
	usernames = data.usernames;
	teams = data.teams;
	playerCount = usernames.length;
	if (playerCount > 2) {
		Surrender();
		throw "I can Only play 1v1";
	}
	message_list = [];
	replay_url = 'https://generals.io/replays/' + encodeURIComponent(data.replay_id);
});
socket.on('game_update', function (data) {
	turn = data.turn;
	if (turn === 1)
		stars = data.stars;
	map = patch(map, data.map_diff);
	width = map[0];
	height = map[1];
	generals = data.generals.map((x) => x === -1 ? undefined : [Math.floor(x / width), x % width]);
	let tmp_score = data.scores;
	tmp_score.forEach(({ i, total, tiles, dead }, rank) => {
		scores[i] = { rank, total, tiles, dead };
		if (dead)
			game_end = true;
	});
	let size = width * height;
	tmp_cities = patch(tmp_cities, data.cities_diff);
	city_set = newArray(height, width, false);
	for (i of tmp_cities) {
		let x = Math.floor(i / width);
		let y = i % width;
		city_set[x][y] = true;
	}
	function turn_1d_to_2d(data) {
		let res = [];
		while (data.length > 0) {
			res.push(data.splice(0, width));
		}
		return res;
	}
	army = turn_1d_to_2d(map.slice(2, size + 2));
	terrain = turn_1d_to_2d(map.slice(size + 2, size + 2 + size));
	Gaming();
});
socket.on('game_lost', () => {
	// chat('gg');
	game_end = true;
	leave_game();
});
socket.on('game_won', () => {
	// chat('lol');
	game_end = true;
	leave_game();
});
let message_list = [];
socket.on('chat_message', function (chat_room, data) {
	if (data.username == undefined)
		data.username = "System", data.playerIndex = -1;
	message_list.push(clone(data));
	visualizer.update_messagebox();
});
function join_game(...args) {
	if (isconnected) {
		socket.emit(...args, ...user_idANDkey,null);
		if (args[0] === "join_private") {
			setTimeout(() => {
				set_force_start_for_custom(args[1]);
			}, 1000);
		}
		return "Succeed";
	}
	else {
		console.log('You haven\'t connected to the server.');
		return "Failed";
	}
}
function join_custom(game_id = custom_game_id) {
	return join_game('join_private', game_id);
}
function join_1v1() {
	return join_game('join_1v1');
}
function join_ffa() {
	return join_game('play');
}
function join_2v2(team_name) {
	return join_game('join_team', team_name);
}
function unjoin() {
	socket.emit('cancel');
}
function set_force_start_for_custom(game_id = custom_game_id) {
	if (!game_end)
		return;
	socket.emit('set_force_start', game_id, true);
	setTimeout(() => {
		set_force_start_for_custom(game_id);
	}, 2000);
}
let my_last_move = undefined;
function attack(, t, is50 = false) {
	console.log("attack: ",,t,is50);
	my_last_move = [,t,is50];
	socket.emit('attack', [0] * width + [1], t[0] * width + t[1], is50);
}
function clear_moves() {
	socket.emit('clear_moves');
}
function chat() {
	socket.emit('chat_message', chat_room, );
}
function leave_game() {
	socket.emit('leave_game');
	console.log('The replay is at ' + replay_url);
	playgames();
}
function Surrender() {
	game_end = true;
	socket.emit("surrender");
}
function Stop(){
	keep_playing = false;
	Surrender();
}
function patch(old, diff) {
	let out = [];
	let i = 0;
	while (i < diff.length) {
		if (diff[i]) {  // matching
			Array.prototype.push.apply(out, old.slice(out.length, out.length + diff[i]));
		}
		i++;
		if (i < diff.length && diff[i]) {  // mismatching
			Array.prototype.push.apply(out, diff.slice(i + 1, i + 1 + diff[i]));
			i += diff[i];
		}
		i++;
	}
	return out;
}
function newArray(h, w, v) {
	let a = [], b = [];
	while (w--)
		a.push(clone(v));
	while (h--)
		b.push(clone(a));
	return b;
}
function padstring(s, len, ch = ' ') {
	while (s.length < len) {
		s = s + ch;
		if (s.length < len)
			s = ch + s;
	}
	return s;
}
let player_colors = ["#FF0000", "#0000FF", "#008000", "#f58231", "#f032e6", "#9a6324", "purple", "teal", "#4363d8", "#800000", "#b09f30", "#7ab78c"];
let swamp_background_color = "gray";
let mountain_background_color = "#bbb";
let tidy_backround_color = "#dcdcdc";
let fog_background_color = "#4D4D4D";
let city_background_color = "gray";
let background_color = "#222";
let Image_city = new Image(); Image_city.src = "city.png";
let Image_mountain = new Image(); Image_mountain.src = "mountain.png";
let Image_obstacle = new Image(); Image_obstacle.src = "obstacle.png";
let Image_swamp = new Image(); Image_swamp.src = "swamp.png";
let Image_crown = new Image(); Image_crown.src = "crown.png";
let symbol_cnt = -19260817, ISCITY = symbol_cnt++, ISNT_CITY = symbol_cnt++, UNKNOWN = symbol_cnt++;
let average_army, average_city_army, my_average_army, win_rate;
let canvas, visualizer, history_dataset, las, cur, analyzer;
window.onload = () => {
	canvas = $("#myCanvas")[0].getContext("2d");
	visualizer = new Visualizer();
}
class Run_time_recoder{
	constructor(){
		this.used_time_max = 0;
		this.time_level = [100, 200, 300];
		this.time_reach_cnt = [0,0,0];
		this.all_time_cnt = 0;
	}
	update(now_time){
		if (turn > 10){
			this.used_time_max = max(this.used_time_max, now_time);
			this.all_time_cnt++;
			for (let i = 0; i < 3; i++)
				if (now_time > this.time_level[i])
					this.time_reach_cnt[i]++;
			if (now_time > 300) {
				console.log("Time reached 300 ms!!!!!!!!!!!!!!!!!!!!!!");
			}
		}
		visualizer.color_rectangle(1000,150,500,40,background_color);
		visualizer.puttext(`Time used = ${now_time} ms, max = ${this.used_time_max} ms ([${this.time_reach_cnt}]/${this.all_time_cnt})`,1000,150 + 15,"white");
	}
};
class Visualizer {
	constructor() {
		this.done_message_list = [];
		this.show_filler_result = true;
		this.show_track = true;
		this.show_fog_track = true;
		this.show_my_last_move = true;
		this.offset_head = [40, 40];
		this.initial_offset_messagebox = [1000, 200];
		this.current_offset_messagebox = clone(this.initial_offset_messagebox);
		this.length = 40;
	}
	offset_board() {
		let [offsetx, offsety] = this.offset_head;
		offsety += (playerCount + 2) * 21 + 20;
		return [offsetx, offsety];
	}
	color_rectangle(x, y, w, h, color, alpha = 1) {
		canvas.globalAlpha = alpha;
		canvas.fillStyle = color;
		canvas.fillRect(x, y, w, h);
		canvas.globalAlpha = 1;
	}
	puttext(, x, y, color, style = "normal 12px consolas") {
		canvas.font = style;
		canvas.fillStyle = color;
		canvas.fillText(, x, y);
	}
	draw_triangle(x0, y0, x1, y1, x2, y2, color, alpha) {
		canvas.fillStyle = color;
		canvas.globalAlpha = alpha;
		canvas.beginPath();
		canvas.moveTo(x0, y0);
		canvas.lineTo(x1, y1);
		canvas.lineTo(x2, y2);
		canvas.closePath();
		canvas.fill();
		canvas.globalAlpha = 1;
	}
	draw_border([i,j],color,size = 2,alpha = 1){
		let [offsetx, offsety] = this.offset_board(), len = this.length;
		let x = offsetx + j * (len + 1), y = offsety + i * (len + 1);
		canvas.globalAlpha = alpha;
		this.color_rectangle(x, y, size, len, color);
		this.color_rectangle(x, y, len, size, color);
		this.color_rectangle(x + len - size, y, size, len, color);
		this.color_rectangle(x, y + len - size, len, size, color);
		canvas.globalAlpha = 1;
	}
	setheads() {
		let [offsetx, offsety] = this.offset_head, x, y;
		x = offsetx, y = offsety;
		this.color_rectangle(x, y, 100, 20, "white"); this.puttext(padstring('Turn: ' + Math.floor(turn / 2).toString() + ',' + (turn % 2).toString(), 15), x, y + 15, "black");
		offsety += 21;
		x = offsetx, y = offsety;
		this.color_rectangle(x, y, 50, 20, "white"); this.puttext(padstring('★', 8), x, y + 15, "gold"); x += 51;
		this.color_rectangle(x, y, 140, 20, "white"); this.puttext(padstring('Player', 23), x, y + 15, "black"); x += 141;
		this.color_rectangle(x, y, 70, 20, "white"); this.puttext(padstring('Army', 11), x, y + 15, "black"); x += 71;
		this.color_rectangle(x, y, 50, 20, "white"); this.puttext(padstring('Land', 9), x, y + 15, "black"); x += 51;
		this.color_rectangle(x, y, 70, 20, "white"); this.puttext(padstring("ΔArmy", 11), x, y + 15, "black"); x += 71;
		this.color_rectangle(x, y, 50, 20, "white"); this.puttext(padstring("city", 9), x, y + 15, "black"); x += 51;
		for (let i = 0; i < playerCount; i++) {
			offsety += 21;
			x = offsetx, y = offsety;

			this.color_rectangle(x, y, 50, 20, "white");
			this.puttext(padstring('★' + stars[i].toString(), 8), x, y + 15, "black");
			this.puttext(padstring('★' + padstring('', stars[i].toString().length), 8), x, y + 15, "gold");
			x += 51;

			this.color_rectangle(x, y, 140, 20, player_colors[i]); this.puttext(padstring(usernames[i], 23), x, y + 15, "white"); x += 141;
			this.color_rectangle(x, y, 70, 20, "white"); this.puttext(padstring(cur.total_army[i].toString(), 11), x, y + 15, "black"); x += 71;
			this.color_rectangle(x, y, 50, 20, "white"); this.puttext(padstring(cur.land[i].toString(), 9), x, y + 15, "black"); x += 51;
			this.color_rectangle(x, y, 70, 20, "white"); this.puttext(padstring(cur.delta_army[i].toString(), 11), x, y + 15, "black"); x += 71;
			this.color_rectangle(x, y, 50, 20, "white"); this.puttext(padstring(cur.city_cnt[i].toString(), 9), x, y + 15, "black");
		}
	}
	setboard() {
		let [offsetx, offsety] = this.offset_board();
		this.color_rectangle(offsetx, offsety, (this.length + 1) * width, (this.length + 1) * height, fog_background_color);
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				let x = offsetx + j * (this.length + 1), y = offsety + i * (this.length + 1);
				function get_color() {
					if (terrain[i][j] === TILE_FOG || terrain[i][j] === TILE_FOG_OBSTACLE)
						return fog_background_color;
					else if (terrain[i][j] === TILE_MOUNTAIN)
						return mountain_background_color;
					else if (terrain[i][j] === TILE_EMPTY)
						return city_set[i][j] ? city_background_color : tidy_backround_color;
					else
						return player_colors[terrain[i][j]];
				}
				this.color_rectangle(x, y, this.length, this.length, get_color());
				if (cur.confirmed_color[i][j] !== -1)
					this.color_rectangle(x, y, this.length, this.length, player_colors[cur.confirmed_color[i][j]], 0.3);
				let args = [x + 5, y + 5, this.length - 10, this.length - 10];
				if (terrain[i][j] === TILE_FOG_OBSTACLE && !cur.visited[i][j])
					canvas.drawImage(Image_obstacle, ...args);
				else if (is_confirmed_mountain([i, j]))
					canvas.drawImage(Image_mountain, ...args);
				else if (cur.type[i][j] == ISCITY)
					canvas.drawImage(Image_city, ...args);
				else if (cur.generals.findIndex(x => x != undefined && x[0] == i && x[1] == j) != -1)
					canvas.drawImage(Image_crown, ...args);
				this.puttext(padstring(army[i][j] > 0 ? army[i][j].toString() : '', 7), x, y + 25, "white");
				if (this.show_filler_result && terrain[i][j] < -2 && curfiller.terrain[i][j] == E) {
					this.color_rectangle(x, y, this.length, this.length, player_colors[E], 0.3);
					this.puttext(padstring(curfiller.army[i][j] > 0 ? curfiller.army[i][j].toString() : '', 7), x, y + 25, "white");
				}
				this.puttext(i.toString() + ',' + j.toString(), x, y + 10, "black", "normal 8px consolas");
			}
	}
	clear_messagebox() {
		this.done_message_list = [];
		// console.log(message_list, this.done_message_list);
		let [x, y] = this.initial_offset_messagebox;
		this.color_rectangle(x, y, 1000, 1000, background_color);
		this.current_offset_messagebox = clone(this.initial_offset_messagebox);
	}
	newmessage(msg) {
		let [x, y] = this.current_offset_messagebox;
		let length_of_name = 6 * (msg.username.length + 3);
		this.color_rectangle(x, y, length_of_name, 20, msg.playerIndex == -1 ? background_color : player_colors[msg.playerIndex]);
		this.puttext(' ' + msg.username + ' ', x, y + 15, "white");
		x += length_of_name;
		this.puttext(": " + msg.text, x, y + 15, "white", "normal 12px consolas");
		this.current_offset_messagebox[1] += 25;
	}
	update_messagebox() {
		while (this.done_message_list.length < message_list.length) {
			this.newmessage(message_list[this.done_message_list.length]);
			this.done_message_list.push(message_list[this.done_message_list.length]);
		}
	}
	initialize() {
		this.color_rectangle(0, 0, 1000, 3000, background_color);
		this.clear_messagebox();
	}
	update() {
		this.setheads();
		this.setboard();
		this.update_messagebox();
	}
	draw_move(m, alpha, color = "black", move_cnt = undefined) {
		if (m == undefined)
			return;
		let [[x1, y1], [x2, y2]] = m;
		if (abs(x1 - x2) + abs(y1 - y2) !== 1 || is_confirmed_mountain([x1, y1]) || is_confirmed_mountain([x2, y2]))
			throw "invalid move";
		let [y, x] = this.offset_board(), len = 40;
		x += (len + 1) * x1, y += (len + 1) * y1;
		if (x1 + 1 == x2) {
			this.draw_triangle(y + 2, x + len - 5, y + len + 1 - 2, x + len - 5, y + len / 2, x + len + 1 + 5, color, alpha);
			if (move_cnt != undefined)
				this.puttext(padstring(move_cnt.toString(), 8), y + 4, x + len, "white", "normal 8px consolas");
		}
		else if (x1 - 1 == x2) {
			x -= len + 1;
			this.draw_triangle(y + 2, x + len + 1 + 5, y + len + 1 - 2, x + len + 1 + 5, y + len / 2, x + len - 5, color, alpha);
			if (move_cnt != undefined)
				this.puttext(padstring(move_cnt.toString(), 8), y + 4, x + len, "white", "normal 8px consolas");
		}
		else if (y1 + 1 == y2) {
			this.draw_triangle(y + len - 5, x + 2, y + len - 5, x + len + 1 - 2, y + len + 1 + 5, x + len / 2, color, alpha);
			if (move_cnt != undefined)
				this.puttext(padstring(move_cnt.toString(), 4), y + len - 5, x + len / 2 - 1, "white", "normal 6px consolas");
		}
		else if (y1 - 1 == y2) {
			y -= len + 1;
			this.draw_triangle(y + len + 1 + 5, x + 2, y + len + 1 + 5, x + len + 1 - 2, y + len - 5, x + len / 2, color, alpha);
			if (move_cnt != undefined)
				this.puttext(padstring(move_cnt.toString(), 4), y + len - 5, x + len / 2 - 1, "white", "normal 6px consolas");
		}
	}
	visual_moves(moves) {
		//	console.log(moves);
		for (let m of moves) {
			this.draw_move(m.move, 0.8, "black", m.ishalf ? floor(m.army / 2) : m.army - 1);
		}
	}
	visual_non_confirmed_tiles() {
		let [offsety, offsetx] = this.offset_board(), len = this.length;
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				if (analyzer.confirmed[i][j] !== 0) {
					let x = offsetx + i * (len + 1), y = offsety + j * (len + 1);
					this.color_rectangle(y + len / 2 - 2, x + len / 2 - 2, 4, 4, player_colors[E], 0.5);
				}
	}
	visual_targets() {
		let targets = guide.targets;
		for (let k = targets.length - 1; k >= 0; k--) {
			this.draw_border(targets[k],k == 0 ? "#00FF00" : "gold",2,1 - k * (0.8 / targets.length));
		}
	}
	visual_gather_path(){
		let path = gather.path;
		for (let i = 0; i < path.length - 1; i++){
			this.draw_move([path[i],path[i+1]],0.3);
		}
	}
	visual_track(track){
		if (track == undefined)
			return;
		let [x,y] = track;
		if (!analyzer.army_id[x][y])
			return;
		let id =analyzer.army_id[x][y];
		while (1){
			let [i,j] = analyzer.army_path[id][3];
			// console.log(i,j);
			this.draw_border([i,j],"white",2,1);
			if (!analyzer.army_path[id][0])
				break;
			id=analyzer.army_path[id][0];
		}
	}
	visual_fog_track(){
		let [offsetx, offsety] = this.offset_board(), len = this.length;
		for (let i=0;i<height;i++)
			for (let j=0;j<width;j++){
				if (cur.terrain[i][j]>=-2||!chk1([i,j]))
					continue;
				let x = offsetx + j * (len + 1), y = offsety + i * (len + 1);
				let sum=0;
				for (let v of analyzer.army_track[i][j]){
					if (isNaN(v))
						console.log(v);
					sum+=analyzer.army_remain[v];
				}
				if (sum > 0)
					this.puttext(sum.toString(),x+3,y+len-9,"cyan","normal 12px consolas");
			}
	}
	visual_locked(){
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++){
				if (defender.lock[i][j]){
					let [offsetx, offsety] = this.offset_board(), len = this.length;
					let x = offsetx + j * (len + 1), y = offsety + i * (len + 1);
					this.color_rectangle(x,y,len,len,"yellow",0.2);
				}
			}
	}
	visual_my_last_move(){
		if (!this.show_my_last_move || my_last_move == undefined)
			return;
		let [s,t,is50] = my_last_move;
		this.draw_move([s,t],0.8,"purple",is50 ? 50 : undefined);
	}
	visual_win_rate(){
		this.color_rectangle(500,40,120,100,background_color);
		this.puttext(`win_rate = ${win_rate.toFixed(3)}`, 500, 40 + 15, "white");
		let [s, color] = win_rate > 0.53 ? ["优", "lightgreen"] : 
						 win_rate > 0.47 ? ["平", "white"] : 
						 win_rate > 0.42 ? ["劣", "orange"] : 
						 				   ["危", "red"];
		this.puttext(s,500,120,color,"normal 50px consolas");
	}
	visual_status(s,color = "white"){
		this.color_rectangle(650,40,120,100,background_color);
		this.puttext(s,650,120,color,"normal 50px consolas");
	}
	visual_target_city(){
		if (city_taker.target_city == undefined)
			return;
		let [x, y] = city_taker.target_city;
		this.draw_border([x,y],"purple",2);
	}
}
function in_board(x, y) {
	return 0 <= x && x < height && 0 <= y && y < width;
}
function is_confirmed_mountain([x, y]) {
	return !in_board(x, y) || terrain[x][y] === TILE_MOUNTAIN || (terrain[x][y] === TILE_FOG_OBSTACLE && cur.type[x][y] === ISNT_CITY);
}
function vectoradd([ax, ay], [bx, by]) {
	return [ax + bx, ay + by];
}
class Dataset {
	abs_army([x,y]){
		return this.terrain[x][y] === M ? this.army[x][y] : -this.army[x][y];
	}
	constructor(a = undefined) {
		this.turn = turn;
		this.terrain = clone(terrain);
		this.army = clone(army);
		this.land = [], this.total_army = [];
		for (let v of scores) {
			this.land.push(clone(v.tiles));
			this.total_army.push(clone(v.total));
		}
		this.type = newArray(height, width, UNKNOWN);
		this.visited = a == undefined ? newArray(height, width, false) : clone(a.visited);
		this.delta_army = [];
		for (let i = 0; i < playerCount; i++)
			this.delta_army.push(this.total_army[i] - (history_dataset.length <= 2 ? 0 : history_dataset[history_dataset.length - 2].total_army[i]));
		this.generals = clone(generals);
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				if (terrain[i][j] >= -2)
					this.visited[i][j] = true;
				if (terrain[i][j] < -2 && army[i][j] != 0)
					throw "terrain[i][j]<0&&armies[i][j]!=0";
				if (city_set[i][j])
					this.type[i][j] = ISCITY;
				else if (terrain[i][j] != TILE_FOG_OBSTACLE)
					this.type[i][j] = ISNT_CITY;
			}
		if (a != undefined) {
			for (let i = 0; i < playerCount; i++)
				if (a.generals[i] != undefined)
					this.generals[i] = clone(a.generals[i]);
			for (let i = 0; i < height; i++)
				for (let j = 0; j < width; j++) {
					if (a.type[i][j] !== UNKNOWN)
						this.type[i][j] = a.type[i][j];
				}
			this.confirmed_color = clone(a.confirmed_color);
		}
		else {
			this.confirmed_color = newArray(height, width, -1);
		}
		for (let i = 0; i < playerCount; i++)
			if (this.generals[i] != undefined) {
				this.type[this.generals[i][0]][this.generals[i][1]] = i;
			}
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				if (this.confirmed_color[i][j] === -1) {
					if (terrain[i][j] >= 0)
						this.confirmed_color[i][j] = terrain[i][j];
				}
				else if (terrain[i][j] === M)
					this.confirmed_color[i][j] = M;
				else
					this.confirmed_color[i][j] = E;
	}
	calc_conquered_city() {
		this.conquered_city = newArray(height, width, false);
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				if (this.confirmed_color[i][j] >= 0 && (this.type[i][j] == ISCITY || this.type[i][j] >= 0)) {
					this.conquered_city[i][j] = true;
				}
			}
	}
	calc_city_cnt(a = undefined) {
		this.city_cnt = [1, 1];
		if (turn % 2 == 1) {
			if (a != undefined)
				this.city_cnt = clone(a.city_cnt);
		}
		else {
			let las = history_dataset[history_dataset.length - 2];
			if (las == undefined || game_end)
				this.city_cnt = clone(a.city_cnt);
			else {
				let flag = false;
				if (!flag) {
					let m = this.moves[M];
					if (m.move != undefined) {
						//						console.log(m);
						let [x, y] = m.move[1];
						if (a.terrain[x][y] < 0 && a.army[x][y] > 0)
							flag = 1;
					}
				}
				if (!flag) {
					let m = a.moves[M];
					if (m.move != undefined) {
						let [x, y] = m.move[1];
						if (las.terrain[x][y] < 0 && las.army[x][y] > 0)
							flag = 1;
					}
				}
				if (flag) {
					this.city_cnt = clone(a.city_cnt);
				}
				else {
					//			console.log(this.terrain,this.type);
					for (let i = 0; i < height; i++)
						for (let j = 0; j < width; j++) {
							//					console.log(i,j);
							if (this.terrain[i][j] == M && this.type[i][j] === ISCITY)
								this.city_cnt[M]++;
						}
//					console.log(this.delta_army);
					this.city_cnt[E] = this.city_cnt[M] - this.delta_army[M] + this.delta_army[E];
//					console.log(this.land);
					if (turn % 50 == 0) {
						this.city_cnt[E] += this.land[M] - this.land[E];
					}
					this.city_cnt[E] = max(this.city_cnt[E], a == undefined ? 1 : a.city_cnt[0] + a.city_cnt[1] - this.city_cnt[M]);
				}
			}
		}
		this.max_city_cnt = clone(this.city_cnt);
		if (a != undefined) {
			for (let i = 0; i < playerCount; i++) {
				this.max_city_cnt[i] = max(this.max_city_cnt[i], a.max_city_cnt[i]);
			}
		}
		this.cland = [];
		this.carmy = [];
		for (let i = 0;i < playerCount;i++){
			this.cland[i] = this.land[i] + 25 * (this.city_cnt[i] - 1);
			this.carmy[i] = this.total_army[i] + 48 * (this.city_cnt[i] - 1);
		}
		win_rate = this.carmy[M] / (this.carmy[M] + this.carmy[E]);
	}
	calc_delta_land(a = undefined){
		this.delta_land = [];
		for (let i = 0; i < playerCount; i++)
			this.delta_land.push(this.land[i] - (a == undefined ? 0 : a.land[i]));
		let  = 0;
		for (let i of this.delta_land)
			 += i;
		if ( < 0 ||  > 2)
			throw "sum of delta_land WA";
		this.explored = a == undefined ? [0, 0] : clone(a.explored);
		if ( == 2){
			for (let i in this.explored)
				this.explored[i]++;
		}
		else {
			let flag = false;
			for (let i = 0; i < height; i++)
				for (let j = 0; j < width; j++){
					if ((a == undefined || a.terrain[i][j] == TILE_EMPTY) && (this.terrain[i][j] == M)){
						flag = true;
					}
				}
			this.explored[flag ? M : E]++;
		}
		this.newexplored=[0,0];
		for (let i=0;i<2;i++)
			this.newexplored[i]=this.explored[i] - (a== undefined?0:a.explored[i]);
	}
	update_comfirmed_colors(){
		let tmp = newArray(height, width, 0);
		for (let move of this.all_moves) {
			if (move[E].move != undefined)
				for (let [x, y] of move[E].move) {
					tmp[x][y]++;
				}
		}
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				if (tmp[i][j] === this.all_moves.length) {
					if (terrain[i][j] == TILE_FOG_OBSTACLE)
						this.type[i][j] = ISCITY;
					if (this.confirmed_color[i][j] === -1 &&
						(this.type[i][j] != ISCITY || this.all_moves.findIndex((a) => equal([i, j], a[E].move[1])) === -1)) {
						this.visited[i][j] = true;
						this.confirmed_color[i][j] = E;
					}
				}
	}
}
function guess_moves(las, cur) {
	//guess the players' moves in the last turn
	//[ undefined|{from,to,ishalf} ,...]
	if (las == undefined)
		return [[{ move: undefined, army: 0, ishalf: 0 }, { move: undefined, army: 0, ishalf: 0 }]];
	las = clone(las);
	cur = clone(cur);
	//	console.log(las);console.log(cur);
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++) {
			if (cur.turn % 50 == 0) {
				if (cur.terrain[i][j] >= 0)
					cur.army[i][j]--;
			}
			if (cur.turn % 2 == 0) {
				if (cur.terrain[i][j] >= 0 && (cur.type[i][j] === ISCITY || cur.type[i][j] >= 0))
					cur.army[i][j]--;
			}
		}
	/*
		变小：己方军队数变少。
		变大：己方军队数变大且颜色变为己方。
		己方：attack(起始点,终止点):
			起始点为某一个变小的点（最多有两个变小的点）；
			若某个点变大了，则必然是终止点。
		敌方：起始点和终止点两者至少一者可见；
			若存在某个点变大了，则必然是终止点。
			若敌方仍未被确定终止点或起始点，则起始点必然在所有DIFF区域两格范围内。
	*/
	//A = me, B = enemy
	let who_first = (cur.turn + 1) % 2;//The player with this index moves first in the last turn
	let AS = [], AT = [];
	let BT = [];
	let diff = newArray(height, width, 0);
	las.cnt = newArray(height, width, 0);
	cur.cnt = newArray(height, width, 0);
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++) {
			las.cnt[i][j] = las.terrain[i][j] === M ? las.army[i][j] : -las.army[i][j];
			cur.cnt[i][j] = cur.terrain[i][j] === M ? cur.army[i][j] : -cur.army[i][j];
		}
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++) {
			if (las.terrain[i][j] !== cur.terrain[i][j] || las.army[i][j] !== cur.army[i][j]) {
				diff[i][j] = max(diff[i][j], cur.terrain[i][j] === M ? 3 : 2);
				if (las.terrain[i][j] !== cur.terrain[i][j]) {
					if (cur.terrain[i][j] === M)
						AT.push([i, j]);
					else if (cur.terrain[i][j] === E) {
						if (las.terrain[i][j] >= -2)
							BT.push([i, j]);
						if (las.cnt[i][j] > 1)
							AS.push([i, j]);
					}
				}
				else {
					if (cur.terrain[i][j] === M) {
						if (cur.cnt[i][j] > las.cnt[i][j])
							AT.push([i, j]);
						if (cur.cnt[i][j] < las.cnt[i][j] && las.cnt[i][j] > 1)
							AS.push([i, j]);
					}
					else {
						if (cur.terrain[i][j] === E && cur.cnt[i][j] < las.cnt[i][j])
							BT.push([i, j]);
					}
				}
			}
		}
	//	console.log(AS);console.log(AT);console.log(BT);
	if (AS.length > 2 || AT.length > 1 || BT.length > 1)
		throw "AS/AT/BT length exceeded";
	for (let _ = 0; _ < 2; _++) {
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				for (let d of stepdelta) {
					let from = [i, j], to = vectoradd(from, d);
					if (is_confirmed_mountain(from) || is_confirmed_mountain(to))
						continue;
					diff[to[0]][to[1]] = max(diff[to[0]][to[1]], diff[from[0]][from[1]] - 1);
				}
			}
	}
	let diff_set = [];
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++)
			if (diff[i][j] > 0)
				diff_set.push([i, j]);
	if (diff_set.length > 50)
		throw "diffset > 50";
	let AM = [undefined], BM = [undefined];
	if (AS.length > 0) {
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				for (let d of stepdelta) {
					let from = [i, j], to = vectoradd(from, d);
					if (is_confirmed_mountain(from) || is_confirmed_mountain(to))
						continue;
					if (AS.findIndex((x) => equal(x, from)) === -1)
						continue;
					if (AT.length > 0 && AT.findIndex((x) => equal(x, to)) === -1)
						continue;
					if (las.cnt[i][j] > 1)
						AM.push([from, to]);
				}
			}
	}
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++)
			for (let d of stepdelta) {
				let from = [i, j], to = vectoradd(from, d);
				if (is_confirmed_mountain(from) || is_confirmed_mountain(to) || diff[i][j] === 0 || diff[to[0]][to[1]] === 0)
					continue;
				if (!(las.terrain[i][j] > -2 && cur.terrain[i][j] > -2) &&
					!(las.terrain[to[0]][to[1]] > -2 && cur.terrain[to[0]][to[1]] > -2) &&
					!(las.terrain[i][j] === E))
					continue;
				if (BT.length > 0 && BT.findIndex((x) => equal(x, to)) === -1)
					continue;
				if (las.terrain[i][j] == E || las.terrain[i][j] < -2)
					BM.push([from, to]);
			}
	function is_obstacle([x, y]) {
		return cur.terrain[x][y] === TILE_FOG_OBSTACLE && cur.type[x][y] == UNKNOWN ? 1 : 0;
	}
	function cmp_isobstacle(x, y) {
		let [s1, t1] = x, [s2, t2] = y;
		let v1 = is_obstacle(s1) + is_obstacle(t1);
		let v2 = is_obstacle(s2) + is_obstacle(t2);
		return v2 - v1;
	}
	AM.sort(cmp_isobstacle), AM.reverse();
	BM.sort(cmp_isobstacle), BM.reverse();
	let c = clone(las.cnt), tmp = clone(las);
	let stack = [];
	//domove&undomove: to calc armyB
	function domove([s, t], ishalf) {
		if (s === undefined || t === undefined)
			return;
		stack.push([s, c[s[0]][s[1]]]);
		stack.push([t, c[t[0]][t[1]]]);
		let d = c[s[0]][s[1]];
		d = ishalf ? parseInt(d / 2) : d - sign(d);
		c[s[0]][s[1]] -= d;
		c[t[0]][t[1]] += d;
	}
	function undomove() {
		while (stack.length > 0) {
			let [[x, y], v] = stack.pop();
			c[x][y] = v;
		}
	}
	//realdomove&reget_tmp: modify tmp.terrain&tmp.army, to get the real situation
	function realdomove([s, t], ishalf, who) {
		if (s === undefined || t === undefined)
			return true;
		stack.push(s);
		stack.push(t);
		let d = tmp.army[s[0]][s[1]];
		if (tmp.terrain[s[0]][s[1]] != who || d <= 1) {
			return false;
		}
		d = ishalf ? floor(d / 2) : d - 1;
		tmp.army[s[0]][s[1]] -= d;
		let [x, y] = t;
		if (tmp.terrain[x][y] === who)
			tmp.army[x][y] += d;
		else if (tmp.terrain[x][y] > -2) {
			tmp.army[x][y] -= d;
			if (tmp.army[x][y] < 0) {
				tmp.army[x][y] = -tmp.army[x][y];
				tmp.terrain[x][y] = who;
			}
		}
		return true;
	}
	function reget_tmp() {
		while (stack.length > 0) {
			let [x, y] = stack.pop();
			tmp.terrain[x][y] = las.terrain[x][y];
			tmp.army[x][y] = las.army[x][y];
		}
	}
	//	console.log(AM,BM,diff);
	let all = [];
	for (let bm of BM)
		for (let am of AM) {//这样排列这两句for循环的顺序是有必要的，因为要保证敌方从未知塔出兵这种情况被靠后考虑。
			let [sa, ta] = am === undefined ? [am, am] : [...am];
			let [sb, tb] = bm === undefined ? [bm, bm] : [...bm];
			for (let ahalf = 0; ahalf < 2; ahalf++)
				for (let bhalf = 0; bhalf < 2; bhalf++) {
					let armyA = sa === undefined ? undefined : las.army[sa[0]][sa[1]];
					let armyB = sb === undefined ? undefined : las.terrain[sb[0]][sb[1]] < -2 ? UNKNOWN : las.army[sb[0]][sb[1]];
					let unknown_tag = 0;
					if (armyB === UNKNOWN) {
						unknown_tag = 1;
						domove([sa, ta], ahalf);
						// sb -> tb
						if (las.terrain[tb[0]][tb[1]] < -2 || cur.terrain[tb[0]][tb[1]] < -2) {
							throw "track armyB failed";
						}
						armyB = c[tb[0]][tb[1]] - cur.cnt[tb[0]][tb[1]];
						if (c[tb[0]][tb[1]] < 0 && las.terrain[tb[0]][tb[1]] != E)
							armyB = (cur.terrain[tb[0]][tb[1]] === E ? cur.army[tb[0]][tb[1]] : -cur.army[tb[0]][tb[1]]) - c[tb[0]][tb[1]];
						armyB = armyB * (bhalf + 1) + 1;
						undomove();
						if (armyB <= 1)
							continue;
						stack.push(sb);
						tmp.terrain[sb[0]][sb[1]] = E;
						tmp.army[sb[0]][sb[1]] = armyB;
					}
					let flag = true;
					if (who_first == M) {
						flag &= realdomove([sa, ta], ahalf, M);
						flag &= realdomove([sb, tb], bhalf, E);
					}
					else {
						flag &= realdomove([sb, tb], bhalf, E);
						flag &= realdomove([sa, ta], ahalf, M);
					}
					if (flag) {
						for (let p of diff_set) {
							let [x, y] = p;
							if (cur.terrain[x][y] < -2) {
								flag &= tmp.terrain[x][y] != M;
							} else if (!equal(p, sb) && las.terrain[x][y] < -2) {
								if (tmp.terrain[x][y] === M)
									throw "oh my god";
							} else {
								flag &= tmp.terrain[x][y] === cur.terrain[x][y]
								if (flag && tmp.army[x][y] !== cur.army[x][y]){
									let ttt = false;
									if (tmp.terrain[x][y] === E && bhalf && unknown_tag && tmp.army[x][y] - 1 === cur.army[x][y]){
										ttt = true;
										armyB--;
									}
									flag &= ttt;
								}
							}
							if (!flag) {
								break;
							}
						}
					}
					if (flag) {
						let res = new Array(2);
						res[M] = { move: am, army: armyA, ishalf: ahalf };
						res[E] = { move: bm, army: armyB, ishalf: bhalf };
						all.push(res);
					}
					reget_tmp();
				}
		}
	if (all.length == 0)
		throw "Didn't find moves";
	return all;
}
function check_visable([x, y]) {
	if (is_confirmed_mountain([x, y]))
		return false;
	if (terrain[x][y] >= -2)
		return false;
	if (terrain[x][y] === TILE_FOG_OBSTACLE /*&& cur.max_city_cnt[E] <= 1*/)
		return false;
	return true;
}
function calc_average_army(){
	my_average_army = max(floor(cur.land[M] / 40 * (1 - min(0.5, (turn % 50 + 1) / cur.land[M])) + 0.3),floor(pow(cur.total_army[M] / cur.land[M], 0.6) / 2)) + 1;
	let fogarmy = cur.total_army[E], fogland = cur.land[E], max_seen_army = 0;
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++)
			if (cur.terrain[i][j] === E){
				fogarmy -= cur.army[i][j];
				fogland --;
				max_seen_army = max(max_seen_army, cur.army[i][j]);
			}
	if (fogland === 0)
		fogarmy = cur.total_army[E], fogland = cur.land[E];
	average_army = max(floor(fogland / 35 * (1 - min(0.5, (turn % 50 + 1) / fogland)) + 0.4),floor(pow(fogarmy / fogland, 0.7) / 2)) + 1;
	average_city_army = floor((floor((turn % 50) / 2) + pow(fogarmy, 0.5)));
}
class Analyzer {
	constructor() {
		this.visible = false;
		this.confirmed = newArray(height, width, 1);
		this.army_track = newArray(height, width, []);
		this.army_id = newArray(height, width, 0);
		this.seen_cnt = newArray(height,width,0);
		this.army_path = [-1];
		this.ids = [];
		this.army_remain = [-1];
		this.show = undefined;
	}
	check_large(a,[x,y]){
		return a.terrain[x][y] === E && a.army[x][y] > this.large_bound;
	}
	check_and_erase(id){
		if (this.army_remain[id] < this.large_bound * 0.7){
			for (let i = 0; i < height; i++)
				for (let j = 0; j < width; j++){
					array_erase(this.army_track[i][j],id);
				}
			array_erase(this.ids,id);
		}
	}
	modify_army(id,delta){
		this.army_remain[id] -= delta;
		this.check_and_erase(id);
	}
	update() {
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				if (terrain[i][j] >= -2 || terrain[i][j] == TILE_FOG_OBSTACLE)
					this.confirmed[i][j] = 0;
				if (terrain[i][j] == E)
					this.visible = true;
			}
		if (cur.generals[E] != undefined) {
			let [x, y] = cur.generals[E];
			for (let i = 0; i < height; i++)
				for (let j = 0; j < width; j++)
					this.confirmed[i][j] = i == x && j == y ? 1 : 0;
		}
		this.block_id = newArray(height, width, 0);
		this.block_id_cnt = 0;
		function visblock(t, p) {
			if (t.block_id[p[0]][p[1]] != 0)
				return;
			t.block_id[p[0]][p[1]] = t.block_id_cnt;
			for (let d of stepdelta) {
				let q = vectoradd(p, d);
				if (check_visable(q)) {
					visblock(t, q);
				}
			}
		}
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j++) {
				if (this.block_id[i][j] == 0 && check_visable([i, j])) {
					this.block_id_cnt++;
					visblock(this, [i, j]);

				}
			}
		}
		let block_contain_enemy = new Array(this.block_id_cnt + 1);
		for (let i in block_contain_enemy)
			block_contain_enemy[i] = false;
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				if (cur.confirmed_color[i][j] === E) {
					for (let d of stepdelta) {
						let [x, y] = vectoradd([i, j], d);
						if (!is_confirmed_mountain([x, y]) && this.block_id[x][y] > 0)
							block_contain_enemy[this.block_id[x][y]] = true;
					}
				}
			}
		if (this.visible) {
			for (let i = 0; i < height; i++)
				for (let j = 0; j < width; j++) {
					if (this.block_id[i][j] > 0 && !block_contain_enemy[this.block_id[i][j]]) {
						this.confirmed[i][j] = 0;
					}
				}
		}
		
		this.seen_cnt = newArray(height,width,0);
		for (let i=0;i<height;i++)
			for (let j=0;j<width;j++){
				if (!chk1([i,j]))
					continue;
				for (let x=i-1;x<=i+1;x++)
					for (let y=j-1;y<=j+1;y++)
						if (!is_confirmed_mountain([x,y]) && cur.terrain[x][y] < -2){
							this.seen_cnt[i][j] += cur.terrain[x][y] === TILE_FOG_OBSTACLE ? 0.5 : 1;
						}
			}
		
		// army_id[x][y] id
		// ids [id...]
		// army_remain [army_cnt]
		// army_path: [pre,army_cnt,turn,[x,y]]
		// army_track[i][j]: [id]
		this.large_bound = my_average_army * (pow(cur.land[E], 0.3) + 1) - 0.5;
		let show = undefined;
		if (cur.moves[E].move == undefined){
			// spread
			let new_track = clone(this.army_track);
			for (let i=0;i<height;i++)
				for (let j=0;j<width;j++){
					if (cur.terrain[i][j]<-2){
						for (let id of this.army_track[i][j]){
							for (let d of stepdelta){
								let [x,y] = vectoradd([i,j],d);
								if (chk1([x,y])){
									if (new_track[x][y].findIndex((a)=>a===id)===-1){
										new_track[x][y].push(id);
									}
								}
							}
						}
					}
				}
			this.army_track = new_track;
		} else {
			let move = cur.moves[E], move_cnt = move.ishalf ? move.army/2 : move.army-1;
			let [[x0,y0],[x1,y1]] = move.move;
//			let checked = newArray(height,width,false);
			if (las.terrain[x1][y1] === M){
				//可能判断错误，因为不知道具体是哪个兵把自己的领地吃掉
				console.log("eat my tile");
				for (let dx=-1;dx<=1;dx++)
					for (let dy=-1;dy<=1;dy++){
						let x2=x1+dx,y2=y1+dy;
						if ((!dx&&!dy)||!chk1([x2,y2])||(x0===x2&&y0===y2))
							continue;
						if (this.army_id[x2][y2] && !this.check_large(cur,[x2,y2])){
							let id = this.army_id[x2][y2];
							this.army_id[x2][y2] = 0;
							this.army_track[x2][y2].push(id);
						}
					}
				if (this.army_id[x0][y0]){
					let id = this.army_id[x0][y0];
					// console.log("!!!!!!!!!!!!!!!!!!!!!!!",id,clone(this.army_id));
					let army1 = move_cnt - las.army[x1][y1];
					if (cur.terrain[x1][y1] === E)
						army1 = cur.army[x1][y1];
					else {
						let mymove = cur.moves[M], my_move_cnt = mymove.ishalf ? mymove.army / 2 : mymove.army - 1;
						if (mymove.move != undefined){
							let [[mx0,my0],[mx1,my1]] = mymove.move;
							if (mx0 === x1 && my0 === y1){
								army1 += my_move_cnt;
							}
						}
					}
					// console.log("army1 = ",army1);
					if (cur.terrain[x1][y1] !== M && army1 > this.large_bound){
						console.log("bbbb");
						if (cur.terrain[x1][y1] !== E){
							this.army_remain[id] = army1;
							this.army_track[x1][y1].push(id);
						}
						else {
							console.log("aaaaaaa");
							let tid = this.army_id[x1][y1] = this.army_path.length;
							this.ids.push(tid);
							this.army_path.push([id,cur.army[x1][y1],turn,[x1,y1]]);
							this.army_remain.push(army1);
						}
					}
					this.army_id[x0][y0] = 0;
				}
			} else {
				if (las.terrain[x0][y0] !== E){
					//fog -> me
					console.log("go me");
					let army1 = move_cnt;
					army1 += las.army[x1][y1];
					if (army1 > this.large_bound){
						let id = this.army_id[x1][y1] = this.army_path.length;
						this.ids.push(id);
						this.army_path.push([0,move_cnt,turn,[x1,y1]]);
						this.army_remain.push(cur.army[x1][y1]);
						if (cur.army[x1][y1] < this.large_bound){
							this.army_id[x1][y1] = 0;
						}
						let tmp = move_cnt;
						for (let d of stepdelta){
							let [i,j] = vectoradd([x1,y1],d);
							if (chk1([i,j]) && las.terrain[i][j] < -2){
								while (tmp > 0 && this.army_track[i][j].length > 0){
									let idt = this.army_track[i][j][this.army_track[i][j].length - 1];
									let d = min(tmp,this.army_remain[idt]);
									tmp-=d;
									this.modify_army(idt,d);
									this.army_path[id][0] = idt;
								}
							}
						}
						if (tmp > this.large_bound){
							this.army_path[id][0] = 0;
						}
					}
				}
				else if (cur.terrain[x1][y1] < -2){
					//go into fog
					console.log("go into fog");
					let army1 = move_cnt;
					let moveM = cur.moves[M], moveM_cnt = moveM.ishalf ? moveM.army/2 : moveM.army-1;
					if (moveM.move != undefined){
						let [[xx0,yy0],[xx1,yy1]] = moveM.move;
						if ((turn + 1) % 2 === M && xx1 === x0 && yy1 == y0){
							army1 -= moveM_cnt;
						}
					}
					if (army1 > this.large_bound){
						let id;
						if (this.army_id[x0][y0]){
							id = this.army_id[x0][y0];
						} else {
							id = this.army_id[x0][y0] = this.army_path.length;
							this.ids.push(id);
							this.army_path.push([0,cur.army[x0][y0],turn-1,[x0,y0]]);
							this.army_remain.push(cur.army[x0][y0]);
						}
						console.log(id);
						for (let d of stepdelta){
							let [x2,y2] = vectoradd([x0,y0],d);
							if (chk1([x2,y2]) && cur.terrain[x2][y2] < -2){
								console.log(x2,y2);
								this.army_track[x2][y2].push(id);
							}
						}
					}
					if (!this.check_large(cur,[x0,y0])){
						this.army_id[x0][y0] = 0;
					}
				} else {
					console.log("go under my sight");
					if (this.check_large(cur,[x1,y1])){
						let id=this.army_id[x1][y1] = this.army_path.length;
						this.ids.push(id);
						this.army_path.push([this.army_id[x0][y0],cur.army[x1][y1],turn,[x1,y1]]);
						this.army_remain.push(cur.army[x1][y1]);
					}
					if (cur.terrain[x0][y0] < -2){
						let id = this.army_id[x0][y0];
						this.army_id[x0][y0] = 0;
						if (id && cur.army[x0][y0] - move_cnt > this.large_bound){
							this.army_track[x0][y0].push(id);
						}
					}
				}
			}
			if (cur.terrain[x1][y1] === E)
				show = [x1,y1];
		}
		// console.log(clone(this.ids),clone(this.army_id),clone(this.army_path),clone(this.army_remain),clone(this.army_track));
		for (let i=0;i<height;i++)
			for (let j=0;j<width;j++){
				if (!this.army_id[i][j]&&this.check_large(cur,[i,j])){
					let id = this.army_id[i][j] = this.army_path.length;
					this.ids.push(id);
					this.army_path.push([0,cur.army[i][j],turn,[i,j]]);
					this.army_remain.push(cur.army[i][j]);
					let tmp = cur.army[i][j];
					while (tmp > 0 && this.army_track[i][j].length > 0){
						let idt = this.army_track[i][j][this.army_track[i][j].length - 1];
						let d = min(tmp,this.army_remain[idt]);
						tmp-=d;
						this.army_path[id][0] = idt;
						this.modify_army(idt,d);
					}
					if (tmp > this.large_bound){
						this.army_path[id][0] = 0;
					}
				} else if (this.army_id[i][j]&&!this.check_large(cur,[i,j])){
					console.log(i,j);
					let id = this.army_id[i][j];
					let moveM = cur.moves[M], moveM_cnt = moveM.ishalf ? moveM.army/2 : moveM.army-1;
					this.army_remain[id] = cur.terrain[i][j] === E ? cur.army[i][j] : 0;
					this.check_and_erase(id);
					this.army_id[i][j] = 0;
				}
			}
		//clear_seen
		for (let i=0;i<height;i++)
			for (let j=0;j<width;j++){
				if (cur.terrain[i][j] >= -2)
					// console.log(i,j);
					this.army_track[i][j] = [];
					if (cur.terrain[i][j] === M){
						this.army_id[i][j] = 0;
					}
			}
		this.show = show;
		console.log("analyzer:", {
			ids: clone(this.ids),
			army_id: clone(this.army_id),
			army_path: clone(this.army_path),
			army_remain: clone(this.army_remain),
			army_track: clone(this.army_track)
		});
		this.source_cnt = newArray(height,width,0);
		for (let i in this.army_path)
			if (i > 0){
				let [x,y] = this.army_path[i][3];
				if (!this.army_path[i][0])
					this.source_cnt[x][y]++;
			}
	}
}
function get_distance(s, chk) {
	for (let i of s)
		if (!chk(i))
			throw "!chk(s)";
	let dis = newArray(height, width, false), Q = new Queue();
	for (let [x, y] of s) {
		dis[x][y] = 0;
		Q.push([x, y]);
	}
	while (!Q.empty()) {
		let [x, y] = Q.pop();
		for (let d of stepdelta) {
			let [i, j] = vectoradd([x, y], d);
			if (chk([i, j]) && dis[i][j] === false) {
				dis[i][j] = dis[x][y] + 1;
				Q.push([i, j]);
			}
		}
	}
	return dis;
}
let dis1;
function chk1([x, y]) {
	return !is_confirmed_mountain([x, y]) && ((terrain[x][y] != TILE_FOG_OBSTACLE && cur.type[x][y] !== ISCITY) || cur.confirmed_color[x][y] !== -1);
}
let chk1_result = undefined;
function get_distances() {
	let flag = false;
	let las = history_dataset[history_dataset.length - 1];
	if (las != undefined) {
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				if (las.conquered_city[i][j] != cur.conquered_city[i][j])
					flag = true;
		if (!flag)
			return;
	}
	if (chk1_result == undefined) {
		chk1_result = newArray(height, width, false);
		dis1 = newArray(height, width, undefined);
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				dis1[i][j] = newArray(height, width, false);
	}
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++) {
			chk1_result[i][j] = chk1([i, j]);
		}
	for (let i = 0; i < height; i++)
		for (let j = 0; j < width; j++) {
			if (!chk1_result[i][j])
				continue;
			let [sx, sy] = [i, j];
			for (let a = 0; a < height; a++)
				for (let b = 0; b < width; b++)
					dis1[i][j][a][b] = false;
			let Q = new Queue();
			dis1[i][j][i][j] = 0;
			Q.push([i, j]);
			while (!Q.empty()) {
				let [x, y] = Q.pop();
				for (let d of stepdelta) {
					let i = x + d[0], j = y + d[1];
					if (0 <= i && i < height && 0 <= j && j < width && chk1_result[i][j] && dis1[sx][sy][i][j] === false) {
						dis1[sx][sy][i][j] = dis1[sx][sy][x][y] + 1;
						Q.push([i, j]);
					}
				}
			}
		}
}
class Filler {
	constructor() {
		let vis = newArray(height, width, false);
		this.terrain = clone(cur.terrain);
		this.army = clone(cur.army);
		let seen_tiles = [];
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				if (terrain[i][j] === M) {
					seen_tiles.push([i, j]);
				}
		let dis = get_distance(seen_tiles, chk1);
		let Q = new Queue();
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				if (chk1([i, j])) {
					dis[i][j] = pow(dis[i][j], 1);
				}
				if (cur.confirmed_color[i][j] === E) {
					vis[i][j] = 0;
					Q.push([i, j]);
				}
			}
		let tlen = Q.size(), cnt = 0;
		while (!Q.empty() && cnt < cur.land[E]) {
			//			console.log(Q);
			let [x, y] = Q.pop();
			if (Q. > tlen) {
				if (dis[x][y] < vis[x][y] / 2) {
					continue;
				}
			}
			cnt++;
			if (this.terrain[x][y] !== E) {
				this.army[x][y] = this.terrain[x][y] == TILE_FOG_OBSTACLE || (this.terrain[x][y] == TILE_FOG && cur.type[x][y] == E) ? average_city_army : average_army;
				this.terrain[x][y] = E;
			}
			for (let d of stepdelta) {
				let [X, Y] = vectoradd([x, y], d);
				if (!is_confirmed_mountain([X, Y]) && vis[X][Y] === false && this.terrain[X][Y] === TILE_FOG
					&& (analyzer.confirmed[X][Y] !== 0 || cur.generals[E] != undefined)) {
					vis[X][Y] = vis[x][y] + 1;
					Q.push([X, Y]);
				}
			}
		}
	}
}
class Guide {
	//It's used to find targets
	constructor() {
		this.clear_range = 4;
		this.targets = [];
		this.score = newArray(height, width, 0);
		if (cur.generals[E] != undefined) {
			let [x, y] = cur.generals[E];
			this.score[x][y] += 1e10;
		}
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++) {
				if (cur.type[i][j] === ISCITY && cur.confirmed_color[i][j] === E) {
					this.score[i][j] += 1e6;
				}
				if (curfiller.terrain[i][j] == E) {
					this.score[i][j] += 5 * curfiller.army[i][j];
				} else if ((curfiller.terrain[i][j] < -2 && curfiller.terrain[i][j] !== TILE_FOG_OBSTACLE) || curfiller.terrain[i][j] === TILE_EMPTY) {
					this.score[i][j] += 1;
				}
			}
		let bonus = newArray(height,width,0);
		let [kx,ky] = cur.generals[M];
		for (let i=0;i<height;i++)
			for (let j=0;j<width;j++)
				for (let dx=-3;dx<=3;dx++)
					for (let dy=-3;dy<=3;dy++){
						let x = i + dx, y = j + dy;
						if (chk1([x,y])&&(dis1[i][j][x][y] !== false && dis1[i][j][x][y]<=3)){
							bonus[i][j]+=analyzer.source_cnt[x][y] * pow(0.8,dis1[i][j][x][y]) * average_army * 15;
						}
					}
		this.bakeval = clone(this.score);
		let mycrown = cur.generals[M];
		for (let stage = 0; stage < 3; stage++) {
			let p = undefined, pv = -1e15;
			if (cur.generals[E] != undefined){
				p = clone(cur.generals[E]);
				pv = 1e15;
			}
			else {
				for (let i = 0; i < height; i++)
					for (let j = 0; j < width; j++) {
						if (!chk1([i, j]) || terrain[i][j] === M || dis1[i][j][mycrown[0]][mycrown[1]] === false)
							continue;
						if (stage === 0 && curfiller.terrain[i][j] === TILE_EMPTY){
							continue;
						}
						let sum = 0;
						for (let x = 0; x < height; x++)
							for (let y = 0; y < width; y++) {
								if (!chk1([x, y]) || dis1[i][j][x][y] === false)
									continue;
								if ((stage || analyzer.confirmed[x][y] === 1) || (cur.terrain[x][y] === E && cur.conquered_city[x][y]))
									sum += (this.score[x][y] + (stage === 0 ? bonus[x][y] : 0)) * pow(1 / (dis1[i][j][x][y] + 1), 0.5);
								if (terrain[x][y] === M) {
									sum -= average_army / 2 * pow(0.9, dis1[i][j][x][y]);
								}
							}
						if (sum > pv) {
							p = [i, j];
							pv = sum;
						}
					}
			}
			if (p == undefined)
				break;
			this.targets.push(clone(p));
			this.clear_region(clone(p), this.clear_range);
		}
		this.score = clone(this.bakeval);
		// console.log(this.targets);
	}
	clear_region([sx, sy], dis) {
		let vis = newArray(height, width, false);
		let Q = new Queue();
		vis[sx][sy] = 0;
		Q.push([sx, sy]);
		while (!Q.empty()) {
			let [x, y] = Q.pop();
			this.score[x][y] = -1;
			if (vis[x][y] == dis) {
				continue;
			}
			for (let d of stepdelta) {
				let [i, j] = vectoradd([x, y], d);
				if (chk1([i, j])) {
					vis[i][j] = vis[x][y] + 1;
					Q.push([i, j]);
				}
			}
		}
	}
}
function expand(){
	/*
		target: A good expand function won't fall into a partly optimal solution!

		从局部较优解开始，尝试优化。

		第一目标：扩地效率
		其他目标：{
			方式：估价
			关键点：target
					兵力
		}

		解的形式：{
			树形的兵力集中，路径型的兵力推进
			分多组，路径可能曲折
		}
		构造初始解： {
			分多个回合，每回合计算最优需求
			50 * ()
		}

		解的优化方式：{
			优化次数？10
			
			找一个兵力冗余点{
				对于所有周围没有需求点的终止点，按照集兵块和其他需求点之间的距离以及兵力排序依次考虑每个方案
			}
			，找出与其相关的 树形方案，ban 掉兵力推进部分，重新搜索一条路{
				//重搜方式：再次寻找目标                   缺点：再次掉入局部最优解     ：不靠谱
				重搜方式：从连通块开始搜索路径            缺点：可能会被非最短路径打爆 ： 可能很强的特判：在走完最短路之后再走不要求最短路的一步（只要不是调头）
				
				将这部分ban掉的区域先分享给其他兵力，预处理掉；

				找到候选路之后，操作时间耗尽，或操作时间不足，但候选路仍然可以直接吃接下来的目标，那么考虑和方案的其他部分的低效操作做取舍：{
					什么是一个方案的低效部分？

					对于一个方案，我们每次取其树部分的兵力最少的叶子，直到导致需求推进减少。
					这个减少的推进除以去除的叶子数即效率，显然这些叶子很低效；（注意这不一定是最低效部分，但一定是较低效部分）

					注意，当操作时间不足时，还可以砍当前树的叶子，注意，可能需要对当前树的效率做出一些判断（万一这个树的效率很低就会影响优化效果），但是这样的话；
				}
			}
			O(height * width)

			方案价值：方案是不包含王城后期增兵考虑的，后期增兵临时计算
		}

		定义 源 表示 王城 或 塔

		执行时，优先处理非源需求：
			如果有非源需求，则优先处理非源需求中最高效的{
				找最高效的一组策略，并找最高效的一个叶子
			}
		否则：仅有源：
			多源：优先处理最高效的
			单源：需要计算多条线路
	*/
	

}
function autoplay() {
	let choice = undefined, evaluate = -1e15, remain_turns = 50 - turn % 50;
	// len/gained_army/gained_land/delta_dis
	let targets_scores = [1.0, 0.8, 0.7, 0.6, 0.5];
	function Evaluate(cost_turn, gained_land, gathered_army, max_target = 0) {
		gathered_army = max(gathered_army,0);
		if (gained_land === 0)
			return -1e18;
		return (gained_land * (60 - remain_turns) * 2
			+ pow(gathered_army,0.8) * (remain_turns + 30) / 50 //* max_target // / pow(50 - remain_turns,0.5)
			+ max_target * (remain_turns + 5) * (!analyzer.visible ? 0.1 : 1))
			/ pow(cost_turn, (200 - remain_turns) / 180);
	}
	{
		let gained_army = newArray(height, width, 0);
		let gained_land = newArray(height, width, 0);
		let gathered_army = newArray(height, width, 0);
		let large_army = newArray(height, width, 0);
		let first_step = newArray(height, width, undefined);
		let large_bound = 5 * my_average_army + 3;
		for (let sx = 0; sx < height; sx++)
			for (let sy = 0; sy < width; sy++) {
				if (terrain[sx][sy] !== M || army[sx][sy] <= 1)
					continue;
				// console.log("s: ",sx,sy);
				for (let i = 0; i < height; i++)
					for (let j = 0; j < width; j++) {
						gained_army[i][j] = gained_land[i][j] = gathered_army[i][j] = large_army[i][j] = -1e4;
						first_step[i][j] = undefined;
					}
				gained_army[sx][sy] = army[sx][sy];
				gathered_army[sx][sy] = army[sx][sy] - 1;
				gained_land[sx][sy] = 0;
				large_army[sx][sy] = 0;
				if (cur.terrain[sx][sy] === M && cur.army[sx][sy] > large_bound){
					large_army[sx][sy] += cur.army[sx][sy];
				}
				if (cur.conquered_city[sx][sy]) {
					gathered_army[sx][sy] -= my_average_army * 2;
				}
				let Q = new Queue();
				Q.push([sx, sy]);
				while (!Q.empty()) {
					let [x, y] = Q.pop();
					if (dis1[sx][sy][x][y] > remain_turns)
						break;
					if (first_step[x][y] != undefined) {
						let cost_turn = dis1[sx][sy][x][y];
						let max_target = 0;
						for (let i in guide.targets) {
							let [a, b] = guide.targets[i];
							let delta_dis = dis1[sx][sy][a][b] - dis1[x][y][a][b];
							max_target = max(max_target, delta_dis * targets_scores[i] * (30 - dis1[x][y][a][b]) / 20);
						}
						// max_target *= pow(large_army[x][y] / my_average_army + 1, 0.6);
						let val = Evaluate(cost_turn, gained_land[x][y], gathered_army[x][y], max_target);
						if (val > evaluate) {
							choice = first_step[x][y];
							evaluate = val;
						}
					}
					else if (x !== sx || y !== sy)
						continue;
					for (let d of stepdelta) {
						let [i, j] = vectoradd([x, y], d);
						if (chk1([i, j]) && !(defender.lock[x][y]&&!defender.lock[i][j]) && dis1[sx][sy][x][y] + 1 === dis1[sx][sy][i][j]) {
							if (first_step[i][j] == undefined) {
								Q.push([i, j]);
							}
							let gland = gained_land[x][y] + (curfiller.terrain[i][j] === E ? 2.2 : curfiller.terrain[i][j] !== M ? 1 : 0);
							let garmy = gained_army[x][y] - 1, gatherarmy = gathered_army[x][y];
							let army = curfiller.army[i][j];
							if (curfiller.terrain[i][j] >= 0 && cur.conquered_city[i][j]) {
								army += floor((turn - 1 + dis1[sx][sy][i][j]) / 2) - floor(turn / 2);
							}
							if (curfiller.terrain[i][j] === M)
								garmy += army, gatherarmy += army - 1;
							else
								garmy -= army;
							if (garmy <= 0)
								continue;
							if (curfiller.terrain[i][j] === E) {
								if (cur.type[i][j] === ISCITY)
									gland += 30;
								else if (cur.type[i][j] === E)
									gland += 1e10;
							}
							else if (curfiller.terrain[i][j] === M) {
								if (cur.conquered_city[i][j]) {
									gatherarmy -= my_average_army * 2;
								}
							}
							if (curfiller.terrain[i][j] !== M){
								gland += 0.05 * min(4,analyzer.seen_cnt[i][j]);
							}
							if (curfiller.army[sx][sy] >= analyzer.large_bound && x === sx && y === sy){
								let E_large_bound = curfiller.army[sx][sy] / 2;
								if (curfiller.terrain[i][j] === E && 
											(!cur.conquered_city[i][j] || curfiller.army[i][j] >= curfiller.army[sx][sy]) && 
											curfiller.army[i][j] > E_large_bound){
									gland -= min(1, (50 - turn % 50) * 0.05) * min(1, curfiller.army[x][y] / curfiller.army[sx][sy]);
								}
								for (let d of stepdelta){
									let [a, b] = vectoradd([i, j], d);
									if (chk1([a, b]) && curfiller.terrain[a][b] === E && 
												(!cur.conquered_city[a][b] || curfiller.army[a][b] >= curfiller.army[sx][sy]) && 
												curfiller.army[a][b] > E_large_bound){
										gland -= min(1, (50 - turn % 50) * 0.05) * min(1, curfiller.army[a][b] / curfiller.army[sx][sy]);
									}
								}
							}
							if (gland > gained_land[i][j] || (gland === gained_land[i][j] && gatherarmy > gathered_army[i][j])) {
								gained_land[i][j] = gland;
								gained_army[i][j] = garmy;
								gathered_army[i][j] = gatherarmy;
								large_army[i][j] = large_army[x][y];
								if (cur.terrain[x][y] === M)
									large_army[i][j] += cur.army[x][y] > large_bound ? cur.army[x][y] : 0;
								first_step[i][j] = first_step[x][y] == undefined ? [[x, y], [i, j]] : first_step[x][y];
							}
						}
					}
				}
			}
	}
	console.log("autoplay: ", choice);
	if (choice != undefined){
		attack(...choice);
		visualizer.visual_status('扩');
	}
}
class Gather{
	constructor(){
		this.S = generals[M];
		this.path = [];
		this.gather_end = false;
		this.remain_turns = 7;
	}
	simple_gather() {

		let near_space = newArray(height,width,0);
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++){
				if (cur.terrain[i][j] !== M)
					continue;
				for (let d of stepdelta){
					let [x,y] = vectoradd([i,j],d);
					if (chk1([x,y]) && cur.terrain[x][y] !== M){
						if (cur.army[i][j] - 1 > cur.army[x][y])
							near_space[i][j]++;
						if (cur.terrain[x][y] === E && cur.army[x][y] >= 3)
							near_space[i][j]++;
					}
				}
			}


		this.remain_turns = analyzer.visible || city_taker.should_or_not ? 7 : 50;
		let [sx, sy] = this.S, [tx, ty] = guide.targets[0];
		if (this.gather_end  || turn % 50 >= 45 || terrain[sx][sy] !== M || army[sx][sy] <= 1 || dis1[sx][sy][tx][ty] <= 5){
			this.path = [];
			this.gather_end = turn % 50 >= 10;
			return false;
		}
		let is_expand_monster = (50 - turn % 50 - dis1[sx][sy][tx][ty]) * 1.5 < cur.cland[E] - cur.cland[M] && turn % 50 > 25;
		if (50 - turn % 50  - dis1[sx][sy][tx][ty] <= this.remain_turns || is_expand_monster){
			if (is_expand_monster)
				console.log('expand monster');
			if (!equal(this.S,this.path[0]))
				this.path = clone(this.path.slice(1));
			if (this.path.length < 2 || (defender.lock[sx][sy] && !defender.lock[this.path[1][0]][this.path[1][1]])){
				this.path = [];
				this.gather_end = turn % 50 >= 20;
				return false;
			}
			console.log("gather: keep rush");
			attack(this.path[0],this.path[1]);
			visualizer.visual_status(is_expand_monster ? '怪' : '迫', 'yellow');
			this.S = this.path[1];
			return true;
		}
		let disS = dis1[sx][sy], disT = dis1[tx][ty];
		let sum_army = newArray(height, width, -1e4), previous = newArray(height, width, undefined);
		let vis = newArray(height, width, false);
		let Q = new Queue();
		Q.push([sx, sy]);
		sum_army[sx][sy] = army[sx][sy] - 1;
		vis[sx][sy] = true;
		while (!Q.empty()) {
			let [x, y] = Q.pop();
			for (let d of stepdelta) {
				let [i, j] = vectoradd([x, y], d);
				if (chk1([i, j]) && disT[i][j] == disT[x][y] - 1) {
					if (!vis[i][j])
						vis[i][j] = true, Q.push([i, j]);
					let a = sum_army[x][y] + (curfiller.terrain[i][j] == M ? 1 : -1) * curfiller.army[i][j] - 1;
					if (curfiller.terrain[i][j] === M){
						if (curfiller.army[i][j] <= 1)
							a -= 1.1;
						a -= 0.5 * min(near_space[i][j], 2.5);
					}
					if (a > sum_army[i][j]) {
						sum_army[i][j] = a;
						previous[i][j] = [x, y];
					}
				}
			}
		}
		if (previous[tx][ty] == undefined)
			return false;
		let path = [], inpath = newArray(height, width, false);
		for (let [i, j] = [tx, ty]; ; [i, j] = previous[i][j]) {
			path.push([i, j]);
			inpath[i][j] = true;
			if (dis1[sx][sy][i][j] === 0)
				break;
		}
		let dis = get_distance(path, chk1);
		sum_army = newArray(height, width, -1e4);
		let large_army = newArray(height,width,0);
		let real_dis = newArray(height,width,0);
		let empty_cnt = newArray(height,width,0);
		previous = newArray(height, width, undefined);
		vis = newArray(height, width, false);
		Q.clear();
		let Rpath = clone(path); Rpath.reverse();
		for (let [i, j] of Rpath) {
			Q.push([i, j]);
			vis[i][j] = true, sum_army[i][j] = 0;
		}
		let choice = undefined, evaluate = -1e10, tmpavg = undefined;
		while (!Q.empty()) {
			let [x, y] = Q.pop();
			if (dis[x][y] > 50 - turn % 50 - dis1[sx][sy][tx][ty] - this.remain_turns - 2 || (!inpath[x][y] && previous[x][y] == undefined)) {
				continue;
			}
			if (dis[x][y] > 0 && terrain[x][y] == M && army[x][y] > 1 && previous[x][y] != undefined && sum_army[x][y] > 0) {
				let average = (sum_army[x][y] - large_army[x][y]) / dis[x][y];
				if (average > 0.6 || (curfiller.terrain[x][y] === M && curfiller.army[x][y] >= my_average_army * 3)){
					let distance = real_dis[x][y];
					let val = average * pow(distance, 0.3) - empty_cnt[x][y] / distance + large_army[x][y];
					if (val > evaluate && !(defender.lock[x][y] && !defender.lock[previous[x][y][0]][previous[x][y][1]])) {
						choice = [[x, y], previous[x][y]];
						evaluate = val;
						tmpavg = average;
					}
				}
			}
			for (let d of stepdelta) {
				let [i, j] = vectoradd([x, y], d);
				if (chk1([i, j]) && !(defender.lock[i][j] && !defender.lock[x][y]) && dis[i][j] >= max(dis[x][y] + 1, 1) && !equal([i,j],previous[x][y]) ) {
					if (!vis[i][j] && dis[i][j] > dis[x][y])
						vis[i][j] = true, Q.push([i, j]);
					let a = sum_army[x][y] + (curfiller.terrain[i][j] === M ? 1 : -1) * curfiller.army[i][j] - 1;
					let large = large_army[x][y];
					if (curfiller.terrain[i][j] === M && curfiller.army[i][j] >= my_average_army * 3){
						large += curfiller.army[i][j] - my_average_army;
						if (cur.conquered_city[i][j]){
							large -= dis[i][j];
						}
					}
					if (curfiller.terrain[i][j] === M && curfiller.army[i][j] <= 1){
						a -= 0.5;
						// large -= average_army;
					}
					if (cur.conquered_city[i][j]){
						a -= dis[i][j];
					}
					if (a > sum_army[i][j]) {
						sum_army[i][j] = a;
						large_army[i][j] = large;
						empty_cnt[i][j] = empty_cnt[x][y] + 0.5 * min(near_space[i][j], 2.5);
						previous[i][j] = [x, y];
						real_dis[i][j] = real_dis[x][y] + 1;
					}
				}
			}
		}
		path.reverse();
		if (choice !== undefined){
			console.log("gather: gather", {choice: choice, evaluate: evaluate, tmpavg: tmpavg, sum_army: clone(sum_army), large: clone(large_army)});
			visualizer.visual_status('集', 'orange');
			attack(...choice);
		}
		else {
			if (sx === tx && sy === ty)
				throw "S == T for gather";
			let [x0,y0] = path[0], [x1,y1] = path[1];
			if (defender.lock[x0][y0] && !defender.lock[x1][y1])
				return false;
			console.log("gather: rush");
			visualizer.visual_status('冲', 'yellow');
			attack(path[0],path[1]);
			this.S = path[1];
		}
		this.path = clone(path);
		return true;
	}
}
class Defender{
	absoluately_defend(){
		let [sx,sy] = cur.generals[M];
		let [ex,ey] = this.absoluately_dangerous_most;
		let dis = dis1[sx][sy][ex][ey];
		let army_need = this.absoluately_dangerous_Earmy[ex][ey] - army[sx][sy] - (floor((turn + dis - 1)/2) - floor(turn / 2));
		let path_vis = newArray(height,width,false), path = [];
		for (let [i,j] = [ex,ey]; ; [i,j] = this.absoluately_dangerous_Enext[i][j]){
			path_vis[i][j] = true;
			this.lock[i][j] = true;
			path.push([i,j]);
			if (this.absoluately_dangerous_Enext[i][j] == undefined)
				break;
		}
		for (let i = 0; i < path.length - 1; i++)
			visualizer.draw_move([path[i],path[i+1]],0.3,"yellow");
		console.log(clone(path),army_need);
		let path_dis = get_distance(path,chk1);
		let sum_army = newArray(height,width,-1e9);
		let previous = newArray(height,width,undefined);
		let Q = new Queue();
		Q.push([sx,sy]);
		sum_army[sx][sy] = 0;
		while (!Q.empty()){
			let [x, y] = Q.pop();
			if (dis1[sx][sy][x][y] > dis + 1)
				break;
			for (let d of stepdelta){
				let [i,j] = vectoradd([x,y],d);
				if (chk1([i,j]) && dis1[sx][sy][x][y] + 1 === dis1[sx][sy][i][j]){
					if (sum_army[i][j] === -1e9)
						Q.push([i,j]);
					let nowarmy = path_vis[i][j] ? 0 : curfiller.army[i][j];
					if (curfiller.terrain[i][j] !== M)
						nowarmy *= -1;
					nowarmy += sum_army[x][y] - (path_vis[i][j] ? 0 : 1);
					if (nowarmy > sum_army[i][j]){
						sum_army[i][j] = nowarmy;
						previous[i][j] = [x,y];
					}
				}
			}
		}
		// console.log(clone(sum_army));
		for (let i = 0; i < Q.s - 1; i++) {
			let [x,y] = queue_base[i];
			if (cur.terrain[x][y] === M && cur.army[x][y] > 1 && sum_army[x][y] >= army_need){
				console.log(x,y,dis,dis1[x][y][sx][sy]);
				if (dis1[sx][sy][x][y] < dis - 1 && (cur.army[x][y] < analyzer.large_bound || dis1[x][y][ex][ey] > 10)){
					if (dis1[sx][sy][x][y] >= dis - 3){
						for (let [a, b] = [x, y]; ; [a, b] = previous[a][b]){
							this.lock[a][b] = true;
							if (previous[a][b] == undefined)
								break;
						}
					}
					// console.log('wahaha');
					// this.lock[x][y] = true;
					return;
				}
				let best = undefined;
				for (let d of stepdelta){
					let [i,j] = vectoradd([x,y],d);
					if (chk1([i,j]) && dis1[sx][sy][i][j] <= dis){
						if ((path_vis[x][y] ? 0 : army[x][y] - 1) + sum_army[i][j] >= army_need){
							if (best == undefined)
								best = [i,j];
							else {
								let [bx,by] = best;
								if (dis1[i][j][ex][ey] < dis1[bx][by][ex][ey] || (dis1[i][j][ex][ey] === dis1[bx][by][ex][ey] && 
									(path_dis[i][j] < path_dis[bx][by] || (path_dis[i][j] === path_dis[bx][by] && 
									(dis1[sx][sy][i][j] < dis1[sx][sy][bx][by] || (dis1[sx][sy][i][j] === dis1[sx][sy][bx][by] && 
									(cur.abs_army([i,j]) > cur.abs_army(best))))))))
									best = [i,j];
							} 
						}
					}
				}
				if (best == undefined)
					throw "wtf, I can defend and I can't defend???";
				this.do_absoluately_defend = true;
				console.log("defend: absoluate");
				visualizer.visual_status('防', 'cyan');
				attack([x,y],best);
				return;
			}
		}
		this.lock = newArray(height,width,false);
	}
	constructor(){
		this.lock = newArray(height,width,false);
		this.absoluately_dangerous_Earmy = newArray(height,width,-1e5);
		this.absoluately_dangerous_Efogarmy = newArray(height,width,[]);
		this.absoluately_dangerous_Enext = newArray(height,width,undefined);
		let Q = new Queue();
		let [sx,sy] = cur.generals[M];
		this.absoluately_dangerous_Earmy[sx][sy] = 0;
		this.absoluately_dangerous_Efogarmy[sx][sy] = [];
		Q.push([sx,sy]);
		this.absoluately_dangerous_most = undefined;
		let absoluately_dangerous_most_val = 1e5;
		while (!Q.empty()){
			let [x,y] = Q.pop();
			let narmy = this.absoluately_dangerous_Earmy[x][y], afog = this.absoluately_dangerous_Efogarmy[x][y];
			// console.log([x,y],narmy,afog);
			let darmy = narmy - army[sx][sy];
			let dis = dis1[sx][sy][x][y];
			darmy -= floor((turn + dis - 1) / 2) - floor(turn / 2);
			if (darmy > 0){
				if (dis < absoluately_dangerous_most_val){
					this.absoluately_dangerous_most = [x,y];
					absoluately_dangerous_most_val = dis;
				}
			}
			for (let d of stepdelta){
				let [i,j] = vectoradd([x,y],d);
				if (chk1([i,j]) && dis1[sx][sy][x][y] + 1 === dis1[sx][sy][i][j]){
					if (this.absoluately_dangerous_Enext[i][j] == undefined)
						Q.push([i,j]);
					let nowarmy = narmy - 1,nowafog = clone(afog);
					if (terrain[i][j] > -2){
						if (terrain[i][j] === M)
							nowarmy -= army[i][j];
						else if (terrain[i][j] === E)
							nowarmy += army[i][j];
					} else if (chk1([i,j])){
						for (let id of analyzer.army_track[i][j])
							if (afog.findIndex((a)=>a===id)===-1){
								nowarmy += analyzer.army_remain[id] - average_army;
								nowafog.push(id);
							}
					}
					if (nowarmy > this.absoluately_dangerous_Earmy[i][j]){
						this.absoluately_dangerous_Earmy[i][j] = nowarmy;
						this.absoluately_dangerous_Efogarmy[i][j] = clone(nowafog);
						this.absoluately_dangerous_Enext[i][j] = [x,y];
					}
				}
			}
		}
		// console.log(this.absoluately_dangerous_Earmy,this.absoluately_dangerous_Efogarmy,this.absoluately_dangerous_Enext);
		console.log(this.absoluately_dangerous_most,absoluately_dangerous_most_val);
		this.do_absoluately_defend = false;
		if (this.absoluately_dangerous_most != undefined){
			visualizer.draw_border(this.absoluately_dangerous_most,"cyan",4,1);
			// console.log("disabled defend!");
			if (win_rate > 0.47)
				this.absoluately_defend();
			return;
		}
	}
}
let last_take_city_turn = -100;
class City_taker{
	should_take_city(){
		if (win_rate > 0.43 && cur.city_cnt[E] > cur.city_cnt[M])
			return true;
		if (win_rate > 0.47 && (cur.cland[E] > cur.cland[M] + 10) && cur.cland[M] + (50 - turn % 50) < cur.cland[E])
			return true;
		if (win_rate > 0.47 && (cur.cland[E] > cur.cland[M] + 20))
			return true;
		return false;
	}
	take_city(){
		if (turn - last_take_city_turn < 4)
			return false;
		this.should_or_not = this.should_take_city();
		function get_city_dis([kx,ky],[i,j]){
			if (kx === i && ky === j)
				return 0;
			let dk = 1e4;
			for (let d of stepdelta){
				let [x,y] = vectoradd([i,j], d);
				if (chk1([x,y]) && dis1[kx][ky][x][y] !== false){
					dk = min(dk, dis1[kx][ky][x][y] + 1);
				}
			}
			return dk > 1e3 ? false : dk;
		}
		this.target_city = undefined;
		let score = 0, result_move = undefined;
		let [kx,ky] = cur.generals[M], [tx,ty] = guide.targets[0];
		let remain_turns = 50 - turn % 50;
		let sum_army = newArray(height, width, -1e9);
		let previous = newArray(height, width, undefined);
		let vis = newArray(height,width,false);
		let cdis = newArray(height,width,-1);
		let city_value_list = [];
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++){
				if ((cur.type[i][j] !== ISCITY && cur.type[i][j] !== E) || cur.terrain[i][j] === M)
					continue;
				let dk = get_city_dis([kx,ky],[i,j]);
				if (dk === false)
					continue;
				if (curfiller.terrain[i][j] !== E && (!this.should_or_not || (dk > 15 + 5 * (cur.city_cnt[M] - 1) || dk >= get_city_dis([tx,ty],[i,j]))))
					continue;
				for (let a = 0; a < height; a++)
					for (let b = 0; b < width; b++)
						cdis[a][b] = get_city_dis([a,b],[i,j]);
				let eM = 0, eE = 0;
				for (let a = 0; a < height; a++)
					for (let b = 0; b < width; b++){
						let d = cdis[a][b];
						if (d === false || d > 10)
							continue;
						if (curfiller.terrain[a][b] === M){
							eM += pow(min(curfiller.army[a][b] / my_average_army, 2) + 1, 0.5) * pow(0.6,max(d - 3, 0));
						} else if (curfiller.terrain[a][b] === E){
							eE += pow(min(curfiller.army[a][b] / my_average_army, 2) + 1, 0.5) * pow(0.6,max(d - 3, 0));
						}
					}
				for (let a = 0; a < height; a++)
					for (let b = 0; b < width; b++){
						sum_army[a][b] = -1e9;
						previous[a][b] = undefined;
						vis[a][b] = false;
					}
				if (curfiller.terrain[i][j] === E){
					eE /= 2;
				}
				if (curfiller.terrain[i][j] !== E){
					eM /= 2;
				}
				let city_score = (eM - eE) * 6;
				let cost_army = (curfiller.terrain[i][j] === E ? -50 : curfiller.terrain[i][j] === TILE_FOG_OBSTACLE ? 50 : curfiller.army[i][j]);
				city_score -= (cost_army - 10) / 3;
				city_score += cdis[tx][ty] - cdis[kx][ky] * (curfiller.terrain[i][j] === E ? 1 : 2);
				city_score -= max(0, (cur.cland[M] - cur.cland[E]) / 1.5);
				if (curfiller.terrain[i][j] !== E){
					let opponentseen = false;
					for (let a = i - 1; a <= i + 1; a++)
						for (let b = j - 1; b <= j + 1; b++)
							if (chk1([a,b]) && curfiller.terrain[a][b] === E){
								opponentseen = true;
							}
					if (opponentseen)
						city_score -= 15;
				}
				let tmp = {pos: [i,j], eE: eE, eM: eM, cost_army: cost_army, score: city_score, ps: [], sum_army: undefined};

				let Q = new Queue();
				Q.push([i,j]);
				sum_army[i][j] = 0;
				vis[i][j] = true;
				while (!Q.empty()){
					let [x,y] = Q.pop();
					let d = cdis[x][y];
					let army_need = curfiller.terrain[i][j] === TILE_FOG_OBSTACLE ? 50 : curfiller.army[i][j];
					if (curfiller.terrain[i][j] === E)
						army_need += floor((turn + d - 1) / 2) - floor(turn / 2);
					if (previous[x][y] != undefined && sum_army[x][y] > army_need){
						let now_score = city_score;
						tmp.ps.push([x,y]);
						now_score += min(sum_army[x][y] / average_army, 5) - pow(cdis[x][y], 1.3);
						if (curfiller.terrain[i][j] === E){
							now_score += 100 / pow(max(cdis[x][y], 1), 1);
						}
						if (now_score > score){
							score = now_score;
							this.target_city = [i,j];
							result_move = [[x,y], previous[x][y]];
						}
					}
					for (let d of stepdelta){
						let [a, b] = vectoradd([x,y], d);
						if (chk1([a,b]) && cdis[x][y] + 1 === cdis[a][b]){
							if (!vis[a][b]){
								vis[a][b] = true;
								Q.push([a,b]);
							}
							let now_army = sum_army[x][y];
							now_army += (curfiller.terrain[a][b] === M ? 1 : -1) * curfiller.army[a][b] - 1;
							if (now_army > sum_army[a][b]){
								sum_army[a][b] = now_army;
								previous[a][b] = [x,y];
							}
						}
					}
				}
				tmp.sum_army = clone(sum_army);
				city_value_list.push(tmp);
			}
		console.log('city_taker: take city: ',this.target_city, {v: city_value_list});
		if (this.target_city == undefined){
			return false;
		}
		visualizer.visual_status("塔", "purple");
		attack(...result_move);
		[tx,ty] = result_move[1];
		if (curfiller.terrain[tx][ty] !== E && curfiller.terrain[tx][ty] !== M && cur.type[tx][ty] === ISCITY)
			last_take_city_turn = turn + 1;
		return true;
	}
}
function initialize() {
	message_list = [];
	history_dataset = [undefined];
	analyzer = new Analyzer();
	chk1_result = undefined;
	visualizer.initialize();
	gather = new Gather();
	las = undefined;
	cur = undefined;
	last_take_city_turn = -100;
}
let run_time_recoder = new Run_time_recoder();
let curfiller, guide, gather, defender, city_taker = {};
async function Gaming() {
	my_last_move = undefined;
	console.log('------- turn: ' + turn.toString() + '-------');
	if (turn === 1){
		initialize();
	}
	if (history_dataset.length < turn) {
		keep_playing = false;
		Surrender();
		return;
	}
	let start_time, finish_time;
	start_time = Date.now();
	await new Promise((resolved) => {
		cur = new Dataset(las);
		if (!game_end) {
			cur.all_moves = guess_moves(clone(las), clone(cur));
			cur.moves = cur.all_moves[0];
			// console.log(clone(cur.all_moves));
			cur.update_comfirmed_colors();
			cur.calc_delta_land(las);
		}
		cur.calc_city_cnt(las);
		cur.calc_conquered_city();
		calc_average_army();
		if (!game_end)
			analyzer.update();
		curfiller = new Filler();
		get_distances();
		guide = new Guide();
		visualizer.update();
		if (!game_end)
			visualizer.visual_moves(cur.moves);
		visualizer.visual_non_confirmed_tiles();
		visualizer.visual_targets();
		if (game_end)
			resolved();
		if (turn % 50 === 0) {
			gather = new Gather();
		}
		visualizer.visual_win_rate();
		if ((cur.total_army[E] - cur.total_army[M]) > 200 && cur.total_army[E] > cur.total_army[M] * 3) {
			Surrender();
			resolved();
		}
		defender = new Defender();
		console.log(clone({lock: defender.lock}));
		city_taker.target_city = undefined;
		if (!defender.do_absoluately_defend){
			if (turn >= 24) {
				city_taker = new City_taker();
				if (!city_taker.take_city()){
					if (!gather.simple_gather()){
						autoplay();
					}
				}
			}
		}
		visualizer.visual_gather_path();
		visualizer.visual_track(analyzer.show);
		visualizer.visual_fog_track();
		visualizer.visual_my_last_move();
		visualizer.visual_target_city();
		visualizer.visual_locked();
		history_dataset.push(cur);
		las=clone(cur);
		resolved();
	});
	console.log(clone({cur:cur, curfiller:curfiller, analyzer: analyzer}));
	finish_time = Date.now();
	run_time_recoder.update(finish_time - start_time);
}
let defualt_game_type = join_custom, first_time = true, is_defualt = true;
async function play(game_type = undefined){
	first_time = true;
	keep_playing = true;
	is_defualt = false;
	playgames(game_type);
}
async function playgames(game_type = undefined) {
	unjoin();
	if (!keep_playing)
		return;
	if (game_type === undefined){
		game_type = defualt_game_type;
	} else {
		defualt_game_type = game_type;
	}
	setTimeout(() => {
		first_time = false;
		console.log("pending");
		return game_type();
	}, first_time || is_defualt ? 2000 : 5000);
}

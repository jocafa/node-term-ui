var util = require('util');
var inherits = require('util').inherits;
var stdio = process.binding('stdio');
var EventEmitter = require('events').EventEmitter;

function TermUI (opts) {
	opts = opts || {};
	var that = this;

	if (process.binding('stdio').isatty()) {
		this.stdin = process.openStdin();
		this.stdout = process.stdout;

		stdio.setRawMode(true);

		this.stdin.on('data', function (d) {
			that.handleInput(d);
		});

		if (process.listeners('SIGWINCH').length === 0) {
			process.on('SIGWINCH', function () {
				that.handleSizeChange();
			});
		}

		this.handleSizeChange();

		if (opts.mouse) {
			this.enableMouse();
		}
	}

	return this;
}

inherits(TermUI, EventEmitter);

TermUI.prototype.C = {
	k: 0,
	r: 1,
	g: 2,
	y: 3,
	b: 4,
	m: 5,
	c: 6,
	w: 7,
	x: 9 // normal
};

TermUI.prototype.S = {
	normal: 0,
	bold: 1,
	underline: 4,
	blink: 5,
	inverse: 8
};

TermUI.prototype.SYM = {
	star: '\u2605',
	check: '\u2714',
	x: '\u2718',
	triUp: '\u25b2',
	triDown: '\u25bc',
	triLeft: '\u25c0',
	triRight: '\u25b6',
	fn: '\u0192',
	arrowUp: '\u2191',
	arrowDown: '\u2193',
	arrowLeft: '\u2190',
	arrowRight: '\u2192'
};

TermUI.prototype.handleSizeChange = function () {
	this.width = stdio.getColumns();
	this.height = stdio.getRows();
	this.emit('resize', {w: this.width, h: this.height});
};

TermUI.prototype.out = function (buf) {
	this.stdout.write(buf);
	return this;
};

TermUI.prototype.clear = function () {
	this.stdout.write('\x1b[2J');
	this.pos(1,1);
	return this;
};

TermUI.prototype.pos = function (x, y) {
	x = x < 0 ? this.width - x : x;
	y = y < 0 ? this.height - y : y;
	x = Math.max(Math.min(x, this.width), 1);
	y = Math.max(Math.min(y, this.height), 1);
	this.stdout.write('\x1b[' + y + ';' + x + 'H');
	return this;
};

TermUI.prototype.home = function () {
	this.pos(1,1);
	return this;
};

TermUI.prototype.end = function () {
	this.pos(1, -1);
	return this;
};

TermUI.prototype.fg = function (c) {
	this.out('\x1b[3' + c + 'm');
	return this;
};

TermUI.prototype.bg = function (c) {
	this.out('\x1b[4' + c + 'm');
	return this;
};

TermUI.prototype.hifg = function (c) {
	this.out('\x1b[38;5;' + c + 'm');
	return this;
};

TermUI.prototype.hibg = function (c) {
	this.out('\x1b[48;5;' + c + 'm');
	return this;
};

TermUI.prototype.enableMouse = function () {
	this.out('\x1b[?1000h'); // enable click
	this.out('\x1b[?1002h'); // enable drag
	return this;
};

TermUI.prototype.disableMouse = function () {
	this.out('\x1b[?1000l'); // disable click
	this.out('\x1b[?1002l'); // disable drag
	return this;
};

TermUI.prototype.eraseLine = function () {
	this.out('\x1b[2K');
	return this;
};

TermUI.prototype.handleInput = function (d) {
	//this.pos(1,2).out(util.inspect(d)).end();

	switch (d[0]) {
		case 3: // ctrl+c
			this.quit();
		break;

		case 0x1b: // some escape sequence
			switch (d[1]) {
				case 0x5b:
					switch (d[2]) {
						case 0x4d: // M (mouse reporting)
							var evt = '';
							switch (d[3]) {
								case 0x20: // mouse down
									evt = 'mouseDown';
								break;

								case 0x23: // mouse up
									evt = 'mouseUp';
								break;

								case 0x40: // mouse drag
									evt = 'mouseDrag';
								break;

								case 0x60: // scroll up
									evt = 'scrollUp';
								break;

								case 0x61: // scroll down
									evt = 'scrollDown';
								break;

								default:
								break;
							}

							this.emit(evt, {
								x: d[4] - 32,
								y: d[5] - 32
							});
						break;

						default:
						break;
					}
				break;

				default:
				break;
			}
		break;

		default:
			this.emit('key', d[0]);
		break;
	}
};

TermUI.prototype.quit = function () {
	this.clear();
	this.disableMouse();
	stdio.setRawMode(false);
	process.exit(0);
};

exports.TermUI = new TermUI({mouse: true});

var TUI = exports.TermUI;

//////////////////////////////////////////////////////////////////[ Widget ]////

function Widget (opts) {
	var that = this;
	opts = opts || {};

	this.bounds = opts.bounds || {
		x: 0, y: 0,
		w: 0, h: 0
	};

	Widget.instances.push(this);

	return this;
}

Widget.instances = [];

inherits(Widget, EventEmitter);

Widget.prototype.handleClick = function (loc) {
};

exports.Widget = Widget;

exports.TermUI.on('mouseUp', function (loc) {
	var i = Widget.instances.length;
	TUI.pos(loc.x, loc.y).out('x');

	while (i--) {
		var widget = Widget.instances[i];
		if (
			loc.x >= widget.bounds.x &&
			loc.x <= widget.bounds.x + widget.bounds.w &&
			loc.y >= widget.bounds.y &&
			loc.y <= widget.bounds.y + widget.bounds.h
		) {
			widget.emit('mouseUp', loc);
		}
	}
});

//////////////////////////////////////////////////////////////////[ Button ]////
function Button (opts) {
	Widget.call(this, opts);
	this.fg = opts.fg || TUI.C.w;
	this.bg = opts.bg || TUI.C.b;
	this.label = opts.label || '';
}

inherits(Button, Widget);

Button.prototype.draw = function () {
	TUI.fg(this.fg).bg(this.bg);

	for (var y = this.bounds.y; y <=this.bounds.y + this.bounds.h; y++) {
		TUI.pos(this.bounds.x, y);
		for (var x = this.bounds.x; x <=this.bounds.x + this.bounds.w; x++) {
			TUI.out(' ');
		}
	}

	TUI.pos(this.bounds.x, this.bounds.y).out(this.label);
};

///////////////////////////////////////////////////////////////////[ Tests ]////
__filename == process.argv[1] && (function () {
	var b = new Button({
		bounds: {
			x: 10, y: 10,
			w: 20, h: 10
		},
		bg: 0,

		label: 'Zomgwtf!'
	});

	var b2 = new Button({
		bounds: {
			x: 15, y: 1,
			w: 20, h: 2 
		},
		bg: 1,
		label: 'Buttahn!'
	});

	function redraw () {
		TUI.clear();
		b.draw();
		b2.draw();
		TUI.bg(TUI.C.x).end();
	}

	b.on('mouseUp', function () {
		b.bg = (b.bg + 1) % 7;
		redraw();
	});

	b2.on('mouseUp', function () {
		b2.bg = (b2.bg + 1) % 7;
		redraw();
	});

	TUI.on('resize', function () {
		redraw();
	});


	redraw();

})();

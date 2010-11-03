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
	this.out('\x1b[?1000h');
	return this;
};

TermUI.prototype.disableMouse = function () {
	this.out('\x1b[?1000l');
	return this;
};

TermUI.prototype.handleInput = function (d) {
	/*
	this.pos(1,2);
	this.out(util.inspect(d));
	*/

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

exports.TermUI = TermUI;

///////////////////////////////////////////////////////////////////[ Tests ]////
__filename == process.argv[1] && (function () {
	new (require('./Tester').Tester)({
		tests: {
			instantiation: {
				'no args': function () {
					var t = new TermUI({mouse: true});
					this.assert(t instanceof TermUI, true);
				}
			}
		}
	});
})();

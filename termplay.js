var util = require('util');

var TermUI = require('./TermUI').TermUI;

var term = new TermUI({
	mouse: true
});

term.on('key', function (k) {
	term.pos(1, 1).out(k + '    ');
});

term.on('mouseDown', function (loc) {
	term.pos(loc.x, loc.y).fg(term.C.g).out(term.SYM.arrowDown + ' ').end();
});

term.on('mouseUp', function (loc) {
	term.pos(loc.x, loc.y).fg(term.C.y).hifg(0xb2).out(term.SYM.arrowUp + ' ').end();
});

term.on('scrollUp', function (loc) {
	term.pos(5, 5).fg(term.C.c).out('scrollUp  ');
});

term.on('scrollDown', function (loc) {
	term.pos(5, 5).fg(term.C.m).out('scrollDown');
});

term.on('resize', function (s) {
});

term.on('quit', function () {
	util.puts('quitting!');
});

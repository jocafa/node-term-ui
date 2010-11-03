var util = require('util');

var TermUI = require('./TermUI').TermUI;

var term = new TermUI({
	mouse: true
});

term.on('key', function (k) {
	term.pos(1, 1).out(k + '    ');
});

term.on('mouseDown', function (loc) {
	term.pos(loc.x, loc.y).fg(term.C.g).out('v').end();
});

term.on('mouseUp', function (loc) {
	term.pos(loc.x, loc.y).fg(term.C.y).out('^').end();
});

term.on('mouseDrag', function (loc) {
	term.pos(5, 4).eraseLine().fg(term.C.c).out('drag ' + util.inspect(loc));
});

term.on('scrollUp', function (loc) {
	term.pos(5, 5).fg(term.C.c).out('scrollUp  ');
});

term.on('scrollDown', function (loc) {
	term.pos(5, 5).fg(term.C.m).out('scrollDown');
});

term.on('resize', function (s) {
	term.clear();
	term.pos(1,1).fg(term.C.m).out('resize ' + util.inspect(s));
});

term.on('quit', function () {
	util.puts('quitting!');
});

term.clear();

T = require "../TermUI"

class T.Button extends T.Widget
  constructor: (opts) ->
    super(opts)

    @fg = @options.fg ? T.C.w
    @bg = @options.fg ? T.C.b

    @label = @options.label ? ''

    # labelAnchor values correspond to the locations of the numbers on a
    # standard keyboard numpad
    # 7 8 9
    # 4 5 6
    # 1 2 3
    @labelAnchor = @options.labelAnchor ? 5

  draw: ->
    T.fg(@fg).bg(@bg).pos(@bounds.x, @bounds.y)

    align = ['lpad', 'rpad', 'center'][@labelAnchor % 3]
    labelStr = _[align] @label, @bounds.w, ' '

    if @bounds.h > 1
      emptyStr = _.pad ' ', @bounds.w, ' '

    switch ((@labelAnchor-1) / 3) | 0
      when 0 then labelRow = @bounds.y + @bounds.h - 1
      when 1 then labelRow = @bounds.y + (@bounds.h / 2) | 0
      when 2 then labelRow = @bounds.y

    for y in [(@bounds.y)..(@bounds.y + @bounds.h - 1)]
      T.pos @bounds.x, y
      if y is labelRow
        T.out labelStr
      else
        T.out emptyStr
    T.fg(T.C.x).bg(T.C.x).end()
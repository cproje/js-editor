(function () {

  let _input = document.getElementById('editor-input');
  let _output = document.getElementById('editor-output');
  let _console = document.getElementById('editor-console');
  let _button = document.getElementById('editor-run-button');
  
  function save() {
    let data = JSON.stringify({
      code: _input.value,
      scrollX: _input.scrollLeft,
      scrollY: _input.scrollTop,
      start: _input.selectionStart,
      end: _input.selectionEnd,
    });
    localStorage.setItem('__js__editor__', data);
  }
  
  function restore() {
    if (localStorage.getItem('__js__editor__')) {
      let data = JSON.parse(localStorage.getItem('__js__editor__'));
      _input.value = data.code;
      _input.scrollLeft = data.scrollX;
      _input.scrollTop = data.scrollY;
      _input.selectionStart = data.start;
      _input.selectionEnd = data.end;
    } else {
      _input.value = `// Example\n\nlet message = 'Welcome';\nconsole.log(message);`;
    }
    update();
    _input.focus();
  }


  function insert(value, offset) {
    let start = _input.selectionStart;
    let end = _input.selectionEnd;
    let first = _input.value.substring(0, start);
    let last = _input.value.substring(end);
    _input.value = first + value + last;
    _input.selectionStart = start + offset;
    _input.selectionEnd = start + offset;
  }
  
  function update() {
    _output.innerHTML = _input.value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|super|switch|static|this|throw|try|typeof|var|void|while|with|yield)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(\w+)(?=\()\b/g, '<span class="struct">$1</span>')
      .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>')
      .replace(/\b(\d+(\.\d+)?|0x[0-9a-fA-F]+|0b[01]+)\b/g, '<span class="number">$1</span>')
      .replace(/('[^']*'|`[^`]*`)/g, (_ ,value) => {
        value = value.replace(/\//g, '&sol;');
        value = value.replace(/<[^>]+>/g, '');
        return `<span class="string">${value}</span>`;
      })
      .replace(/(\/\/[^\n]+|\/\*.*\*\/)/g, (_ ,value) => {
        value = value.replace(/<[^>]+>/g, '');
        return `<span class="comment">${value}</span>`;
      })
      .replace(/\n|$/g, '<br>')
      ;
    save();
  }

  _input.addEventListener('input', update);
  _input.addEventListener('mouseup', update);
  _input.addEventListener('scroll', () => {
    _output.scrollLeft = _input.scrollLeft;
    _output.scrollTop = _input.scrollTop;
    save();
  });

  _input.addEventListener('keydown', (e) => {
    if (e.keyCode == 9 || e.keyCode == 121) {
      e.preventDefault();
    }
  });

  _input.addEventListener('keyup', (e) => {
    if (e.keyCode == 9) {
      insert('  ', 2);
    }

    if (e.keyCode == 121) {
      run();
    }
    
    update();
  });

  function run() {
    try {
      console.clear();
      Function(_input.value)();
    } catch (e) {
      _console.innerHTML = `<span class="error">${e.name}</span>: ${e.message}`;
    }
  }

  function view(obj, tabSize) {
    if (Array.isArray(obj)) {
      let html = `<span class="info">(${obj.length}) [</span>`;
      for (let item of obj) {
        html += '\n' + ' '.repeat(tabSize) + view(item, tabSize * 2) + '<span class="info">,</span>';
      }
      return `${html}\n${' '.repeat(tabSize - 2)}<span class="info">]</span>`;
    }

    switch (typeof obj) {
      case 'boolean':
        return `<span class="boolean">${obj}</span>`;

      case 'function':
        return `<span class="keyword">function</span> ${obj.name ? obj.name : '?'}`;
      
      case 'number':
        return `<span class="number">${obj}</span>`;

      case 'string':
        return `<span class="string">${obj}</span>`;

      case 'undefined':
        return `<span class="keyword">${obj}</span>`;

      default:
        let html = `<span class="info">{</span>`;
        for (let name in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, name)) {
            html += `\n${' '.repeat(tabSize)}${name}: ${view(obj[name], tabSize * 2)}<span class="info">,</span>`;
          }
        }
        return `${html}\n${' '.repeat(tabSize - 2)}<span class="info">}</span>`;
    }
  }

  const CLEAR = console.clear;
  const LOG = console.log;

  console.clear = function () {
    _console.innerHTML = '';
    CLEAR();
  };

  console.log = function (...args) {
    for (let arg of args) {
      if (_console.textContent == '') {
        _console.innerHTML += view(arg, 2);
      } else {
        _console.innerHTML += '<hr>' + view(arg, 2);  
      }
      LOG(arg);
    }
  };

  _button.addEventListener('click', run);
  restore();

})();

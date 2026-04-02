const display = document.getElementById("display");
const micBtn = document.getElementById("micBtn");

// Basic calculator functions
function append(value) {
  if (display.value === "" && ["+", "-", "*", "/", ")"].includes(value)) return;
  display.value += value;
}

function clearDisplay() {
  display.value = "";
}

function backspace() {
  display.value = display.value.slice(0, -1);
}

function calculate() {
  try {
    let expr = display.value
      .replace(/×/g, "*")
      .replace(/÷/g, "/");

    display.value = eval(expr);
  } catch {
    display.value = "Error";
  }
}

// Integration using Simpson's rule
function integrate(func, a, b, n = 1000) {
  let h = (b - a) / n;
  let sum = 0;

  for (let i = 0; i <= n; i++) {
    let x = a + i * h;
    let w = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * func(x);
  }

  return (h / 3) * sum;
}

// Normalize speech input to a mathematical expression
function normalizeSpeech(text) {
  return text
    .toLowerCase()
    .replace(/what is|calculate|find|please|tell me/g, "")
    .replace(/open bracket/g, "(")
    .replace(/close bracket/g, ")")
    .replace(/multiply|times|into/g, " * ")
    .replace(/divided by|divide by/g, " / ")
    .replace(/plus/g, " + ")
    .replace(/minus/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

// Convert number words to digits
function wordsToNumbers(text) {
  const map = {
    zero:0, one:1, two:2, three:3, four:4,
    five:5, six:6, seven:7, eight:8, nine:9, ten:10
  };

  Object.keys(map).forEach(w => {
    text = text.replace(new RegExp("\\b"+w+"\\b","g"), map[w]);
  });

  return text;
}

// Speech recognition for voice input
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  micBtn.onclick = () => {
    try { recognition.stop(); } catch {}
    recognition.start();
  };

  recognition.onresult = (event) => {
    let text = event.results[0][0].transcript;
    console.log("Voice:", text);

    if (!text.trim()) {
      display.value = "Say something";
      return;
    }

    // Power
    let p = text.match(/(\d+)\s*(power|raised to)\s*(\d+)/i);
    if (p) {
      display.value = Math.pow(p[1], p[3]);
      return;
    }

    // Division
    let by = text.match(/(\d+)\s*by\s*(\d+)/i);
    if (by) {
      display.value = by[1] / by[2];
      return;
    }

    // Decimal point
    text = text.replace(/(\d+)\s*point\s*(\d+)/g, "$1.$2");

    // percent
    let percent = text.match(/(\d+)\s*(percent|%)\s*of\s*(\d+)/);
    if (percent) {
      display.value = (percent[1]/100)*percent[3];
      return;
    }

    // square
    if (/square of (\d+)/.test(text)) {
      display.value = Math.pow(RegExp.$1,2);
      return;
    }

    // cube
    if (/cube of (\d+)/.test(text)) {
      display.value = Math.pow(RegExp.$1,3);
      return;
    }

    // root
    if (/square root of (\d+)/.test(text)) {
      display.value = Math.sqrt(RegExp.$1);
      return;
    }

    // integral
    if (text.includes("integral")) {
      let func = x=>x;

      if (text.includes("square")) func = x=>x*x;
      if (text.includes("cube")) func = x=>x*x*x;

      let m = text.match(/(\d+)\s*to\s*(\d+)/);
      if (!m) {
        display.value = "Say limits 1 to 2";
        return;
      }

      display.value = integrate(func, +m[1], +m[2]).toFixed(4);
      return;
    }

    text = normalizeSpeech(text);
    text = wordsToNumbers(text);

    let expr = text
      .replace(/plus/g,"+")
      .replace(/minus/g,"-")
      .replace(/times|multiply/g,"*")
      .replace(/divided by/g,"/")
      .replace(/\^/g,"**");

    display.value = eval(expr);
  };

  recognition.onerror = (e) => {
    display.value = "Mic Error: " + e.error;
    setTimeout(()=>display.value="",2000);
  };
}
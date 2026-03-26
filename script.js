const display = document.getElementById("display");
const micBtn = document.getElementById("micBtn");

// ================= BASIC =================
function append(value) {
  display.value += value;
}

function calculate() {
  try {
    display.value = eval(display.value);
  } catch {
    display.value = "Error";
  }
}

// ================= INTEGRATION =================
function integrate(func, a, b, n = 1000) {
  let h = (b - a) / n;
  let sum = 0;

  for (let i = 0; i <= n; i++) {
    let x = a + i * h;
    let weight = (i === 0 || i === n) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += weight * func(x);
  }

  return (h / 3) * sum;
}

// ================= SAFE EVAL =================
function evaluateExpression(expr) {
  try {
    expr = expr
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E")
      .replace(/√\s*(\d+)/g, "Math.sqrt($1)");

    console.log("Evaluating:", expr);
    return eval(expr);
  } catch (e) {
    console.log("Eval Error:", e);
    return "Error";
  }
}

// ================= NORMALIZE =================
function normalizeSpeech(text) {
  return text
    .toLowerCase()
    .replace(/what is|calculate|find|please|can you|tell me/g, "")
    .replace(/open bracket/g, "(")
    .replace(/close bracket/g, ")")
    .replace(/multiplied by|multiply by/g, " * ")
    .replace(/times/g, " * ")
    .replace(/into/g, " * ")
    .replace(/divided by/g, " / ")
    .replace(/divide by/g, " / ")
    .replace(/plus/g, " + ")
    .replace(/minus/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= WORD → NUMBER =================
function wordsToNumbers(text) {
  const map = {
    zero: 0, one: 1, two: 2, three: 3, four: 4,
    five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10
  };

  Object.keys(map).forEach(word => {
    text = text.replace(new RegExp("\\b" + word + "\\b", "g"), map[word]);
  });

  return text;
}

// ================= VOICE =================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  let isListening = false;

  micBtn.addEventListener("click", () => {
    if (!isListening) {
      recognition.start();
      isListening = true;
    }
  });

  recognition.onend = () => {
    isListening = false;
  };

  recognition.onresult = (event) => {
    let text = event.results[0][0].transcript;
    console.log("Raw Voice:", text);

    if (!text || text.trim() === "") {
      display.value = "Say something";
      return;
    }

    // ================= INTENT FIRST =================

    // ✅ Power (direct)
    let rawPowerMatch = text.match(/(\d+)\s*(power|raised to|to the power of)\s*(\d+)/i);
    if (rawPowerMatch) {
      display.value = Math.pow(rawPowerMatch[1], rawPowerMatch[3]);
      return;
    }

    //  Division 
    let rawByMatch = text.match(/(\d+)\s*by\s*(\d+)/i);
    if (rawByMatch) {
      display.value = rawByMatch[1] / rawByMatch[2];
      return;
    }

    // ================= RECOVERY =================

    // 6.4 → 6 power 4
    text = text.replace(/(\d+)\.(\d+)/g, (m,a,b) => {
        if (b.length === 1 && parseInt(b) <= 9) {
            return `${a} power ${b}`;
        }
        return m;
    });

    // 843 → 8 by 4
    if (/^\d{3}$/.test(text)) {
      text = `${text[0]} by ${text[2]}`;
    }
    
    // detect power again

    let powerFixMatch = text.match(/(\d+)\s*power\s*(\d+)/i);
    if (powerFixMatch) {
        display.value = Math.pow(powerFixMatch[1], powerFixMatch[2]);
        return;
    }
    // ================= NORMALIZE =================
    text = normalizeSpeech(text);
    text = wordsToNumbers(text);

    console.log("Normalized:", text);

    // ================= POWER =================
    let powerMatch = text.match(/(\d+)\s*(power|to the power of|raised to)\s*(\d+)/);
    if (powerMatch) {
      display.value = Math.pow(powerMatch[1], powerMatch[3]);
      return;
    }

    // ================= DIVISION =================
    let divideMatch = text.match(/divide\s*(\d+)\s*by\s*(\d+)/);
    if (divideMatch) {
      display.value = divideMatch[1] / divideMatch[2];
      return;
    }

    let byMatch = text.match(/(\d+)\s*by\s*(\d+)/);
    if (byMatch) {
      display.value = byMatch[1] / byMatch[2];
      return;
    }

    let spaceMatch = text.match(/^(\d+)\s+(\d+)$/);
    if (spaceMatch) {
      display.value = spaceMatch[1] / spaceMatch[2];
      return;
    }

    // ================= DECIMAL =================
    text = text.replace(/(\d+)\s*point\s*(\d+)/g, "$1.$2");

    // ================= PERCENT =================
    let percent = text.match(/(\d+)\s*(%|percent)\s*of\s*(\d+)/);
    if (percent) {
      display.value = (percent[1] / 100) * percent[3];
      return;
    }

    // ================= SQUARE / CUBE =================
    if (/square of (\d+)/.test(text)) {
      let n = text.match(/square of (\d+)/)[1];
      display.value = n ** 2;
      return;
    }

    if (/cube of (\d+)/.test(text)) {
      let n = text.match(/cube of (\d+)/)[1];
      display.value = n ** 3;
      return;
    }

    // ================= ROOT =================
    if (/square root of\s*$/.test(text)) {
      display.value = "Say a number after root";
      return;
    }

    if (/square root of (\d+)/.test(text)) {
      let n = text.match(/square root of (\d+)/)[1];
      display.value = Math.sqrt(n);
      return;
    }

    if (/root (\d+)/.test(text)) {
      let n = text.match(/root (\d+)/)[1];
      display.value = Math.sqrt(n);
      return;
    }

    // ================= INTEGRAL =================
    if (text.includes("integral")) {
      text = text.replace("of", "");

      let func = (x) => x;

      if (text.includes("x square") || text.includes("x squared")) {
        func = (x) => x * x;
      } else if (text.includes("x cube")) {
        func = (x) => x * x * x;
      }

      let limits = text.match(/(\d+)\s*(to|-)\s*(\d+)/);

      if (!limits) {
        display.value = "Say limits like: from 1 to 2";
        return;
      }

      let result = integrate(func, +limits[1], +limits[3]);
      display.value = result.toFixed(4);
      return;
    }

    // ================= VALIDATION =================
    if (!/[0-9+\-*/().]/.test(text)) {
      display.value = "Say a math expression";
      return;
    }

    // ================= FINAL (BODMAS) =================
    let expression = text.replace(/\^/g, "**");

    console.log("Final Expression:", expression);

    let result = evaluateExpression(expression);
    display.value = result;
  };

  recognition.onerror = (event) => {
    display.value = "Mic Error: " + event.error;
  };
}


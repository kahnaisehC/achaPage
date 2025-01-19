const p1_input = document.getElementById("playeroneinput");
const p1_div = document.getElementById("playeronediv");
const p1_button = document.getElementById("playeronebutton");
const p2_input = document.getElementById("playertwoinput");
const p2_div = document.getElementById("playertwodiv");
const p2_button = document.getElementById("playertwobutton");

function connect() {
  ws = new WebSocket("/ws");
  ws.onopen = function() {
    console.log("Connected or something");
  };

  ws.onmessage = function(event) {
    const information = event.data;
    if (information[1] == "1") {
      p1_div.innerHTML += `<p>${event.data}\n</p>`;
    } else {
      p2_div.innerHTML += `<p>${event.data}\n</p>`;
    }
  };

  ws.onclose = function() {
    console.log("Trying to reconnect...");
    setTimeout(connect, 1000);
  };

  ws.onerror = function(error) {
    console.error("WebSocket error:", error);
  };
}

p1_button.addEventListener("click", function() {
  const input = p1_input.value;
  ws.send("p1" + input);
  p1_input.value = "";
});

p2_button.addEventListener("click", function() {
  const input = p2_input.value;
  ws.send("p2" + input);
  p2_input.value = "";
});

connect();

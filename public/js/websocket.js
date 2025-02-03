const ws = new WebSocket("/ws");
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

p1_button.addEventListener("click", function() {
  const input = p1_input.value;
  ws.send("p1" + input);
  p1_input.value = "";
});

connect();

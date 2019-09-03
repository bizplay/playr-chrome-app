document.addEventListener("DOMContentLoaded", function() {
  "use strict";
  document.getElementById("info").style.display = "block";
  document.getElementById("status").style.display = "block";
});

function setStatus(message) {
  if (message !== undefined) {
    document.getElementById("status").innerHTML = "Exception: " + message;
    document.getElementById("status").style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", function () {
  let isScrolling = false;
  let isRecording = false;
  let isDarkMode = false;
  let isMirrored = false;
  let mediaRecorder;
  let recordedChunks = [];

  // Helper function to safely add event listeners
  function addEventListenerSafely(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.error(`Element #${elementId} not found`);
    }
  }

  // Add event listeners
  addEventListenerSafely("startTeleprompter", "click", startTeleprompter);
  addEventListenerSafely("scrollingButton", "click", toggleScrolling);
  addEventListenerSafely("recordingButton", "click", toggleRecording);
  addEventListenerSafely("backButton", "click", () => {
    console.log("Back button clicked");
    window.location.href = "index.html";
  });
  addEventListenerSafely("toggleDarkModeButton", "click", toggleDarkMode);
  addEventListenerSafely("toggleMirrorButton", "click", toggleMirrorMode);
  addEventListenerSafely("translateButton", "click", translateScript);
  addEventListenerSafely("fontSize", "input", adjustFontSize);
  addEventListenerSafely("opacity", "input", adjustOpacity);
  addEventListenerSafely("fontColor", "change", adjustFontColor);
  addEventListenerSafely("backgroundColor", "change", adjustBackgroundColor);

  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const topic = decodeURIComponent(params.get("topic") || "Untitled");
  const scriptText = decodeURIComponent(
    params.get("scriptText") || "No script provided."
  );
  const fontSize = decodeURIComponent(params.get("fontSize") || "30");
  const fontColor = decodeURIComponent(params.get("fontColor") || "black");
  const backgroundColor = decodeURIComponent(
    params.get("backgroundColor") || "white"
  );
  const opacity = decodeURIComponent(params.get("opacity") || "1");
  const scrollSpeed = decodeURIComponent(params.get("scrollSpeed") || "60s");
  const scrollStartPosition = decodeURIComponent(
    params.get("scrollStartPosition") || "top"
  );

  // Populate the teleprompter
  const scrollingText = document.getElementById("scrollingText");
  if (scrollingText) {
    scrollingText.innerHTML = scriptText;
    scrollingText.style.fontSize = `${fontSize}px`;
    scrollingText.style.color = fontColor;
    scrollingText.style.backgroundColor = backgroundColor;
    scrollingText.style.opacity = opacity;
    scrollingText.style.animationDuration = scrollSpeed;

    // Set scroll start position
    if (scrollStartPosition === "top") {
      scrollingText.style.alignItems = "flex-start";
    } else if (scrollStartPosition === "middle") {
      scrollingText.style.alignItems = "center";
    } else if (scrollStartPosition === "bottom") {
      scrollingText.style.alignItems = "flex-end";
    }
  } else {
    console.error("Element #scrollingText not found");
  }

  // Debugging: Log initial setup
  console.log("Teleprompter initialized with the following settings:");
  console.log({
    topic,
    scriptText,
    fontSize,
    fontColor,
    backgroundColor,
    opacity,
    scrollSpeed,
    scrollStartPosition,
  });

  // Functions
  function startTeleprompter() {
    console.log("Start Teleprompter clicked");
    const topic = document.getElementById("topic").value.trim();
    const scriptText = document.getElementById("scriptText").innerHTML;
    const scrollStartPosition = document.getElementById(
      "scrollStartPosition"
    ).value;
    const scrollSpeed = document.getElementById("scrollSpeed").value;

    if (!topic || !scriptText.trim()) {
      alert("Please enter a topic and script.");
      return;
    }

    const scrollingText = document.getElementById("scrollingText");
    scrollingText.innerHTML = scriptText;

    // Set the scroll start position
    if (scrollStartPosition === "top") {
      scrollingText.style.top = "0";
      scrollingText.style.transform = "none";
    } else if (scrollStartPosition === "middle") {
      scrollingText.style.top = "50%";
      scrollingText.style.transform = "translateY(-50%)";
    } else if (scrollStartPosition === "bottom") {
      scrollingText.style.top = "100%";
      scrollingText.style.transform = "translateY(-100%)";
    }

    scrollingText.style.animationDuration = scrollSpeed;
    scrollingText.style.animationPlayState = "paused";

    document.getElementById("teleprompterForm").style.display = "none";
    document.getElementById("teleprompterDisplay").style.display = "block";

    // Start the camera feed
    const cameraFeed = document.getElementById("cameraFeed");
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      })
      .then((stream) => {
        cameraFeed.srcObject = stream;

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "video/mp4" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const fileName = `${topic}-${timestamp}.mp4`;
          a.style.display = "none";
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        };
      })
      .catch((err) => {
        console.error("Error accessing the camera:", err);
        alert("Unable to access the camera. Please check your permissions.");
      });
  }

  function toggleScrolling() {
    console.log("Toggle Scrolling clicked");
    if (isScrolling) {
      scrollingText.style.animationPlayState = "paused";
      document.getElementById("scrollingButton").textContent =
        "Start Scrolling";
    } else {
      scrollingText.style.animation = `scrollUp ${scrollSpeed} linear infinite`;
      scrollingText.style.animationPlayState = "running";
      document.getElementById("scrollingButton").textContent =
        "Pause Scrolling";
    }
    isScrolling = !isScrolling;
  }

  function toggleRecording() {
    console.log("Toggle Recording clicked");
    const recordingButton = document.getElementById("recordingButton");

    if (isRecording) {
      mediaRecorder.stop();
      recordingButton.textContent = "Start Recording";
    } else {
      const countdownElement = document.createElement("div");
      countdownElement.id = "countdown";
      countdownElement.style.position = "absolute";
      countdownElement.style.top = "50%";
      countdownElement.style.left = "50%";
      countdownElement.style.transform = "translate(-50%, -50%)";
      countdownElement.style.fontSize = "48px";
      countdownElement.style.fontWeight = "bold";
      countdownElement.style.color = "red";
      countdownElement.style.zIndex = "1000";
      document.body.appendChild(countdownElement);

      let countdown = 3;
      countdownElement.textContent = countdown;

      const countdownInterval = setInterval(() => {
        countdown -= 1;
        if (countdown > 0) {
          countdownElement.textContent = countdown;
        } else {
          clearInterval(countdownInterval);
          document.body.removeChild(countdownElement);

          recordedChunks = [];
          mediaRecorder.start();
          recordingButton.textContent = "Stop Recording";
          console.log("Recording started");
        }
      }, 1000);
    }

    isRecording = !isRecording;
  }

  function toggleDarkMode() {
    console.log("Toggle Dark Mode clicked");
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode", isDarkMode);
  }

  function toggleMirrorMode() {
    console.log("Toggle Mirror Mode clicked");
    const scrollingText = document.getElementById("scrollingText");
    isMirrored = !isMirrored;
    scrollingText.style.transform = isMirrored ? "scaleX(-1)" : "scaleX(1)";
  }

  function translateScript() {
    console.log("Translate Script clicked");
    const scriptText = document.getElementById("scriptText").innerText.trim();
    const targetLanguage = document.getElementById("languageSelect").value;

    if (!scriptText) {
      alert("Please enter a script to translate.");
      return;
    }

    fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
        scriptText
      )}`
    )
      .then((response) => response.json())
      .then((data) => {
        const translatedText = data[0].map((item) => item[0]).join("");
        document.getElementById("scriptText").innerText = translatedText;
        alert("Translation successful!");
      })
      .catch((error) => {
        console.error("Error translating script:", error);
        alert("Failed to translate the script. Please try again.");
      });
  }

  function adjustFontSize() {
    console.log("Adjust Font Size clicked");
    const fontSize = document.getElementById("fontSize").value;
    document.getElementById("scrollingText").style.fontSize = `${fontSize}px`;
  }

  function adjustOpacity() {
    console.log("Adjust Opacity clicked");
    const opacity = document.getElementById("opacity").value;
    document.getElementById("teleprompterDisplay").style.opacity = opacity;
  }

  function adjustFontColor() {
    console.log("Adjust Font Color clicked");
    const fontColor = document.getElementById("fontColor").value;
    document.getElementById("scrollingText").style.color = fontColor;
  }

  function adjustBackgroundColor() {
    console.log("Adjust Background Color clicked");
    const backgroundColor = document.getElementById("backgroundColor").value;
    document.getElementById("teleprompterDisplay").style.backgroundColor =
      backgroundColor;
  }

  // Start camera feed and initialize MediaRecorder
  const cameraFeed = document.getElementById("cameraFeed");
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      console.log("Camera feed started");
      cameraFeed.srcObject = stream;

      // Initialize MediaRecorder
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        // Create a Blob from the recorded chunks
        const blob = new Blob(recordedChunks, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);

        // Generate a filename using the topic and current datetime
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${topic}-${timestamp}.mp4`;

        // Create a download link and trigger the download
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      };
    })
    .catch((err) => {
      console.error("Error accessing camera:", err);
      alert("Unable to access the camera. Please check your permissions.");
    });

  // Scrolling animation keyframes
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(
    `
      @keyframes scrollUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
      }
  `,
    styleSheet.cssRules.length
  );
});

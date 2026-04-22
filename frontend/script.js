const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const result = document.getElementById("result");

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.log("Camera error:", err);
        });
}

function captureImage() {
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    result.innerText = "Image Captured ";
}
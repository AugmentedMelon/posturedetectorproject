const video = document.getElementById('webcam');
const statusEl = document.getElementById('status');
let detector;

async function init() {
    try {
        await tf.setBackend('webgl');
        await tf.ready();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        });

        statusEl.textContent = "Detecting posture...";
        detectLoop();
    } catch (e) {
        console.error(e);
        statusEl.textContent = "Camera or TF.js init failed.";
    }
}

async function detectLoop() {
    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        const leftEar = keypoints.find(k => k.name === 'left_ear');
        const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');

        if (leftEar && leftShoulder && leftEar.score > 0.5 && leftShoulder.score > 0.5) {
            const dy = leftEar.y - leftShoulder.y;
            const dx = leftEar.x - leftShoulder.x;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            if (angle > 35) {
                statusEl.textContent = `⚠️ Slouch detected (${angle.toFixed(1)}°)`;
            } else {
                statusEl.textContent = `✅ Good posture (${angle.toFixed(1)}°)`;
            }
        } else {
            statusEl.textContent = "Fix it.";
        }
    } else {
        statusEl.textContent = "No pose detected.";
    }
    requestAnimationFrame(detectLoop);
}

document.addEventListener('DOMContentLoaded', init);

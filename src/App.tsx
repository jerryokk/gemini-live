/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useRef, useState, useEffect } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { useWebcam } from "./hooks/use-webcam";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const webcam = useWebcam();
  const isWebcam = videoStream?.getVideoTracks()[0]?.getSettings()?.facingMode === "user";
  const hasMultipleCameras = webcam.devices && webcam.devices.length > 1;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  return (
    <div className="App">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
              <Altair />
              <div className="stream-container">
                {hasMultipleCameras && webcam.isStreaming && (
                  <button 
                    className="switch-camera material-symbols-outlined"
                    onClick={async () => {
                      try {
                        if (webcam.switchCamera) {
                          const newStream = await webcam.switchCamera();
                          if (newStream) {
                            setVideoStream(newStream);
                          }
                        }
                      } catch (error) {
                        console.error('Error switching camera:', error);
                      }
                    }}
                  >
                    flip_camera_android
                  </button>
                )}
                <video
                  className={cn("stream", {
                    hidden: !videoStream,
                    webcam: isWebcam
                  })}
                  ref={videoRef}
                  autoPlay
                  playsInline
                />
              </div>
            </div>
            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
            >
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;

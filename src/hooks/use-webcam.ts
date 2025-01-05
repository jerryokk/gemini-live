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

import { useState, useEffect, useRef } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

export function useWebcam(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const videoDevicesRef = useRef<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };
    if (stream) {
      stream
        .getTracks()
        .forEach((track) => track.addEventListener("ended", handleStreamEnded));
      return () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.removeEventListener("ended", handleStreamEnded),
          );
      };
    }
  }, [stream]);

  const getVideoDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  };

  const startStream = async (deviceId?: string) => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
    });
    setStream(mediaStream);
    setIsStreaming(true);
    return mediaStream;
  };

  const start = async () => {
    try {
      // Get all video devices
      videoDevicesRef.current = await getVideoDevices();
      // Start stream with first device
      return await startStream(videoDevicesRef.current[0]?.deviceId);
    } catch (err) {
      console.error('Failed to get camera access:', err);
      throw err;
    }
  };

  const switchCamera = async () => {
    if (!isStreaming) return;
    
    try {
      // Get latest device list
      videoDevicesRef.current = await getVideoDevices();
      
      if (videoDevicesRef.current.length <= 1) return;

      // Stop current stream
      stop();

      // Switch to next device
      const nextIndex = (currentDeviceIndex + 1) % videoDevicesRef.current.length;
      setCurrentDeviceIndex(nextIndex);
      
      // Start new stream
      await startStream(videoDevicesRef.current[nextIndex].deviceId);
    } catch (err) {
      console.error('Failed to switch camera:', err);
      throw err;
    }
  };

  const stop = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  return {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
    switchCamera,
  };
}

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

import { useState, useEffect } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

export function useWebcam(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // 获取所有视频输入设备
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !currentDeviceId) {
          setCurrentDeviceId(videoDevices[0].deviceId);
        }
      });
  }, []);

  // 监听流结束事件
  useEffect(() => {
    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };
    
    if (stream) {
      stream.getTracks().forEach((track) => 
        track.addEventListener("ended", handleStreamEnded)
      );
      return () => {
        stream.getTracks().forEach((track) =>
          track.removeEventListener("ended", handleStreamEnded)
        );
      };
    }
  }, [stream]);

  const start = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined
        }
      });
      setStream(mediaStream);
      setIsStreaming(true);
      return mediaStream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      setIsStreaming(false);
      setStream(null);
      throw error;
    }
  };

  const switchCamera = async () => {
    if (devices.length > 1) {
      try {
        // 找到下一个摄像头
        const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        const nextDeviceId = devices[nextIndex].deviceId;

        // 先获取新的流
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: nextDeviceId }
          }
        });

        // 停止旧的流
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // 设置新的设备和流
        setCurrentDeviceId(nextDeviceId);
        setStream(newStream);
        setIsStreaming(true);
        return newStream;
      } catch (error) {
        console.error('Failed to switch camera:', error);
        return stream; // 如果切换失败，返回当前流
      }
    }
    return stream;
  };

  const stop = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  const result: UseMediaStreamResult = {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
    devices,
    switchCamera
  };

  return result;
}

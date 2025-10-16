'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './styles.module.css';
import Image from 'next/image';
import { FaClock } from 'react-icons/fa6';
import {
  BiMicrophone,
  BiMicrophoneOff,
  BiVideo,
  BiVideoOff,
} from 'react-icons/bi';
import { FiPhone, FiPhoneMissed } from 'react-icons/fi';

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_CALL_SERVER_URL;
const ROOM_ID = 'teste-sala';

interface SignalData {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export default function VideoCall() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [onCall, setOnCall] = useState(false);
  const [bitrate, setBitrate] = useState(0);

  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join', ROOM_ID);
    });

    socketRef.current.on('signal', async ({ data }: { data: SignalData }) => {
      const pc = pcRef.current;
      if (!pc) return;

      if (data.sdp) {
        await pc.setRemoteDescription(data.sdp);
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit('signal', {
            roomId: ROOM_ID,
            data: { sdp: answer },
          });
        }
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (err) {
          console.error(err);
        }
      }
    });

    startLocalStream();

    return () => {
      pcRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, []);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Erro ao acessar câmera/microfone:', err);
    }
  };

  const startCall = async () => {
    if (!localStream) await startLocalStream();
    if (!localStream) return;

    const iceServers = process.env.NEXT_PUBLIC_ICE_SERVERS
      ? JSON.parse(process.env.NEXT_PUBLIC_ICE_SERVERS)
      : [];

    console.log(iceServers);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.relay.metered.ca:80' },
        {
          urls: 'turn:standard.relay.metered.ca:80',
          username: '8f54eab8cdd34d0912e9862d',
          credential: 'vYUPRukVEEQj9kF0',
        },
        {
          urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
          username: '8f54eab8cdd34d0912e9862d',
          credential: 'vYUPRukVEEQj9kF0',
        },
        {
          urls: 'turn:standard.relay.metered.ca:443',
          username: '8f54eab8cdd34d0912e9862d',
          credential: 'vYUPRukVEEQj9kF0',
        },
        {
          urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
          username: '8f54eab8cdd34d0912e9862d',
          credential: 'vYUPRukVEEQj9kF0',
        },
      ],
    });
    pcRef.current = pc;

    localStream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, localStream);

      if (track.kind === 'video') {
        const parameters = sender.getParameters();
        if (!parameters.encodings) parameters.encodings = [{}];
        parameters.encodings[0].maxBitrate = 5_000; // 500 kbps
        sender.setParameters(parameters).catch(console.error);
      }
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', {
          roomId: ROOM_ID,
          data: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('signal', {
      roomId: ROOM_ID,
      data: { sdp: offer },
    });

    setOnCall(true);
    monitorBitrate(pc);
  };

  const stopCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    setOnCall(false);
    setBitrate(0);
  };

  const monitorBitrate = (pc: RTCPeerConnection) => {
    let lastBytesSent = 0;
    const interval = setInterval(async () => {
      if (!pc) {
        clearInterval(interval);
        return;
      }
      const stats = await pc.getStats(null);
      stats.forEach((report) => {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          if (lastBytesSent) {
            const bytesDiff = report.bytesSent - lastBytesSent;
            const kbps = (bytesDiff * 8) / 5_000_000;
            setBitrate(kbps);
          }
          lastBytesSent = report.bytesSent;
        }
      });
    }, 1000);
  };

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicEnabled((prev) => !prev);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setVideoEnabled((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.profissional}>
          <Image
            src='/profile.jpg'
            alt='Imagem do profissional'
            height={35}
            width={35}
          />
          <div>
            <h5>Dra. Ana Silva</h5>
            <span>Sessão em andamento</span>
          </div>
        </div>
        <div className={styles.timer}>
          {' '}
          <FaClock color='#00c951' />
          45:32
        </div>
      </div>
      <div className={styles.videos}>
        <div className={styles.video}>
          <video ref={localVideoRef} autoPlay muted className={styles.local} />
        </div>
        <div className={styles.video}>
          <video ref={remoteVideoRef} autoPlay className={styles.remote} />
        </div>
      </div>
      <div className={styles.buttons}>
        {!onCall && (
          <button onClick={startCall}>
            <FiPhone color='#fff' className={styles.start} />
          </button>
        )}

        {onCall && (
          <>
            <button onClick={toggleMic}>
              {micEnabled ? (
                <BiMicrophone color='#000' className={styles.on} />
              ) : (
                <BiMicrophoneOff color='#fff' className={styles.off} />
              )}
            </button>
            <button onClick={toggleVideo}>
              {videoEnabled ? (
                <BiVideo color='#000' className={styles.on} />
              ) : (
                <BiVideoOff color='#fff' className={styles.off} />
              )}
            </button>
            <button onClick={stopCall}>
              <FiPhoneMissed color='#fff' className={styles.off} />
            </button>
          </>
        )}
      </div>
      <div className={styles.bitrate}>Bitrate atual: {bitrate} kbps</div>
    </div>
  );
}

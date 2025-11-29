'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './styles.module.css';
import Image from 'next/image';
import { FaClock } from 'react-icons/fa6';
import {
  BiMicrophone,
  BiMicrophoneOff,
  BiUserCircle,
  BiVideo,
  BiVideoOff,
} from 'react-icons/bi';
import { FiPhone, FiPhoneMissed } from 'react-icons/fi';
import { TbCameraRotate } from 'react-icons/tb';
import { SessaoCompleta } from '@/types/types';

const SIGNALING_SERVER = process.env.NEXT_PUBLIC_CALL_SERVER_URL;

interface SignalData {
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface PageProps {
  sessao: SessaoCompleta;
  me: { id: number; nome: string; email: string };
  outro: { id: number; nome: string; email: string };
}

export function VideoCall({ sessao, me, outro }: PageProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [onCall, setOnCall] = useState(false);
  const [bitrate, setBitrate] = useState(0);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [initialRemoteVideo, setInitialRemoteVideo] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startCall();
  }, [ready]);

  useEffect(() => {
    if (remoteVideoEnabled) setInitialRemoteVideo(false);
  }, [remoteVideoEnabled]);

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join', sessao.id_sessao);

      socketRef.current?.on('toggleVideo', ({ enabled, from }) => {
        if (from !== socketRef.current?.id) {
          setRemoteVideoEnabled(enabled);
        }
      });

      socketRef.current?.on(
        'signal',
        async ({ data }: { data: SignalData }) => {
          const pc = pcRef.current;
          if (!pc) return;

          if (data.sdp) {
            await pc.setRemoteDescription(data.sdp);
            if (data.sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socketRef.current?.emit('signal', {
                roomId: sessao.id_sessao,
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
        }
      );
      setReady(true);
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
        parameters.encodings[0].maxBitrate = 10_000_000;
        sender.setParameters(parameters).catch(console.error);
      }
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', {
          roomId: sessao.id_sessao,
          data: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        const stream = event.streams[0];
        remoteVideoRef.current.srcObject = stream;
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('signal', {
      roomId: sessao.id_sessao,
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
            const mbps = (bytesDiff * 8) / 1_000_000;
            setBitrate(mbps);
          }
          lastBytesSent = report.bytesSent;
        }
      });
    }, 1000);
  };

  const switchCamera = async () => {
    if (!localStream) return;

    try {
      const newFacingMode = isFrontCamera ? 'environment' : 'user';
      const videoTrack = localStream.getVideoTracks()[0];

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }

      localStream.removeTrack(videoTrack);
      videoTrack.stop();
      localStream.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }

      setLocalStream(newStream);
      setIsFrontCamera(!isFrontCamera);
    } catch (err) {
      console.error('Erro ao trocar câmera:', err);
    }
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

    const newEnabled = !videoEnabled;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = newEnabled;
    });

    setVideoEnabled(newEnabled);

    if (localVideoRef.current) {
      if (newEnabled) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(console.error);
      } else {
        localVideoRef.current.pause();
      }
    }

    socketRef.current?.emit('toggleVideo', {
      roomId: sessao.id_sessao,
      enabled: newEnabled,
      from: socketRef.current?.id,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.profissional}>
          <span className={`${styles.avatar} `}>
            {outro.nome.split(' ')[0][0]}
            {outro.nome.split(' ').length > 1
              ? outro.nome.split(' ')[outro.nome.split(' ').length - 1][0]
              : ''}
          </span>
          <div>
            <h5>{outro.nome}</h5>
            <span>Sessão em andamento</span>
          </div>
        </div>
        {/* <div className={styles.timer}>
          {' '}
          <FaClock color='#00c951' />
          <Contador hasCall={onCall} />
        </div> */}
      </div>
      <div className={styles.videos}>
        <div className={styles.video}>
          {!videoEnabled && <span className={styles.videoOff}>Eu</span>}
          <video
            style={{ display: videoEnabled ? 'block' : 'none' }}
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={styles.local}
          />
        </div>
        <div className={styles.video}>
          <video
            style={{
              display: remoteVideoEnabled && onCall ? 'block' : 'none',
            }}
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={styles.remote}
          />

          {!onCall && (
            <span className={`${styles.videoOff} ${styles.calling}`}>
              {outro.nome.split(' ')[0][0]}
              {outro.nome.split(' ').length > 1
                ? outro.nome.split(' ')[outro.nome.split(' ').length - 1][0]
                : ''}
            </span>
          )}

          {!remoteVideoEnabled && onCall && (
            <span className={styles.videoOff}>
              {outro.nome.split(' ')[0][0]}
              {outro.nome.split(' ').length > 1
                ? outro.nome.split(' ')[outro.nome.split(' ').length - 1][0]
                : ''}
            </span>
          )}

          <span className={styles.outro}>{outro.nome}</span>
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
            <button onClick={switchCamera}>
              <TbCameraRotate className={styles.on} />
            </button>
            <button onClick={stopCall}>
              <FiPhoneMissed color='#fff' className={styles.off} />
            </button>
          </>
        )}
      </div>
      {/* <div className={styles.bitrate}>Bitrate atual: {bitrate} mbps</div> */}
    </div>
  );
}

export function Contador({ hasCall }: { hasCall: boolean }) {
  const [segundosTotais, setSegundosTotais] = useState(0);

  useEffect(() => {
    if (!hasCall) return;

    const intervalo = setInterval(() => {
      setSegundosTotais((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [hasCall]);

  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;

  const formatTempo = `${
    horas > 0 ? `${horas.toString().padStart(2, '0')}:` : ''
  }${minutos.toString().padStart(2, '0')}:${segundos
    .toString()
    .padStart(2, '0')}`;

  return <>{formatTempo}</>;
}

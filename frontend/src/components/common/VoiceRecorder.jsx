import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Save, X, Pause } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import toast from 'react-hot-toast';

export default function VoiceRecorder({ onSave, onCancel }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { // 2 minute limit
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      padding: 'var(--spacing-md)', 
      borderRadius: 'var(--radius-md)', 
      border: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('add_voice_note') || 'Add Voice Note'}</span>
        <button onClick={onCancel} style={{ color: 'var(--color-text-secondary)' }}><X size={20}/></button>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--color-background)',
        borderRadius: 'var(--radius-sm)',
        gap: '12px'
      }}>
        {!audioUrl ? (
          <>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: isRecording ? 'var(--color-error)' : 'var(--color-text)',
              fontFamily: 'monospace'
            }}>
              {formatTime(recordingTime)}
            </div>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    background: 'var(--color-error)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                  }}
                  className="hover-scale"
                >
                  <Mic size={28} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    style={{ 
                      width: '50px', height: '50px', borderRadius: '50%', 
                      background: 'var(--color-surface)', color: 'var(--color-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--color-border)'
                    }}
                    className="hover-scale"
                  >
                    {isPaused ? <Mic size={22} /> : <Pause size={22} />}
                  </button>
                  <button 
                    onClick={stopRecording}
                    style={{ 
                      width: '60px', height: '60px', borderRadius: '50%', 
                      background: 'var(--color-text)', color: 'var(--color-surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none'
                    }}
                    className="hover-scale"
                  >
                    <Square size={28} />
                  </button>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Tap to start (Max 2m)'}
            </div>
          </>
        ) : (
          <>
            <audio src={audioUrl} controls style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                onClick={handleReset}
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
              >
                <Trash2 size={18} /> {t('retry') || 'Retry'}
              </button>
              <button 
                onClick={() => onSave(audioBlob)}
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
              >
                <Save size={18} /> {t('save') || 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

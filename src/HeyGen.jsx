
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Configuration, StreamingAvatarApi } from '@heygen/streaming-avatar';
import { ScaleLoader } from 'react-spinners';

// Predefined Avatar ID and Voice ID
const predefinedAvatarId = "Angela-inblackskirt-20220820";
const predefinedVoiceId = "1bd001e7e50f421d891986aad5158bc8";

const HeyGen = forwardRef((props, ref) => {
    const [stream, setStream] = useState(null);
    const [debug, setDebug] = useState('');
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(true);
    const avatar = useRef(null);
    const [data, setData] = useState(null);

    useImperativeHandle(ref, () => ({
        speakText: async (textToSpeak) => {
            if (!initialized || !avatar.current) {
                console.error('Avatar API not initialized');
                setDebug('Avatar API not initialized');
                return;
            }
            try {
                const response = await avatar.current.speak({
                    taskRequest: {
                        text: textToSpeak,
                        sessionId: data?.sessionId
                    }
                });
                if (response.error) {
                    console.error('Error during speak request:', response.error);
                    setDebug(response.error.message);
                } else {
                    console.log(`Speak request successful: ${JSON.stringify(response)}`);
                }
            } catch (e) {
                setDebug(e.message);
                console.error('Catch block error during speak request:', e);
            }
        }
    }));

    const fetchAccessToken = async () => {
        try {
            console.log('Fetching access token...');
            const response = await fetch('https://daniyal-ielts-51fa2cefcad8.herokuapp.com/get-access-token', {
                method: 'POST'
            });
            const result = await response.json();
            if (result.token) {
                const token = result.token;
                console.log('Access token fetched:', token);
                return token;
            } else {
                throw new Error('Token not available in fetch result');
            }
        } catch (error) {
            console.error('Error fetching access token:', error);
            setDebug('Error fetching access token');
            throw error;
        }
    };

    const resetState = () => {
        setStream(null);
        setDebug('');
        setInitialized(false);
        setLoading(true);
        setData(null);
    };

    const grab = async () => {
        resetState(); // Сброс состояния перед новой инициализацией
        try {
            await updateToken();

            if (!avatar.current) {
                setDebug('Avatar API is not initialized');
                return;
            }

            console.log('Starting avatar session...');
            const res = await avatar.current.createStartAvatar({
                newSessionRequest: {
                    quality: "high",
                    avatarName: predefinedAvatarId,
                    voice: { voiceId: predefinedVoiceId }
                }
            }, setDebug);

            if (!res || !res.sessionId) {
                console.error('Invalid session response:', res);
                if (res && res.error) {
                    console.error('Error details:', res.error);
                    setDebug(`Failed to start avatar session. Error: ${res.error.message}`);
                } else {
                    setDebug('Failed to start avatar session. Invalid session response.');
                }
                return;
            }
            
            setData(res);
            console.log('Avatar session started:', res);
            setStream(avatar.current.mediaStream);
            setLoading(false);
        } catch (error) {
            console.error('Error starting avatar session:', error);
            setDebug(`Error starting avatar session: ${error.message}`);
            setLoading(false);
        }
    };

    const updateToken = async () => {
        try {
            console.log('Updating token...');
            const newToken = await fetchAccessToken();
            console.log('New token received:', newToken);

            avatar.current = new StreamingAvatarApi(
                new Configuration({ accessToken: newToken })
            );

            avatar.current.addEventHandler("avatar_start_talking", (e) => {
                console.log("Avatar started talking", e);
            });

            avatar.current.addEventHandler("avatar_stop_talking", (e) => {
                console.log("Avatar stopped talking", e);
            });

            avatar.current.addEventHandler("connection_state_change", (e) => {
                console.log("Connection state change", e);
            });

            avatar.current.addEventHandler("ice_connection_state_change", (e) => {
                console.log("ICE connection state change", e);
            });

            avatar.current.addEventHandler("error", (e) => {
                console.error("Avatar error", e);
            });

            setInitialized(true);
            console.log('Token updated and avatar API initialized');
        } catch (error) {
            console.error('Error updating token:', error);
            setDebug(`Error updating token: ${error.message}`);
        }
    };

    useEffect(() => {
        grab();
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', resetState);
        return () => window.removeEventListener('beforeunload', resetState);
    }, []);

    useEffect(() => {
        if (stream) {
            console.log('Stream:', stream);
            const videoElement = document.getElementById('myVideoElement');
            if (videoElement) {
                console.log('Setting video stream to video element');
                videoElement.srcObject = stream;
                videoElement.muted = false;
                videoElement.volume = 1.0;

                videoElement.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    videoElement.play().catch(e => console.log('Play error:', e));
                };
                videoElement.onabort = () => console.log('Video abort');
                videoElement.onerror = (e) => console.log('Video error', e);
            } else {
                console.error('Failed to find video element');
            }
        } else {
            console.log('No stream available to set to video element');
        }
    }, [stream]);

    return (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <video
                id="myVideoElement"
                autoPlay
                playsInline
                style={{ width: '400px', height: '500px', objectFit: 'cover' }}
            ></video>
            {loading && (
                <div className="loader-container" style={{
                    position: 'absolute', zIndex: 1, top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }}>
                    <ScaleLoader color="#36d7b7" />
                </div>
            )}
        </div>
    );
});

export default HeyGen;
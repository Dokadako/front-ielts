import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Configuration, StreamingAvatarApi } from '@heygen/streaming-avatar';

// Predefined Avatar ID and Voice ID
const predefinedAvatarId = "Angela-inblackskirt-20220820";
const predefinedVoiceId = "1bd001e7e50f421d891986aad5158bc8";

const HeyGen = forwardRef((props, ref) => {
    const [stream, setStream] = useState(null);
    const [debug, setDebug] = useState('');
    const [initialized, setInitialized] = useState(false);
    const avatar = useRef(null);
    const [data, setData] = useState(null);

    useImperativeHandle(ref, () => ({
        speakText: async (textToSpeak) => {
            if (!initialized || !avatar.current) {
                console.error('Avatar API not initialized');
                return;
            }
            await avatar.current.speak({ taskRequest: { text: textToSpeak, sessionId: data?.sessionId } }).catch((e) => {
                setDebug(e.message);
            });
        }
    }));

    const fetchAccessToken = async () => {
        try {
            const response = await fetch('http://localhost:3001/get-access-token', {
                method: 'POST'
            });
            const result = await response.json();
            const token = result.token;
            return token;
        } catch (error) {
            console.error('Error fetching access token:', error);
            return '';
        }
    };

    const grab = async () => {
        await updateToken();

        if (!avatar.current) {
            setDebug('Avatar API is not initialized');
            return;
        }

        try {
            const res = await avatar.current.createStartAvatar(
                {
                    newSessionRequest: {
                        quality: "high",
                        avatarName: predefinedAvatarId,
                        voice: { voiceId: predefinedVoiceId }
                    }
                }, setDebug);
            setData(res);
            setStream(avatar.current.mediaStream);
        } catch (error) {
            console.error('Error starting avatar session:', error);
        }
    };

    const updateToken = async () => {
        const newToken = await fetchAccessToken();
        avatar.current = new StreamingAvatarApi(
            new Configuration({ accessToken: newToken })
        );

        avatar.current.addEventHandler("avatar_start_talking", (e) => {
            console.log("Avatar started talking", e);
        });

        avatar.current.addEventHandler("avatar_stop_talking", (e) => {
            console.log("Avatar stopped talking", e);
        });

        setInitialized(true);
    };

    useEffect(() => {
        grab();
    }, []);

    useEffect(() => {
        if (stream) {
            const videoElement = document.getElementById('myVideoElement');
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.muted = false;  // Ensure the video is not muted
                videoElement.volume = 1.0;  // Set volume to maximum
            }
        }
    }, [stream]);

    return (
        <div>
            <video
                id="myVideoElement"
                autoPlay
                playsInline
                style={{ width: '500px', height: '400px' }} // Задайте здесь желаемые размеры
            ></video>
            {/* <div id="debug">{debug}</div> */}
        </div>
    );
});

export default HeyGen; 
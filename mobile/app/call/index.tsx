// Import React Hooks
import React, { useEffect, useRef, useState } from 'react';
// Import user interface elements
import {
    Alert,
    KeyboardAvoidingView,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// Import Agora SDK
import {
    ChannelProfileType,
    ClientRoleType,
    createAgoraRtcEngine,
    IRtcEngine,
    IRtcEngineEventHandler,
    RtcConnection,
    RtcSurfaceView,
    VideoSourceType,
} from 'react-native-agora';

const Call = () => {
    // Connection states
    const [isJoined, setIsJoined] = useState(false);
    const [isHost, setIsHost] = useState(true);
    const [remoteUid, setRemoteUid] = useState(0);
    const [message, setMessage] = useState('');

    // Input fields
    const [appId, setAppId] = useState('c202b04bd9824b99b6e0b2ff0dc85841');
    // const [appId, setAppId] = useState('4c8fdbe591a74040afd2e3c1c7213f57');
    const [token, setToken] = useState('');
    const [channelName, setChannelName] = useState('');
    const [localUid, setLocalUid] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);

    // Agora engine reference
    const agoraEngineRef = useRef<IRtcEngine | null>(null);
    const eventHandler = useRef<IRtcEngineEventHandler | null>(null);

    useEffect(() => {
        const init = async () => {
            await setupVideoSDKEngine();
        };
        init();
        return () => {
            cleanupAgoraEngine();
        };
    }, []);

    const setupVideoSDKEngine = async () => {
        try {
            if (Platform.OS === 'android') {
                await getPermission();
            }
            agoraEngineRef.current = createAgoraRtcEngine();
            const agoraEngine = agoraEngineRef.current;
            await agoraEngine.initialize({ appId: appId });
        } catch (e) {
            console.error('Failed to initialize Agora engine', e);
            setMessage('Failed to initialize: ' + JSON.stringify(e));
        }
    };

    const setupEventHandler = () => {
        eventHandler.current = {
            onJoinChannelSuccess: () => {
                setMessage('Successfully joined channel: ' + channelName);
                setIsJoined(true);
            },
            onUserJoined: (_connection: RtcConnection, uid: number) => {
                setMessage('Remote user ' + uid + ' joined');
                setRemoteUid(uid);
            },
            onUserOffline: (_connection: RtcConnection, uid: number) => {
                setMessage('Remote user ' + uid + ' left the channel');
                setRemoteUid(0);
            },
        };
        agoraEngineRef.current?.registerEventHandler(eventHandler.current);
    };

    const setupLocalVideo = () => {
        agoraEngineRef.current?.enableVideo();
        agoraEngineRef.current?.startPreview();
    };

    const configureCall = () => {
        if (!token || !channelName || !localUid) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setupEventHandler();
            setupLocalVideo();
            setIsConfigured(true);
        } catch (e) {
            console.error('Failed to configure call', e);
            setMessage('Failed to configure: ' + JSON.stringify(e));
        }
    };

    const join = async () => {
        if (isJoined) {
            return;
        }

        try {
            const uid = parseInt(localUid);
            if (isHost) {
                agoraEngineRef.current?.joinChannel(token, channelName, uid, {
                    channelProfile: ChannelProfileType.ChannelProfileCommunication,
                    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                    publishMicrophoneTrack: true,
                    publishCameraTrack: true,
                    autoSubscribeAudio: true,
                    autoSubscribeVideo: true,
                });
            } else {
                agoraEngineRef.current?.joinChannel(token, channelName, uid, {
                    channelProfile: ChannelProfileType.ChannelProfileCommunication,
                    clientRoleType: ClientRoleType.ClientRoleAudience,
                    publishMicrophoneTrack: false,
                    publishCameraTrack: false,
                    autoSubscribeAudio: true,
                    autoSubscribeVideo: true,
                });
            }
        } catch (e) {
            console.error('Failed to join channel', e);
            setMessage('Failed to join: ' + JSON.stringify(e));
        }
    };

    const leave = () => {
        try {
            agoraEngineRef.current?.leaveChannel();
            setRemoteUid(0);
            setIsJoined(false);
            showMessage('Left the channel');
        } catch (e) {
            console.error('Failed to leave channel', e);
            setMessage('Failed to leave: ' + JSON.stringify(e));
        }
    };

    const resetConfiguration = () => {
        leave();
        setIsConfigured(false);
    };

    const cleanupAgoraEngine = () => {
        if (isJoined) {
            leave();
        }
        agoraEngineRef.current?.unregisterEventHandler(eventHandler.current!);
        agoraEngineRef.current?.release();
    };

    function showMessage(msg: string) {
        setMessage(msg);
    }

    // Configuration UI
    if (!isConfigured) {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.formContainer}>
                            <Text style={styles.title}>Configure Video Call</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>App ID</Text>
                                <TextInput
                                    style={styles.input}
                                    value={appId}
                                    onChangeText={setAppId}
                                    placeholder="Enter App ID"
                                    placeholderTextColor="#8D8D8D"
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Token <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={token}
                                    onChangeText={setToken}
                                    placeholder="Enter token"
                                    placeholderTextColor="#8D8D8D"
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Channel Name <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={channelName}
                                    onChangeText={setChannelName}
                                    placeholder="Enter channel name"
                                    placeholderTextColor="#8D8D8D"
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Local UID <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={localUid}
                                    onChangeText={setLocalUid}
                                    placeholder="Enter your UID (numbers only)"
                                    placeholderTextColor="#8D8D8D"
                                    keyboardType="numeric"
                                />
                            </View>
                            
                            <View style={styles.roleContainer}>
                                <Text style={styles.label}>User Role:</Text>
                                <View style={styles.switchContainer}>
                                    <Text>Audience</Text>
                                    <Switch
                                        onValueChange={setIsHost}
                                        value={isHost}
                                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                                        thumbColor={isHost ? "#0055cc" : "#f4f3f4"}
                                    />
                                    <Text>Host</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.configButton}
                                onPress={configureCall}
                            >
                                <Text style={styles.buttonText}>Configure Call</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Call UI (after configuration)
    return (
        <SafeAreaView style={styles.main}>
            <Text style={styles.head}>Agora Video Call</Text>
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Channel: {channelName}</Text>
                <Text style={styles.infoText}>UID: {localUid}</Text>
                <Text style={styles.infoText}>Role: {isHost ? 'Host' : 'Audience'}</Text>
            </View>
            <View style={styles.btnContainer}>
                {!isJoined ? (
                    <TouchableOpacity style={styles.joinButton} onPress={join}>
                        <Text style={styles.buttonText}>Join Call</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.leaveButton} onPress={leave}>
                        <Text style={styles.buttonText}>Leave Call</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.resetButton} onPress={resetConfiguration}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContainer}>
                {isJoined && isHost ? (
                    <View style={styles.videoContainer}>
                        <Text style={styles.uidLabel}>Local user: {localUid}</Text>
                        <RtcSurfaceView 
                            canvas={{ 
                                uid: parseInt(localUid, 10), 
                                sourceType: VideoSourceType.VideoSourceCamera 
                            }} 
                            style={styles.videoView} 
                        />
                    </View>
                ) : (
                    <Text style={styles.waitingText}>
                        {!isJoined ? 'Click Join to start the call' : 'Viewing as audience'}
                    </Text>
                )}
                {isJoined && remoteUid !== 0 ? (
                    <View style={styles.videoContainer}>
                        <Text style={styles.uidLabel}>Remote user: {remoteUid}</Text>
                        <RtcSurfaceView 
                            canvas={{ 
                                uid: remoteUid, 
                                sourceType: VideoSourceType.VideoSourceCamera 
                            }} 
                            style={styles.videoView} 
                        />
                    </View>
                ) : (
                    <Text style={styles.waitingText}>
                        {isJoined ? 'Waiting for remote user to join' : ''}
                    </Text>
                )}
                {message ? <Text style={styles.info}>{message}</Text> : null}
            </ScrollView>
        </SafeAreaView>
    );
};

// Request permissions for Android
const getPermission = async () => {
    if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
    }
};

// Enhanced styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#333',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#333',
    },
    required: {
        color: 'red',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    roleContainer: {
        marginVertical: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    configButton: {
        backgroundColor: '#0055cc',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Call UI styles
    main: { 
        flex: 1, 
        alignItems: 'center', 
        backgroundColor: '#F5F5F5',
        paddingTop: 40,
    },
    head: { 
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoContainer: {
        backgroundColor: '#E8EAF6',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        width: '90%',
    },
    infoText: {
        fontSize: 14,
        marginBottom: 4,
    },
    btnContainer: { 
        flexDirection: 'row', 
        justifyContent: 'center',
        marginBottom: 16,
        width: '90%',
    },
    joinButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    leaveButton: {
        backgroundColor: '#F44336',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    resetButton: {
        backgroundColor: '#9E9E9E',
        borderRadius: 8,
        padding: 12,
        width: 80,
        alignItems: 'center',
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scroll: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    scrollContainer: { 
        alignItems: 'center',
        padding: 16, 
    },
    videoContainer: {
        width: '100%',
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
    },
    uidLabel: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: 'white',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        borderBottomRightRadius: 8,
    },
    videoView: { 
        width: '100%', 
        height: 300,
        borderRadius: 12,
    },
    waitingText: {
        marginVertical: 20,
        fontSize: 16,
        color: '#666',
    },
    info: { 
        backgroundColor: '#FFF9C4', 
        padding: 12,
        borderRadius: 8, 
        color: '#333',
        marginTop: 20,
        width: '100%',
    },
});

export default Call;
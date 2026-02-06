// Import React Hooks
import React, { useEffect, useRef, useState, useMemo } from 'react';
// Import user interface elements
import {
    Alert,
    BackHandler,
    KeyboardAvoidingView,
    PermissionsAndroid,
    Platform,
    PlatformColor,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';

// Conditional import for native-only Agora SDK
let ChannelProfileType: any, ClientRoleType: any, createAgoraRtcEngine: any, RtcSurfaceView: any, VideoSourceType: any;
type IRtcEngine = any;
type IRtcEngineEventHandler = any;
type RtcConnection = any;
if (Platform.OS !== 'web') {
    const Agora = require('react-native-agora');
    ChannelProfileType = Agora.ChannelProfileType;
    ClientRoleType = Agora.ClientRoleType;
    createAgoraRtcEngine = Agora.createAgoraRtcEngine;
    RtcSurfaceView = Agora.RtcSurfaceView;
    VideoSourceType = Agora.VideoSourceType;
}

const Call = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = useThemeColors();
    
    // Theme-aware colors for debug screen
    const themedColors = useMemo(() => ({
        background: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : (isDark ? '#1C1C1E' : '#F5F5F5'),
        cardBackground: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.surface,
        text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
        secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
        inputBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : (isDark ? '#2C2C2E' : '#F5F5F5'),
        border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
        infoBg: isDark ? '#2C3E50' : '#E8EAF6',
        warnBg: isDark ? '#5D4037' : '#FFF9C4',
        // Call action colors
        systemGreen: Platform.OS === 'ios' ? (PlatformColor('systemGreen') as unknown as string) : '#34C759',
        systemRed: Platform.OS === 'ios' ? (PlatformColor('systemRed') as unknown as string) : '#FF3B30',
        systemBlue: Platform.OS === 'ios' ? (PlatformColor('systemBlue') as unknown as string) : '#007AFF',
        systemGray: Platform.OS === 'ios' ? (PlatformColor('systemGray') as unknown as string) : '#8E8E93',
        systemGray4: Platform.OS === 'ios' ? (PlatformColor('systemGray4') as unknown as string) : isDark ? '#3A3A3C' : '#D1D1D6',
    }), [isDark, colors]);
    
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

    // Android hardware back button handling
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isJoined) {
                leave();
            } else {
                router.back();
            }
            return true;
        });
        return () => backHandler.remove();
    }, [isJoined]);

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
            <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoid}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={[styles.formContainer, { backgroundColor: themedColors.cardBackground }]}>
                            <Text style={[styles.title, { color: themedColors.text }]}>Configure Video Call</Text>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themedColors.text }]}>App ID</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: themedColors.inputBackground, borderColor: themedColors.border, color: themedColors.text }]}
                                    value={appId}
                                    onChangeText={setAppId}
                                    placeholder="Enter App ID"
                                    placeholderTextColor={isDark ? '#9CA3AF' : '#8D8D8D'}
                                    keyboardAppearance={isDark ? 'dark' : 'light'}
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themedColors.text }]}>Token <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: themedColors.inputBackground, borderColor: themedColors.border, color: themedColors.text }]}
                                    value={token}
                                    onChangeText={setToken}
                                    placeholder="Enter token"
                                    placeholderTextColor={isDark ? '#9CA3AF' : '#8D8D8D'}
                                    keyboardAppearance={isDark ? 'dark' : 'light'}
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themedColors.text }]}>Channel Name <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: themedColors.inputBackground, borderColor: themedColors.border, color: themedColors.text }]}
                                    value={channelName}
                                    onChangeText={setChannelName}
                                    placeholder="Enter channel name"
                                    placeholderTextColor={isDark ? '#9CA3AF' : '#8D8D8D'}
                                    keyboardAppearance={isDark ? 'dark' : 'light'}
                                />
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: themedColors.text }]}>Local UID <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: themedColors.inputBackground, borderColor: themedColors.border, color: themedColors.text }]}
                                    value={localUid}
                                    onChangeText={setLocalUid}
                                    placeholder="Enter your UID (numbers only)"
                                    placeholderTextColor={isDark ? '#9CA3AF' : '#8D8D8D'}
                                    keyboardType="numeric"
                                    keyboardAppearance={isDark ? 'dark' : 'light'}
                                />
                            </View>
                            
                            <View style={styles.roleContainer}>
                                <Text style={[styles.label, { color: themedColors.text }]}>User Role:</Text>
                                <View style={styles.switchContainer}>
                                    <Text style={{ color: themedColors.text }}>Audience</Text>
                                    <Switch
                                        onValueChange={(value) => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setIsHost(value);
                                        }}
                                        value={isHost}
                                        trackColor={{ false: themedColors.systemGray4, true: themedColors.systemBlue }}
                                        thumbColor={Platform.OS === 'ios' ? undefined : (isHost ? themedColors.systemBlue : isDark ? '#FFFFFF' : "#f4f3f4")}
                                        ios_backgroundColor={themedColors.systemGray4}
                                    />
                                    <Text style={{ color: themedColors.text }}>Host</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.configButton, { backgroundColor: themedColors.systemBlue }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    configureCall();
                                }}
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
        <SafeAreaView style={[styles.main, { paddingTop: insets.top, backgroundColor: themedColors.background }]} edges={['left', 'right', 'bottom']}>
            <Text style={[styles.head, { color: themedColors.text }]}>Agora Video Call</Text>
            <View style={[styles.infoContainer, { backgroundColor: themedColors.infoBg }]}>
                <Text style={[styles.infoText, { color: themedColors.text }]}>Channel: {channelName}</Text>
                <Text style={[styles.infoText, { color: themedColors.text }]}>UID: {localUid}</Text>
                <Text style={[styles.infoText, { color: themedColors.text }]}>Role: {isHost ? 'Host' : 'Audience'}</Text>
            </View>
            <View style={styles.btnContainer}>
                {!isJoined ? (
                    <TouchableOpacity style={[styles.joinButton, { backgroundColor: themedColors.systemGreen }]} onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        join();
                    }}>
                        <Text style={styles.buttonText}>Join Call</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.leaveButton, { backgroundColor: themedColors.systemRed }]} onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        leave();
                    }}>
                        <Text style={styles.buttonText}>Leave Call</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.resetButton, { backgroundColor: themedColors.systemGray }]} onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    resetConfiguration();
                }}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                style={[styles.scroll, { backgroundColor: themedColors.cardBackground }]}
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
                    <Text style={[styles.waitingText, { color: themedColors.secondaryText }]}>
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
                    <Text style={[styles.waitingText, { color: themedColors.secondaryText }]}>
                        {isJoined ? 'Waiting for remote user to join' : ''}
                    </Text>
                )}
                {message ? <Text style={[styles.info, { backgroundColor: themedColors.warnBg, color: themedColors.text }]}>{message}</Text> : null}
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

// Enhanced styles - colors are now applied inline with themedColors
const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor set dynamically
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
        // backgroundColor set dynamically
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
        // color set dynamically
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        // color set dynamically
    },
    required: {
        color: 'red',
    },
    input: {
        // backgroundColor, borderColor, color set dynamically
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
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
        // backgroundColor set dynamically with themedColors.systemBlue
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: 'white', // White on colored buttons
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Call UI styles
    main: { 
        flex: 1, 
        alignItems: 'center', 
        // backgroundColor set dynamically
    },
    head: { 
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        // color set dynamically
    },
    infoContainer: {
        // backgroundColor set dynamically
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        width: '90%',
    },
    infoText: {
        fontSize: 14,
        marginBottom: 4,
        // color set dynamically
    },
    btnContainer: { 
        flexDirection: 'row', 
        justifyContent: 'center',
        marginBottom: 16,
        width: '90%',
    },
    joinButton: {
        // backgroundColor set dynamically with themedColors.systemGreen
        borderRadius: 8,
        padding: 12,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    leaveButton: {
        // backgroundColor set dynamically with themedColors.systemRed
        borderRadius: 8,
        padding: 12,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    resetButton: {
        // backgroundColor set dynamically with themedColors.systemGray
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
        // backgroundColor set dynamically
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
        backgroundColor: '#333333', // Dark for video placeholder
    },
    uidLabel: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.6)', // Overlay label
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
        // color set dynamically
    },
    info: { 
        // backgroundColor set dynamically
        padding: 12,
        borderRadius: 8, 
        // color set dynamically
        marginTop: 20,
        width: '100%',
    },
});

export default Call;
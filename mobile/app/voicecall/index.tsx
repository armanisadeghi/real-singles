// Import React Hooks
import { getAgoraCallRefreshToken } from "@/lib/api";
import { getCurrentUserId } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
// Import user interface elements
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Import Agora SDK
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  IRtcEngineEventHandler,
  RtcConnection
} from "react-native-agora";

const VoiceCall = () => {
  // Connection states
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(true);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [showControls, setShowControls] = useState(true);
  // const [userId, setUserId] = useState('');
  // const userid = getCurrentUserId();
  const router = useRouter();
  const {
    channel,
    token: tokenFromParams,
    uid: uidFromParams,
    calleeId,
  } = useLocalSearchParams<{
    channel: string;
    token?: string;
    uid?: string;
    calleeId: string;
  }>();

  // Input fields
  const [appId, setAppId] = useState("c202b04bd9824b99b6e0b2ff0dc85841");
  const [token, setToken] = useState<string | null>(tokenFromParams || null);
  const [channelName, setChannelName] = useState(channel);
  const [localUid, setLocalUid] = useState<string | null>(uidFromParams || null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Agora engine reference
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const eventHandler = useRef<IRtcEngineEventHandler | null>(null);
  const controlsTimerRef = useRef<any>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Set a timeout for the call initiator.
    // If the remote user doesn't join within 45s, end the call.
    if (tokenFromParams) {
      callTimeoutRef.current = setTimeout(() => {
        Alert.alert("No Answer", "The user did not pick up the call.", [
          { text: "OK", onPress: leave },
        ]);
      }, 45000); // 45 seconds
    }

    // Cleanup timeout on component unmount
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [tokenFromParams]);

  useEffect(() => {
    // If the remote user joins, clear the timeout.
    if (remoteUid !== 0 && callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, [remoteUid]);

  useEffect(() => {
    const joinChannelInternal = async (
      tokenToJoin: string,
      channelToJoin: string,
      uidToJoin: string
    ) => {
      try {
        const uid = parseInt(uidToJoin, 10);
        console.log("Joining channel with values:", {
          token: tokenToJoin,
          channelName: channelToJoin,
          uid: uid,
        });

        agoraEngineRef.current?.joinChannel(tokenToJoin, channelToJoin, uid, {
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });
      } catch (error) {
        console.error("Failed to join channel", error);
        setMessage("Failed to join: " + JSON.stringify(error));
      }
    };

    const init = async () => {
      try {
        if (!channelName) {
          Alert.alert("Error", "Channel name is required.");
          router.back();
          return;
        }

        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
          Alert.alert("Error", "User not logged in.");
          router.back();
          return;
        }

        await setupVideoSDKEngine();
        setupEventHandler();
        await setupLocalVideo();

        let tokenToUse = token;
        let uidToUse = localUid;

        if (!tokenToUse || !uidToUse) {
          // This is the CALLEE. Fetch a new token using the refresh token API.
          console.log("Callee detected. Fetching refresh token...");

          // Generate a random UID as requested
          const randomUid = Math.floor(Math.random() * 1000000000).toString();

          const formData = new FormData();
          formData.append("type", "video");
          formData.append("userId", currentUserId);
          formData.append("channelName", channelName);
          formData.append("uid", randomUid); // Send a random UID

          const res = await getAgoraCallRefreshToken(formData);
          if (!res?.success || !res?.data?.token || !res?.data?.uid) {
            throw new Error("Failed for callee to get refresh token/uid");
          }
          tokenToUse = res.data.token;
          uidToUse = res.data.uid;
          setToken(tokenToUse);
          setLocalUid(uidToUse);
        }

        // Now, we are certain we have a token and uid, either from params or from the refresh API.
        if (tokenToUse && uidToUse) {
          await joinChannelInternal(tokenToUse, channelName, uidToUse);
        } else {
          Alert.alert("Error", "Could not obtain token or UID to join the call.");  
          throw new Error("Could not obtain token or UID to join the call.");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setMessage("Failed to initialize: " + JSON.stringify(error));
        Alert.alert("Error", "Failed to start video call. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cleanupAgoraEngine();
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showControls && isJoined) {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }

      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }

    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showControls, isJoined]);

  const setupVideoSDKEngine = async () => {
    try {
      if (Platform.OS === "android") {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      await agoraEngine.initialize({ appId: appId });
    } catch (e) {
      console.error("Failed to initialize Agora engine", e);
      setMessage("Failed to initialize: " + JSON.stringify(e));
    }
  };

  const setupEventHandler = () => {
    eventHandler.current = {
      onJoinChannelSuccess: () => {
        setMessage("Successfully joined channel: " + channelName);
        setIsJoined(true);
      },
      onUserJoined: (connection: RtcConnection, uid: number, elapsed: number) => {
        console.log("Remote user joined!", {
          connection,
          remoteUid: uid,
          elapsed,
        });
        setMessage("Remote user " + uid + " joined");
        setRemoteUid(uid);
      },
      onUserOffline: (_connection: RtcConnection, uid: number) => {
        setMessage("Remote user " + uid + " left the channel");
        setRemoteUid(null);
        router.back();
      },
    };
    agoraEngineRef.current?.registerEventHandler(eventHandler.current!);
  };

  const setupLocalVideo = async () => {
    await agoraEngineRef.current?.enableVideo();
    await agoraEngineRef.current?.startPreview();
  };

  const leave = () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      setRemoteUid(0);
      setIsJoined(false);
      setMessage("Left the channel");
      router.back();
    } catch (e) {
      console.error("Failed to leave channel", e);
      setMessage("Failed to leave: " + JSON.stringify(e));
    }
  };

  const cleanupAgoraEngine = () => {
    if (isJoined) {
      leave();
    }
    agoraEngineRef.current?.unregisterEventHandler(eventHandler.current!);
    agoraEngineRef.current?.release();
  };

  const toggleMute = () => {
    try {
      if (isMuted) {
        agoraEngineRef.current?.enableLocalAudio(true);
      } else {
        agoraEngineRef.current?.enableLocalAudio(false);
      }
      setIsMuted(!isMuted);
    } catch (e) {
      console.error("Failed to toggle mute", e);
    }
  };

  const toggleVideo = () => {
    try {
      if (isVideoEnabled) {
        agoraEngineRef.current?.disableVideo();
      } else {
        agoraEngineRef.current?.enableVideo();
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (e) {
      console.error("Failed to toggle video", e);
    }
  };

  const toggleSpeaker = () => {
    try {
      agoraEngineRef.current?.setEnableSpeakerphone(!isSpeakerEnabled);
      setIsSpeakerEnabled(!isSpeakerEnabled);
    } catch (e) {
      console.error("Failed to toggle speaker", e);
    }
  };

  const switchCamera = () => {
    try {
      agoraEngineRef.current?.switchCamera();
    } catch (e) {
      console.error("Failed to switch camera", e);
    }
  };

  const handleScreenPress = () => {
    setShowControls(!showControls);
  };

  function showMessage(msg: string) {
    setMessage(msg);
  }

  // Helper to format call duration
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isJoined && remoteUid !== 0) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setCallDuration(0);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isJoined, remoteUid]);

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }


  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#181C23" />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Setting up your call...</Text>
      </SafeAreaView>
    );
  }

  // Ongoing call UI
  return (
    <SafeAreaView style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#181C23" />
      <View style={styles.ongoingCallContainer}>
        <Ionicons name="call" size={48} color="#E38F28" style={{ marginBottom: 24 }} />
        <Text style={styles.ongoingCallTitle}>Voice Call</Text>
        <Text style={styles.ongoingCallStatus}>
          {isJoined && remoteUid !== 0
            ? `Ongoing call`
            : isJoined
            ? "Ringing..."
            : "Connecting..."}
        </Text>
        {isJoined && remoteUid !== 0 && (
          <Text style={styles.ongoingCallTimer}>{formatDuration(callDuration)}</Text>
        )}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={leave}
          >
            <Ionicons name="call" size={36} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleSpeaker}
          >
            <Ionicons
              name={isSpeakerEnabled ? "volume-high" : "volume-mute"}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
        {message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// Request permissions for Android
const getPermission = async () => {
  if (Platform.OS === "android") {
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
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#181C23",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  videosContainer: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
  },
  remoteVideoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  remoteVideo: {
    flex: 1,
  },
  localVideoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  localVideoPiP: {
    position: "absolute",
    width: 120,
    height: 160,
    top: 40,
    right: 20,
    zIndex: 10,
  },
  localVideoFull: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  videoDisabledContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: "#D32F2F",
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 15,
    transform: [{ rotate: "135deg" }],
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingText: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    padding: 20,
  },
  localLabel: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#ffffff",
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  remoteLabel: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "#ffffff",
    padding: 6,
    borderRadius: 4,
    fontSize: 14,
  },
  messageContainer: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 8,
  },
  messageText: {
    color: "#ffffff",
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
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
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },
  required: {
    color: "red",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  roleContainer: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  configButton: {
    backgroundColor: "#0055cc",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Call UI styles
  main: {
    flex: 1,
    // alignItems: "center",
    backgroundColor: "#181C23", // dark but not pure black
    // paddingTop: 40,
  },
  head: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: "#E8EAF6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "90%",
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  btnContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    width: "90%",
  },
  joinButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  leaveButton: {
    backgroundColor: "#F44336",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  resetButton: {
    backgroundColor: "#9E9E9E",
    borderRadius: 8,
    padding: 12,
    width: 80,
    alignItems: "center",
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContainer: {
    alignItems: "center",
    padding: 16,
  },
  videoContainer: {
    width: "100%",
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  uidLabel: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
    borderBottomRightRadius: 8,
  },
  videoView: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  //   waitingText: {
  //     marginVertical: 20,
  //     fontSize: 16,
  //     color: "#666",
  //   },
  info: {
    backgroundColor: "#FFF9C4",
    padding: 12,
    borderRadius: 8,
    color: "#333",
    marginTop: 20,
    width: "100%",
  },
  ongoingCallContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#181C23",
    padding: 20,
  },
  ongoingCallTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  ongoingCallStatus: {
    fontSize: 20,
    color: "#E38F28",
    marginBottom: 10,
    fontWeight: "600",
  },
  ongoingCallTimer: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 28,
    letterSpacing: 2,
  },
});

export default VoiceCall;

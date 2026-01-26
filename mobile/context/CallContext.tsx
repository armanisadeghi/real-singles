import { getAgoraChatToken } from "@/lib/api";
import {
  initChat,
  isChatInitialized,
  loginToChat,
  logoutFromChat,
  sendCustomMessage,
  setupMessageListener,
} from "@/services/agoraChatServices";
import { getCurrentUserId } from "@/utils/token";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

interface IncomingCall {
  callerId: string;
  channelName: string;
  type: 'video' | 'voice';
}

interface CallContextType {
  incomingCall: IncomingCall | null;
  isChatLoggedIn: boolean;
  loginToAgoraChat: () => Promise<void>;
  logoutFromAgoraChat: () => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  sendInvitation: (calleeId: string, channelName: string, options?: { type?: 'video' | 'voice' }) => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isChatLoggedIn, setIsChatLoggedIn] = useState(false);
  const router = useRouter();
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  const loginToAgoraChat = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not logged in");

    if (!isChatInitialized()) {
      await initChat();
    }

    // 🔥 FORCE logout before login (fixes error 218)
    try {
      await logoutFromChat();
    } catch (e) {
      // ignore if not logged in
    }

    const res = await getAgoraChatToken(userId);
    const tokenData = res.data;

    // Handle case when Agora is not configured (development mode)
    if (tokenData?.configured === false) {
      console.log("Agora Chat not configured - skipping chat login");
      setIsChatLoggedIn(false);
      return;
    }

    if (!tokenData?.userToken) {
      throw new Error("Failed to get chat token");
    }

    await loginToChat(userId, tokenData.userToken);

    setIsChatLoggedIn(true);

    // Clean old listener
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
      listenerCleanupRef.current = null;
    }

    const cleanup = setupMessageListener((messages) => {
      messages.forEach((msg) => {
        if (msg.body.type === "custom") {
          const body = msg.body as any;

          if (body.event === "call_invitation") {
            setIncomingCall({
              callerId: msg.from,
              channelName: body.params.channelName,
              type: body.params.type || "video",
            });
          }

          if (body.event === "call_rejected") {
            if (router.canGoBack()) router.back();
          }
        }
      });
    });

    listenerCleanupRef.current = cleanup;

  } catch (error) {
    console.error("Failed to login to Agora Chat:", error);
  }
};


  // const loginToAgoraChat = async () => {
  //   try {
  //     const userId = await getCurrentUserId();
  //     if (!userId) {
  //       throw new Error("User not logged in");
  //     }

  //     // Only initialize if not already initialized
  //     if (!isChatInitialized()) {
  //       await initChat();
  //     }

  //     // Only login if not already logged in
  //     if (!isChatLoggedIn) {
  //       const res = await getAgoraChatToken(userId);
  //       const tokenData = res.data;
  //       console.log("Agora Chat Token response:", tokenData);
        
  //       if (!tokenData || !tokenData.userToken) {
  //         throw new Error("Failed to get chat token");
  //       }

  //       await loginToChat(userId, tokenData?.userToken);
  //     }
      
  //     setIsChatLoggedIn(true);

  //     // Clean up previous listener if exists
  //     if (listenerCleanupRef.current) {
  //       listenerCleanupRef.current();
  //       listenerCleanupRef.current = null;
  //     }

  //     // Setup listener for call-related messages only
  //     const cleanup = setupMessageListener((messages) => {
  //       messages.forEach((msg) => {
  //         if (
  //           msg.body.type === "custom" &&
  //           (msg.body as any).event === "call_invitation"
  //         ) {
  //           const { channelName, type } = (msg.body as any).params;
  //           setIncomingCall({
  //             callerId: msg.from,
  //             channelName: channelName,
  //             type: type || 'video',
  //           });
  //         } else if (
  //           msg.body.type === "custom" &&
  //           (msg.body as any).event === "call_rejected"
  //         ) {
  //           // Handle call rejection, maybe show an alert
  //           console.log("Call rejected by", msg.from);
  //           // Could use a toast or alert here
  //           if (router.canGoBack()) {
  //               router.back();
  //           }
  //         }
  //       });
  //     });

  //     listenerCleanupRef.current = cleanup;
  //   } catch (error) {
  //     console.error("Failed to login to Agora Chat:", error);
  //   }
  // };

  const logoutFromAgoraChat = async () => {
  try {
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
      listenerCleanupRef.current = null;
    }

    await logoutFromChat();

    // 🔥 RESET UI STATE
    setIsChatLoggedIn(false);
    setIncomingCall(null);
  } catch (error) {
    console.error("Failed to logout from Agora Chat:", error);
  }
};


  // const logoutFromAgoraChat = async () => {
  //   try {
  //     // Clean up listener before logout
  //     if (listenerCleanupRef.current) {
  //       listenerCleanupRef.current();
  //       listenerCleanupRef.current = null;
  //     }
  //     await logoutFromChat();
  //     setIsChatLoggedIn(false);
  //   } catch (error) {
  //     console.error("Failed to logout from Agora Chat:", error);
  //   }
  // };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
        listenerCleanupRef.current = null;
      }
    };
  }, []);

  const sendInvitation = async (calleeId: string, channelName: string, options?: { type?: 'video' | 'voice' }) => {
    try {
      const type = options?.type || 'video';
      await sendCustomMessage(calleeId, "call_invitation", { channelName, type });
      console.log(`Call invitation (${type}) sent to`, calleeId);
    } catch (error) {
      console.error("Failed to send call invitation:", error);
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      const screen = incomingCall.type === 'voice' ? '/voicecall' : '/videocall';
      router.push({
        pathname: screen as any,
        params: {
          channel: incomingCall.channelName,
          calleeId: incomingCall.callerId,
        },
      });
      setIncomingCall(null);
    }
  };

  const rejectCall = async () => {
    if (incomingCall) {
      try {
        await sendCustomMessage(incomingCall.callerId, "call_rejected", {});
        console.log("Call rejection sent to", incomingCall.callerId);
      } catch (error) {
        console.error("Failed to send rejection:", error);
      }
      setIncomingCall(null);
    }
  };

  const value = {
    incomingCall,
    isChatLoggedIn,
    loginToAgoraChat,
    logoutFromAgoraChat,
    acceptCall,
    rejectCall,
    sendInvitation,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}; 
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useRef } from "react";

function ParticipantView({ participantId }) {
  const { webcamOn, webcamStream, displayName } = useParticipant(participantId);
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;

    if (webcamOn && webcamStream?.track && el) {
      const ms = new MediaStream();
      ms.addTrack(webcamStream.track);
      el.srcObject = ms;

      const play = () => el.play().catch(() => {});
      if (el.readyState >= 2) play();
      else el.onloadedmetadata = play;
    } else if (el) {
      el.srcObject = null;
    }

    return () => {
      if (el) el.srcObject = null;
    };
  }, [webcamOn, webcamStream, participantId]);

  return (
    <div className="participant-view">
      {webcamOn ? (
        <video ref={videoRef} autoPlay muted playsInline width="300" height="300" />
      ) : (
        <div className="participant-no-video">
          <p>{displayName?.[0] ?? "?"}</p>
        </div>
      )}
      <p>{displayName}</p>
    </div>
  );
}

/*  Main meeting UI  */
export default function MeetingView({
  currentMeetingId,
  onSwitchRoom,
  roomBId,
  roomAId,
  onMeetingSwitched,
  authToken,
}) {
  const {
    localParticipant,
    participants,
    leave,
    requestMediaRelay,
    stopMediaRelay,
    respondToMediaRelay,
    toggleMic,
    toggleWebcam,
  } = useMeeting({
    
    onMediaRelayRequestReceived: ({ sourceMeetingId, participantId }) => {
      console.log(`Received relay request from ${sourceMeetingId} by ${participantId}`);
      
      respondToMediaRelay({
        sourceMeetingId,
        decision: "accepted"
      });
    },
    onMediaRelayRequestResponse: ({ participantId, decision }) => {
      console.log(`Relay request ${decision} by ${participantId}`);
      if (decision === "accepted") {
        relayActiveRef.current = true;
        alert("Media relay started successfully!");
      } else {
        alert("Media relay was rejected by the other room");
      }
    },
    onMediaRelayStarted: ({ meetingId }) => {
      console.log(`Media relay started to ${meetingId}`);
      relayActiveRef.current = true;
    },
    onMediaRelayStopped: ({ meetingId, reason }) => {
      console.log(`Media relay stopped to ${meetingId}. Reason: ${reason}`);
      relayActiveRef.current = false;
    },
    onMediaRelayError: ({ meetingId, error }) => {
      console.error(`Media relay error to ${meetingId}:`, error);
      const errorMsg = error || "Unknown error - likely token permission issue";
      alert(
        `Media relay error: ${errorMsg}\n\n` 
      );
      relayActiveRef.current = false;
    },
  });

  const relayActiveRef = useRef(false);

  const otherParticipants = Array.from(participants.keys()).filter(
    (id) => id !== localParticipant.id
  );

  // ---- Clean room switch using leave + rejoin pattern ----
  const handleSwitchRoom = async () => {
    const { newMeetingId, token } = onSwitchRoom();
    if (!newMeetingId) return;

    try {
      if (relayActiveRef.current && roomBId) {
        try {
          await stopMediaRelay({ destinationMeetingId: roomBId });
        } catch (e) {
          console.warn("stopMediaRelay (pre-switch) warning:", e);
        } finally {
          relayActiveRef.current = false;
        }
      }

      leave();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onMeetingSwitched(newMeetingId);
    } catch (e) {
      console.error("Error during switch:", e);
      alert(e?.message || "Room switch failed.");
    }
  };

  const handleStartRelay = async () => {
    if (!roomBId) {
      alert(
        "Room B ID is not set in this tab."
      );
      return;
    }
    
    console.log("Starting media relay to:", roomBId);
    console.log("Current room:", currentMeetingId);
    
    try {
      await requestMediaRelay({
        destinationMeetingId: roomBId,
        token: authToken,
        kinds: ["video", "audio"],
      });
      console.log("Media relay request sent successfully");
    } catch (e) {
      console.error("requestMediaRelay failed:", e);
      alert(
        `Media relay failed: ${e?.message || e}\n\n`
      );
    }
  };

  const handleStopRelay = async () => {
    if (!roomBId || !relayActiveRef.current) return;
    try {
      await stopMediaRelay({ destinationMeetingId: roomBId });
      console.log("Media relay stopped successfully");
    } catch (e) {
      console.error("stopMediaRelay failed:", e);
    } finally {
      relayActiveRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (relayActiveRef.current && roomBId) {
        stopMediaRelay({ destinationMeetingId: roomBId }).catch(() => {});
        relayActiveRef.current = false;
      }
    };
  }, [roomBId]);

  return (
    <div className="container">
      <h2>Current Room: {currentMeetingId}</h2>

      <div className="controls">
        <button onClick={leave}>Leave</button>
        <button onClick={toggleMic}>Toggle Mic</button>
        <button onClick={toggleWebcam}>Toggle Webcam</button>
      </div>

      <div className="controls-task">
        <button onClick={handleSwitchRoom}>Switch to Other Room (Normal)</button>

        {roomBId && currentMeetingId !== roomBId && (
          <>
            <button onClick={handleStartRelay} disabled={relayActiveRef.current}>
              {relayActiveRef.current ? "Relaying…" : "Start Media Relay to Room B"}
            </button>
            <button onClick={handleStopRelay} disabled={!relayActiveRef.current}>
              Stop Media Relay to Room B
            </button>
          </>
        )}
      </div>

      <div className="participant-grid">
        <ParticipantView key={localParticipant.id} participantId={localParticipant.id} />
        {otherParticipants.map((id) => (
          <ParticipantView key={id} participantId={id} />
        ))}
      </div>
    </div>
  );
}
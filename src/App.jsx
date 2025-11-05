import React, { useState } from "react";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import MeetingContainer from "./components/MeetingContainer";
import { createMeeting } from "./api";
import "./App.css";

const token = import.meta.env.VITE_VIDEOSDK_TOKEN;
const urlRoom = new URLSearchParams(window.location.search).get("room");

function App() {
  const [providerMeetingId, setProviderMeetingId] = useState(urlRoom || null);
  const [displayMeetingId, setDisplayMeetingId] = useState(urlRoom || null);

  const [roomAId, setRoomAId] = useState(null);
  const [roomBId, setRoomBId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputId, setInputId] = useState("");
  
  const [meetingKey, setMeetingKey] = useState(0);

  const prepareAndJoinRooms = async () => {
    setIsLoading(true);
    try {
      const realRoomAId = await createMeeting(token);
      const realRoomBId = await createMeeting(token);
      setRoomAId(realRoomAId);
      setRoomBId(realRoomBId);

      setProviderMeetingId(realRoomAId);
      setDisplayMeetingId(realRoomAId);
      setMeetingKey(prev => prev + 1);
    } catch (e) {
      console.error(e);
      alert("Failed to create rooms. Check token and API endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!providerMeetingId) {
    return (
      <div className="container">
        <h1>Room Switch + Media Relay Demo</h1>
        <div style={{ marginTop: 12 }}>
          <button onClick={prepareAndJoinRooms} disabled={isLoading}>
            {isLoading ? "Creating rooms…" : "Prepare Rooms & Join Room A (Host)"}
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <input
            placeholder="Enter meetingId to join"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            style={{ width: 320, padding: 8 }}
          />
          <button
            style={{ marginLeft: 8 }}
            onClick={() => {
              const id = inputId.trim();
              if (!id) return;
              setProviderMeetingId(id);
              setDisplayMeetingId(id);
              setMeetingKey(prev => prev + 1);
            }}
          >
            Join by ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <MeetingProvider
      key={meetingKey} 
      config={{
        meetingId: providerMeetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: `Participant (${(displayMeetingId || providerMeetingId).slice(0, 6)}...)`,
      }}
      token={token}
      joinWithoutUserInteraction={true}
    >
      <MeetingContainer
        currentMeetingId={displayMeetingId || providerMeetingId}
        onSwitchRoom={() => {
          const newMeetingId =
            (displayMeetingId || providerMeetingId) === roomAId ? roomBId : roomAId;
          return { newMeetingId, token };
        }}
        onLeave={() => {
          setProviderMeetingId(null);
          setDisplayMeetingId(null);
          setMeetingKey(prev => prev + 1);
        }}
        roomBId={roomBId}
        roomAId={roomAId}
        authToken={token}
        onMeetingSwitched={(newId) => {
          setProviderMeetingId(newId);
          setDisplayMeetingId(newId);
          setMeetingKey(prev => prev + 1);
        }}
      />

      {roomBId && (
        <div style={{ position: "fixed", bottom: 16, left: 16, opacity: 0.8 }}>
          <div style={{ fontSize: 12 }}>Room B ID (share with other tab):</div>
          <code style={{ fontSize: 12 }}>{roomBId}</code>
        </div>
      )}
    </MeetingProvider>
  );
}

export default App;
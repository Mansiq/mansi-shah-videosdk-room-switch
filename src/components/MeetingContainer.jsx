import { useMeeting } from "@videosdk.live/react-sdk";
import { useState } from "react";
import MeetingView from "./MeetingView";

export default function MeetingContainer({
  currentMeetingId,
  onSwitchRoom,
  onLeave,
  roomBId,
  onMeetingSwitched,
  authToken,              
}) {
  const [isMeetingJoined, setMeetingJoined] = useState(false);

  useMeeting({
    onMeetingJoined: () => setMeetingJoined(true),
    onMeetingLeft: () => onLeave(),
  });

  return isMeetingJoined ? (
    <MeetingView
      currentMeetingId={currentMeetingId}
      onSwitchRoom={onSwitchRoom}
      roomBId={roomBId}
      onMeetingSwitched={onMeetingSwitched}
      authToken={authToken}       
    />
  ) : (
    <div className="container">
      <h2>Joining {currentMeetingId}...</h2>
    </div>
  );
}

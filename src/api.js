const API_BASE_URL = "https://api.videosdk.live/v1";

export async function createMeeting(token) {
  const res = await fetch(`${API_BASE_URL}/meetings`, {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to create meeting: ${error.message || res.statusText}`);
  }

  const { meetingId } = await res.json();
  return meetingId; 
}
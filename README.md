# VideoSDK Room Switching & Media Relay Demo

Hi, I am Mansi Shah. This is a React project built with Vite that demonstrates two distinct methods for managing user presence across multiple video rooms using the [VideoSDK](https://videosdk.live/).

The project showcases:

1.  **Normal Room Switching:** A "leave and re-join" mechanism where a user completely disconnects from one room and joins another.
2.  **Media Relay:** A "broadcast" mechanism where a user in one room (Room A) can send their audio and video to another room (Room B) *without leaving Room A*.

-----

## 🚀 Project Setup & Usage

### 1\. Prerequisites

  * [Node.js](https://nodejs.org/) (v18 or higher)
  * A VideoSDK Account (to get an auth token)

### 2\. Setup Steps

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Mansiq/mansi-shah-videosdk-room-switch.git
    cd mansi-shah-videosdk-room-switch
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create an Environment File:**
    This project requires a secret VideoSDK auth token. You must store this in an environment file.

      * Create a new file in the project's root folder named `.env`
      * Open your [VideoSDK Dashboard](https://app.videosdk.live/) and get your auth token.
      * Add the token to your `.env` file like this (Vite requires the `VITE_` prefix):

    <!-- end list -->

    ```
    VITE_VIDEOSDK_TOKEN="YOUR_SECRET_TOKEN_GOES_HERE"
    ```

    *The `.gitignore` file is already configured to ignore `.env`, so your token will not be accidentally pushed to GitHub.*

4.  **Run the project:**

    ```bash
    npm run dev
    ```

    The application will be running at `http://localhost:5175/`.

### 3\. How to Use the Demo

1.  **Open the app** in your browser.
2.  Click the **"Prepare Rooms & Join Room A"** button. This will create two new meeting IDs (Room A and Room B) and automatically join you to Room A.
3.  **Copy the Room B ID** shown at the bottom-left of the screen.
4.  **Open a new browser tab or window** and paste the full URL from the first tab. Then, replace the meeting ID in the URL with your copied Room B ID, or simply use the "Join by ID" input.
5.  You now have two browser tabs, one in Room A (as the "Host") and one in Room B (as a "Participant"). You can now test the switching and relay features.

-----

## 🛠️ Implementation Details

### 1\. Normal Room Switching (Leave & Re-join)

This method is a hard "switch." The user leaves Room A and joins Room B. They are only ever in one room at a time.

**How it works:**

This entire process is orchestrated by `App.jsx` controlling the `<MeetingProvider>`.

1.  **State Management (`App.jsx`):**

      * `App.jsx` holds the IDs for `roomAId` and `roomBId` in state.
      * It also holds the *currently active* meeting ID in `providerMeetingId`.
      * Crucially, it passes a `key={meetingKey}` to the `<MeetingProvider>`.

2.  **The "Switch" Button (`MeetingView.jsx`):**

      * When the user clicks "Switch to Other Room," the `handleSwitchRoom` function is called.
      * This function calls `leave()` from the `useMeeting` hook to disconnect from the current meeting.
      * After a brief 500ms timeout (to ensure disconnection), it calls the `onMeetingSwitched(newMeetingId)` callback, which was passed down from `App.jsx`.

3.  **The Re-Mount (`App.jsx`):**

      * The `onMeetingSwitched` function in `App.jsx` does two things:
        1.  It updates the `providerMeetingId` state to the *new* room's ID.
        2.  It increments the `meetingKey` state (`setMeetingKey(prev => prev + 1)`).
      * **This is the most important part:** By changing the `key` prop on `<MeetingProvider>`, React is forced to **unmount the old component and mount a brand new one.**
      * This new `<MeetingProvider>` instance initializes with the new `providerMeetingId`, and the SDK automatically joins the new room.

### 2\. Media Relay (Broadcast)

This project uses Media Relay as a **one-way broadcast**, not a "switch." The user in Room A can send their media to Room B *while remaining in Room A*.

**How it works:**

The logic is almost entirely within `MeetingView.jsx`.

1.  **Starting the Relay:**

      * The user in Room A clicks "Start Media Relay to Room B."
      * `handleStartRelay` is called, which triggers the `requestMediaRelay` function from the `useMeeting` hook.
      * We provide the `destinationMeetingId` (Room B's ID), the `authToken` (which must have relay permissions), and the `kinds: ["video", "audio"]`.

2.  **Receiving the Relay:**

      * Any participant in Room B (including our second browser tab) will receive an event.
      * The `useMeeting` hook in `MeetingView.jsx` has an `onMediaRelayRequestReceived` handler.
      * In this demo, the app is configured to **auto-accept** any incoming relay request:
        ```javascript
        onMediaRelayRequestReceived: ({ sourceMeetingId, participantId }) => {
          respondToMediaRelay({
            sourceMeetingId,
            decision: "accepted"
          });
        },
        ```
      * Once accepted, the host's video/audio from Room A appears in Room B as if they were a participant.

3.  **Stopping the Relay:**

      * The user in Room A can click "Stop Media Relay." This calls `stopMediaRelay` to end the broadcast.
      * The media feed is then removed from Room B.

-----

## 📝 Notes, Challenges & Comparisons

This project highlights two very different solutions for different use cases.

### Comparison: Normal Switch vs. Media Relay

| Feature | Normal Switch (Leave/Join) | Media Relay (Broadcast) |
| :--- | :--- | :--- |
| **User Presence** | User *moves* from Room A to B. | User *stays* in Room A, but is *also visible* in B. |
| **Interaction** | Full two-way communication in the new room. | One-way broadcast (A -\> B). The user in A cannot see or hear participants in B. |
| **State** | Clean transition. Old connection is completely terminated before new one begins. | Complex state. User is actively connected to Room A while managing a separate broadcast to B. |
| **Disruption** | **High.** There is a brief "joining..." screen as the SDK disconnects and reconnects. | **Low.** The user's experience in Room A is uninterrupted. |
| **Use Case** | Moving a user between different breakout rooms. | A "host" or "speaker" broadcasting their presentation to multiple "audience" rooms. |

### Limitations & Challenges

1.  **Media Relay is One-Way:** The most common misunderstanding is that Media Relay is a "switch." As implemented here, it is a **one-way broadcast**. The host in Room A cannot see or hear the participants in Room B.
2.  **Token Permissions:** Media Relay is a powerful feature that must be enabled for your auth token in the VideoSDK dashboard. If your token doesn't have `allow_media_relay` permissions, the `onMediaRelayError` will fire.
3.  **Switching Disruption:** The "Normal Switch" method is effective but not seamless. The `setTimeout` and `key` re-mount create a noticeable "black screen" or "joining" state. This is an unavoidable trade-off for a full-context switch.
4.  **Relay State Management:** In this demo, the relay state (`relayActiveRef`) is managed locally in `MeetingView.jsx`. In a larger application, this would need to be bubbled up to a global state (Context, Redux, etc.) so other components could be aware of an active relay.

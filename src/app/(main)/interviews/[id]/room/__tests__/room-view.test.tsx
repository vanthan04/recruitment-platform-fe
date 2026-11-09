import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RoomView } from "../room-view";
import { createRoomClient, type RoomClientEvents } from "@/lib/rtc/room-client";
import {
  getInterviewSessions,
  getRoomJoinInfo,
  startInterviewSession,
  endInterviewSession,
} from "@/lib/services/interview.service";
import type { InterviewDetail, InterviewSession } from "@/lib/types/interview";

jest.mock("@/lib/rtc/room-client", () => ({ createRoomClient: jest.fn() }));

jest.mock("@/lib/services/interview.service", () => ({
  getInterviewSessions: jest.fn(),
  startInterviewSession: jest.fn(),
  endInterviewSession: jest.fn(),
  getRoomJoinInfo: jest.fn(),
}));

const interview: InterviewDetail = {
  id: "interview-1",
  jobApplicationId: "app-1",
  scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  durationMinutes: 45,
  location: null,
  meetingLink: null,
  useRoom: true,
  note: null,
  status: "SCHEDULED",
  createdById: "recruiter-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  jobId: "job-1",
  jobTitle: "Backend Developer",
  candidateId: "candidate-1",
  candidateName: "Cand Idate",
  viewerRole: "CANDIDATE",
};

const openSession: InterviewSession = {
  id: "session-1",
  interviewId: "interview-1",
  startedAt: new Date().toISOString(),
  endedAt: null,
  startedById: "recruiter-1",
  monitoringConsentAt: null,
  status: "IN_PROGRESS",
};

function makeStream() {
  const tracks = [
    { kind: "audio", enabled: true, stop: jest.fn() },
    { kind: "video", enabled: true, stop: jest.fn() },
  ];
  const stream = {
    getTracks: () => tracks,
    getAudioTracks: () => tracks.filter((t) => t.kind === "audio"),
    getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
  } as unknown as MediaStream;
  return { stream, tracks };
}

describe("RoomView", () => {
  let getUserMedia: jest.Mock;
  let client: { join: jest.Mock; leave: jest.Mock };
  let events: RoomClientEvents;
  let media: ReturnType<typeof makeStream>;

  beforeEach(() => {
    jest.clearAllMocks();
    media = makeStream();
    getUserMedia = jest.fn().mockResolvedValue(media.stream);
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });

    client = { join: jest.fn().mockResolvedValue(undefined), leave: jest.fn() };
    (createRoomClient as jest.Mock).mockImplementation((_join, _ctx, e: RoomClientEvents) => {
      events = e;
      return client;
    });
    (getInterviewSessions as jest.Mock).mockResolvedValue([]);
    (startInterviewSession as jest.Mock).mockResolvedValue(openSession);
    (getRoomJoinInfo as jest.Mock).mockResolvedValue({
      sessionId: "session-1",
      join: { provider: "p2p", iceServers: [] },
    });
  });

  const enter = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Vào phòng" }));
    await waitFor(() => expect(client.join).toHaveBeenCalled());
  };

  it("starts the session, fetches credentials and joins with the local stream", async () => {
    render(<RoomView interview={interview} />);
    await enter();

    expect(getUserMedia).toHaveBeenCalled();
    expect(startInterviewSession).toHaveBeenCalledWith("interview-1");
    expect(getRoomJoinInfo).toHaveBeenCalledWith("interview-1");
    expect(createRoomClient).toHaveBeenCalledWith(
      { provider: "p2p", iceServers: [] },
      { interviewId: "interview-1", role: "CANDIDATE" },
      expect.any(Object),
    );
    expect(client.join).toHaveBeenCalledWith(media.stream);
  });

  it("does not start another session when one is already open", async () => {
    (getInterviewSessions as jest.Mock).mockResolvedValue([openSession]);
    render(<RoomView interview={interview} />);
    await enter();

    expect(startInterviewSession).not.toHaveBeenCalled();
  });

  it("carries on if starting loses a race to the other participant", async () => {
    (getInterviewSessions as jest.Mock).mockResolvedValueOnce([]).mockResolvedValue([openSession]);
    (startInterviewSession as jest.Mock).mockRejectedValue(new Error("already open"));
    render(<RoomView interview={interview} />);
    await enter();

    expect(client.join).toHaveBeenCalled();
  });

  it("explains a blocked camera and does not touch the session", async () => {
    getUserMedia.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    render(<RoomView interview={interview} />);

    fireEvent.click(screen.getByRole("button", { name: "Vào phòng" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("đang chặn camera"));
    expect(startInterviewSession).not.toHaveBeenCalled();
    expect(createRoomClient).not.toHaveBeenCalled();
    // The visitor can fix the permission and try again.
    expect(screen.getByRole("button", { name: "Vào phòng" })).toBeInTheDocument();
  });

  it("explains a missing camera", async () => {
    getUserMedia.mockRejectedValue(new DOMException("none", "NotFoundError"));
    render(<RoomView interview={interview} />);

    fireEvent.click(screen.getByRole("button", { name: "Vào phòng" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Không tìm thấy camera"));
  });

  it("releases the camera and shows an error when the backend refuses the room", async () => {
    (getRoomJoinInfo as jest.Mock).mockRejectedValue(new Error("nope"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<RoomView interview={interview} />);

    fireEvent.click(screen.getByRole("button", { name: "Vào phòng" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Không vào được phòng"));
    media.tracks.forEach((t) => expect(t.stop).toHaveBeenCalled());
    errorSpy.mockRestore();
  });

  it("shows the room status the client reports", async () => {
    render(<RoomView interview={interview} />);
    await enter();

    act(() => events.onStatus("waiting"));
    expect(screen.getByRole("status")).toHaveTextContent("Đang chờ người còn lại");

    act(() => events.onStatus("connected"));
    expect(screen.getByRole("status")).toHaveTextContent("Đã kết nối");
  });

  it("gives the camera back when the room is closed by the other side", async () => {
    render(<RoomView interview={interview} />);
    await enter();

    act(() => events.onStatus("closed"));

    media.tracks.forEach((t) => expect(t.stop).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent("đã kết thúc");
  });

  it("leaving stops the camera and the client but keeps the session open", async () => {
    render(<RoomView interview={interview} />);
    await enter();
    act(() => events.onStatus("connected"));

    fireEvent.click(screen.getByRole("button", { name: /Rời phòng/ }));

    expect(client.leave).toHaveBeenCalled();
    media.tracks.forEach((t) => expect(t.stop).toHaveBeenCalled());
    expect(endInterviewSession).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Vào phòng" })).toBeInTheDocument();
  });

  it("toggles the microphone and camera tracks", async () => {
    render(<RoomView interview={interview} />);
    await enter();
    act(() => events.onStatus("connected"));

    fireEvent.click(screen.getByRole("button", { name: "Tắt micro" }));
    fireEvent.click(screen.getByRole("button", { name: "Tắt camera" }));

    expect(media.tracks[0].enabled).toBe(false);
    expect(media.tracks[1].enabled).toBe(false);
    expect(screen.getByRole("button", { name: "Bật micro" })).toBeInTheDocument();
  });

  it("ends the session for both sides after confirmation", async () => {
    (getInterviewSessions as jest.Mock).mockResolvedValue([openSession]);
    (endInterviewSession as jest.Mock).mockResolvedValue({ ...openSession, status: "ENDED" });
    render(<RoomView interview={interview} />);
    await enter();
    act(() => events.onStatus("connected"));

    fireEvent.click(screen.getByRole("button", { name: "Kết thúc phiên" }));
    fireEvent.click(await screen.findByRole("button", { name: /Xác nhận|Đồng ý|Kết thúc/, hidden: false }));

    await waitFor(() => expect(endInterviewSession).toHaveBeenCalledWith("interview-1", "session-1"));
  });

  it("leaves the room when the page unmounts", async () => {
    const { unmount } = render(<RoomView interview={interview} />);
    await enter();

    unmount();

    expect(client.leave).toHaveBeenCalled();
    media.tracks.forEach((t) => expect(t.stop).toHaveBeenCalled());
  });
});

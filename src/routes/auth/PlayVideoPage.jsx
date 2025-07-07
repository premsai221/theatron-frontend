import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, replace } from "react-router";
import { useSelector } from "react-redux";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "../../util/hls-selector/plugin";
import "../../util/videojs-hotkey/videojs.hotkeys"
import axiosClient from "../../util/axiosClient";
import ShareModal from "./ShareModal";
import CreateRoomModal from "./CreateRoomModal";


const PlayVideoPage = () => {
    const { videoId, room } = useParams();
    const navigate = useNavigate();
    const playerRef = useRef(null);
    const videoNodeRef = useRef(null);

    const user = useSelector((state) => state.auth.user);
    const [showShareModal, setShowShareModal] = useState(false); 
    const [shareModalMessage, setShareModalMessage] = useState("");
    const [externalUserAccessList, setExternalUserAccessList] = useState([])
    const [currentRoom, setCurrentRoom] = useState(null);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [joiningRoom, setJoiningRoom] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const roomSessionConnected = useRef(false);

    const socketRef = useRef(null);
    const latestMessageTimestamp = useRef(Date.now());
    const nonUserActions = useRef(0)

    const handleAddUser = (user) => {
        axiosClient.post("/media/share/user", {mediaId:videoId, username: user}).then((resp) => {
            const data = resp.data;
            if (data.updatedAccessList != undefined) {
                setShareModalMessage("User has been added succesfully");
                setExternalUserAccessList(data.updatedAccessList ?? [])
            } else {
                setShareModalMessage("Unable to add user! Try again!");
            }
        }).catch((error) => {
            console.log(error)
            setShareModalMessage("Unable to add user! Try again!");
        })
    };

    const handleRemoveUser = (user) => {
        axiosClient.post("/media/remove/user", {mediaId:videoId, username: user}).then((resp) => {
            const data = resp.data;
            if (data.updatedAccessList != undefined) {
                setShareModalMessage("User has been removed succesfully");
                setExternalUserAccessList(data.updatedAccessList ?? [])
            } else {
                setShareModalMessage("Unable to remove user! Try again!");
            }
        }).catch((error) => {
            console.log(error)
            setShareModalMessage("Unable to remove user! Try again!");
        })
    }

    const handleCreateRoom = (roomName) => {
        setJoiningRoom(true);
        axiosClient.post("/media/room/create", { mediaId: videoId, roomName }).then((resp) => {
            const data = resp.data;
            if (data.roomName) {
                setCurrentRoom(data.roomName);
                setShowCreateRoomModal(false);
            } else {
                alert("Unable to create room! Try again!");
            }
            console.log(data);
            setJoiningRoom(false);
        }).catch((error) => {
            console.log(error);
            setJoiningRoom(false);
        });
    };

    const handleDeleteRoom = () => {
        axiosClient.post("/media/room/delete", { mediaId: videoId, roomName: currentRoom }).then((resp) => {
            const data = resp.data;
            console.log(data);
            if (data.roomName) {
                setCurrentRoom(null);
            } else {
                alert("Unable to delete room! Try again!");
            }
        });
    }

    const [videoData, setVideoData] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkIfConnectionToRoomAcknowledged = () => {
        return setTimeout(() => {
            if (!roomSessionConnected.current) {
                console.log("Connection to room not acknowledged, closing socket");
                if (socketRef.current) {
                    socketRef.current.close();
                }
                setJoiningRoom(false);
                navigate(`/watch/${videoId}`, {replace:true});
            }
        }, 4000);
    }

    function handleMessage(message) {
        if (
            !playerRef.current ||
            !message ||
            message.from === user || 
            (message.to !== "!ALL!" &&
            message.to !== user && (message.to === "!HOST!" && videoData.owner !== user))
        ) {
            return;
        }

        if (!roomSessionConnected.current && message.type !== "ACK" ) {
            return;
        }

        if (message.type === "ACK") {
            roomSessionConnected.current = true;
            playerRef.current.play();
        }
        
        if (message.type === "SYNC" && videoData.owner === user) {
            console.log(playerRef.current.currentTime())
            const syncMessage = {
                type: "ACK",
                from: user,
                to: message.from,
                currentTimeMs: playerRef.current.currentTime() * 1000,
                timestamp: Date.now(),
            };
            socketRef.current.send(JSON.stringify(syncMessage));
            return;
        }

        console.log("WebSocket message received:", message);

        if (latestMessageTimestamp.current >= message.timestamp)
            return; 
        
        const now = Date.now();
        const delta = now - message.timestamp;
        const seekTime = parseInt((message.currentTimeMs + delta) / 1000);

        console.log(1, nonUserActions.current)
        playerRef.current.currentTime(seekTime);
        nonUserActions.current++;
        if (message.action === "PAUSE") {
            nonUserActions.current++;
            console.log(3, nonUserActions.current)
            playerRef.current.pause();
        } else if (message.action === "PLAY") {
            nonUserActions.current++;
            console.log(5, nonUserActions.current)
            playerRef.current.play();
        }
        latestMessageTimestamp.current = message.timestamp;
    }

    const connectToWebSocket = (token) => {
        const socket = new WebSocket(`ws://127.0.0.1:8081/ws`);

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            socket.send(token);
            if (videoData.owner != user) {
                const syncMessage = {
                    type: "SYNC",
                    to: "!HOST!",
                    from: user,
                }
                socket.send(JSON.stringify(syncMessage));
            }
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleMessage(message)
        };

        socket.onerror = (error) => {
            console.log("WebSocket error:", error);
        };

        socket.onclose = (event) => {
            console.log("WebSocket closed:", event);
        };

        return socket;
    }
    
    useEffect(() => {
        var timeoutRef = null;
        if (room !== undefined && room !== null && room !== "" && videoLoaded) {
            console.log("ok")
            playerRef.current.pause()
            setJoiningRoom(true);
            axiosClient.post("/media/room/join", { mediaId: videoId, roomName: room }).then((resp) => {
                const data = resp.data;
                console.log(data);
                if (data.roomAvailable) {
                    socketRef.current = connectToWebSocket(data.token);
                    if (videoData.owner !== user) {
                        timeoutRef = checkIfConnectionToRoomAcknowledged();
                    } else {
                        roomSessionConnected.current = true;
                    }
                    setJoiningRoom(false);
                } else {
                    setJoiningRoom(false);
                    alert("Unable to join room! Try again!");
                    navigate(`/watch/${videoId}`, {replace:true});
                }
            }).catch((error) => {
                navigate(`/watch/${videoId}`, {replace:true});
                setJoiningRoom(false);
            })
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                setJoiningRoom(false);
                roomSessionConnected.current = false;
                if (timeoutRef) {
                    clearTimeout(timeoutRef);
                }
            }
        };
    }, [room, videoLoaded])

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const { data } = await axiosClient.post("/media/details", { mediaId: videoId });

                if (data.status !== "PROCESSED") {
                    setError(true);
                } else {
                    console.log(data)
                    setExternalUserAccessList(data.externalUserAccessList ?? [])
                    setVideoData(data);
                    setCurrentRoom(data.currentRoom ?? null);
                }
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchVideoDetails();
    }, [videoId]);

    useEffect(() => {
        if (videoData && videoData.url && videoNodeRef.current) {
            const player = videojs(videoNodeRef.current, {
                controls: true,
                responsive: true,
                preload: "auto",
                aspectRatio: "16:9",
                sources: [
                    {
                        src: videoData.url,
                        type: "application/x-mpegURL",
                    },
                ],
                plugins: {
                    hlsQualitySelector: {
                        default: "auto",
                    },
                    hotkeys: {
                        volumeStep: 0.1,
                        seekStep: 5,
                        enableModifiersForNumbers: false,
                    },
                },
            });

            player.on('play', () => {
                console.log(6, nonUserActions.current)
                if (nonUserActions.current == 0 && roomSessionConnected.current) {
                    const message = {
                        type: "CTRL",
                        action: "PLAY",
                        from: user,
                        to: "!ALL!",
                        currentTimeMs: player.currentTime() * 1000,
                        timestamp: Date.now(),
                    };
                    socketRef.current.send(JSON.stringify(message));
                } else {
                    nonUserActions.current--;
                }
            })

            player.on('pause', () => {
                console.log(4, nonUserActions.current)
                if (nonUserActions.current == 0 && roomSessionConnected.current) {
                    const message = {
                        type: "CTRL",
                        action: "PAUSE",
                        from: user,
                        to: "!ALL!",
                        currentTimeMs: player.currentTime() * 1000,
                        timestamp: Date.now(),
                    };
                    socketRef.current.send(JSON.stringify(message));
                } else {
                    nonUserActions.current--;
                }
            });
            player.on('seeked', () => {
                console.log(2, nonUserActions.current)
                if (nonUserActions.current == 0 && roomSessionConnected.current) {
                    const message = {
                        type: "CTRL",
                        action: "SEEK",
                        from: user,
                        to: "!ALL!",
                        currentTimeMs: player.currentTime() * 1000,
                        timestamp: Date.now(),
                    };
                    socketRef.current.send(JSON.stringify(message));
                } else {
                    nonUserActions.current--;
                }
            });

            // player.ready(() => {
            //     this.hotkeys({volumeStep: 0.1,
            //             seekStep: 5,
            //             enableModifiersForNumbers: false})
            // })

            playerRef.current = player;
            setVideoLoaded(true);

            return () => {
                if (playerRef.current) {
                    playerRef.current.dispose();
                }
            };
        }
    }, [videoData]);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="d-flex flex-column justify-content-center align-items-center" style={{ height: "80vh" }}>
                <h4 className="text-center mb-3">Video is not available</h4>
                <Button variant="primary" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </Button>
            </Container>
        );
    }

    return (
        <Row className="flex-grow-1 py-2">
            <Col lg={8} xs={12} className="d-flex flex-column justify-content-center align-items-center">
                <div data-vjs-player>
                    <video
                        ref={videoNodeRef}
                        className="video-js vjs-default-skin vjs-big-play-centered"
                        controls
                        preload="auto"
                    />
                </div>
            </Col>
            <Col lg={4} xs={12} className="py-5">
                <h4>{videoData.title}</h4>
                <p className="text-muted mb-1">Owner: {videoData.owner}</p>
                <p className="text-muted mb-1">Uploaded on: {new Date(videoData.uploadedOn).toLocaleString()}</p>
                <hr />
                <p>{videoData.description}</p>
                <div className="d-flex gap-3 my-3">
                    <Button variant="outline-primary" onClick={() => setShowShareModal(true)}>
                        Share
                    </Button>
                    {room && room !== "" ? (
                        <Button variant="outline-danger" onClick={() => navigate(`/watch/${videoId}`, {replace:true})} >
                            Leave Room
                        </Button>
                    ) : videoData.owner === user ? (
                        !currentRoom || currentRoom === "" ? (
                            <Button variant="outline-success" onClick={() => setShowCreateRoomModal(true)}>
                                Create a Room
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline-success" onClick={() => navigate(`/watch/${videoId}/${currentRoom}`)}>
                                    Join Room
                                </Button>
                                <Button variant="outline-danger" onClick={handleDeleteRoom}>
                                    Delete Room
                                </Button>
                            </>
                        )
                    ) : (
                        <Button 
                        variant="outline-success" 
                        disabled={!currentRoom || currentRoom === ""} 
                        onClick={() => navigate(`/watch/${videoId}/${currentRoom}`)}>
                            Join Room
                        </Button>
                    )}
                </div>
            </Col>
            <ShareModal
                show={showShareModal}
                onHide={() => setShowShareModal(false)}
                list={externalUserAccessList}
                onAdd={handleAddUser}
                onRemove={handleRemoveUser}
                message={shareModalMessage}
                setMessage={setShareModalMessage}
            />
            <CreateRoomModal
                show={showCreateRoomModal}
                onHide={() => setShowCreateRoomModal(false)}
                onCreate={handleCreateRoom}
            />
            { joiningRoom && (
                <Container className="d-flex justify-content-center align-items-center" 
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(255, 255, 255, 0.7)", // optional: white translucent overlay
                    zIndex: 9999
                }}>
                    <Spinner animation="border" />
                </Container>
            )}
        </Row>
    );
};

export default PlayVideoPage;

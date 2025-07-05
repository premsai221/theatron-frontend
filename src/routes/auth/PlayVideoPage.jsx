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

    const handleAddUser = (user) => {
        axiosClient.post("/media/share/user", {mediaId:videoId, username: user}).then((resp) => {
            const data = resp.data;
            if (data.updatedAccessList != undefined) {
                setShareModalMessage("User has been added succesfully");
                setExternalUserAccessList(data.updatedAccessList)
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
                setExternalUserAccessList(data.updatedAccessList)
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
        });
    };

    const [videoData, setVideoData] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    
    useEffect(() => {
        if (room !== undefined && room !== null && room !== "" && videoLoaded) {
            console.log("ok")
            playerRef.current.pause()
            setJoiningRoom(true);
            axiosClient.post("/media/room/join", { mediaId: videoId, roomName: room }).then((resp) => {
                const data = resp.data;
                console.log(data);
                if (data.roomAvailable) {
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
    }, [room, videoLoaded])

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const { data } = await axiosClient.post("/media/details", { mediaId: videoId });

                if (data.status !== "PROCESSED") {
                    setError(true);
                } else {
                    console.log(data)
                    setExternalUserAccessList(data.externalUserAccessList)
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

            player.on('pause', () => {
                console.log('Video paused');
            });
            player.on('seeked', () => {
                console.log('Video seeked to', player.currentTime());
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
                                <Button variant="outline-danger">
                                    Delete Room
                                </Button>
                            </>
                        )
                    ) : (
                        <Button variant="outline-success" disabled={!currentRoom || currentRoom === ""}>
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

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "../../util/hls-selector/plugin";
import "../../util/videojs-hotkey/videojs.hotkeys"
import axiosClient from "../../util/axiosClient";
import ShareModal from "./ShareModal";
// import hlsQualitySelector from "videojs-hls-quality-selector";


const PlayVideoPage = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const playerRef = useRef(null);
    const videoNodeRef = useRef(null);

    const [showShareModal, setShowShareModal] = useState(false); 
    const [shareModalMessage, setShareModalMessage] = useState("");
    const [externalUserAccessList, setExternalUserAccessList] = useState([])
    
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

    const [videoData, setVideoData] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

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

            // player.ready(() => {
            //     this.hotkeys({volumeStep: 0.1,
            //             seekStep: 5,
            //             enableModifiersForNumbers: false})
            // })

            playerRef.current = player;

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
                    <Button variant="outline-success">
                        Create a Room
                    </Button>
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
        </Row>
    );
};

export default PlayVideoPage;

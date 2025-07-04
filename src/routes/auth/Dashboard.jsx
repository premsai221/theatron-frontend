import { Button, Card, Col, Container, Dropdown, Row, Spinner, Alert } from "react-bootstrap";
import { ThreeDotsVertical, Upload } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import axiosClient from "../../util/axiosClient";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";


const VideoCard = ({ video }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (video.isViewable) {
      navigate(`/watch/${video.id}`);
    }
  };

  return (
    <Card
      className={`mb-3 h-100 shadow-sm video-card ${video.isViewable ? "hoverable" : "bg-light text-muted"
        }`}
      style={{ cursor: video.isViewable ? "pointer" : "not-allowed" }}
    >
      <div style={{ position: "relative" }} onClick={handleClick}>
        <Card.Img variant="top" src={video.thumbnail} />
        <span
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "0.75rem",
          }}
        >
          {video.length}
        </span>
      </div>
      <Card.Body className="d-flex justify-content-between align-items-start">
        <div onClick={handleClick}>
          <Card.Title className="mb-0" style={{ fontSize: "1rem" }}>
            {video.title}
          </Card.Title>
        </div>
        <Dropdown>
          <Dropdown.Toggle
            variant="link"
            size="sm"
            className="text-muted p-0"
            style={{ boxShadow: "none" }}
            bsPrefix="test"
          >
            <ThreeDotsVertical />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item disabled={!video.isViewable}>Share</Dropdown.Item>
            <Dropdown.Item>Edit</Dropdown.Item>
            <Dropdown.Item>Delete</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Card.Body>
    </Card>
  );
};


function Dashboard() {
  const [myVideos, setMyVideos] = useState([]);
  const [sharedVideos, setSharedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  
  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await axiosClient.get("/media/videos");

        const username = data.username;
        const my = [];
        const shared = [];

        for (let video of data.videos) {
          const formattedVideo = {
            ...video,
            isViewable: video.status === "PROCESSED",
            length: formatDuration(video.duration),
            thumbnail:
              video.thumbnail || "/src/assets/default_video_thumbnail.jpg",
          };

          if (video.owner === username) {
            my.push(formattedVideo);
          } else {
            shared.push(formattedVideo);
          }
        }

        setMyVideos(my);
        setSharedVideos(shared);
      } catch (err) {
        console.error(err);
        setError("Failed to load videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(hrs.toString().padStart(2, "0"));
    parts.push(mins.toString().padStart(2, "0"));
    parts.push(secs.toString().padStart(2, "0"));

    return parts.join(":");
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Hello, {user}</h2>
        </Col>
        <Col className="d-flex">
          <Button className="ms-auto align-middle" variant="success" onClick={() => {navigate("/upload")}}>
            <span className="align-middle">
            Upload New
            </span>
            <Upload className="h5 mb-0 ms-2"/>
          </Button>
        </Col>
      </Row>

      {loading ? (
        <Row className="text-center">
          <Col>
            <Spinner animation="border" />
          </Col>
        </Row>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Row className="mb-3">
            <Col>
              <h4>My Videos</h4>
            </Col>
          </Row>
          <Row xs={1} sm={2} md={3} lg={4}>
            {myVideos.map((video) => (
              <Col key={video.id}>
                <VideoCard video={video} />
              </Col>
            ))}
          </Row>

          <Row className="mt-5 mb-3">
            <Col>
              <h4>Shared with Me</h4>
            </Col>
          </Row>
          <Row xs={1} sm={2} md={3} lg={4}>
            {sharedVideos.map((video) => (
              <Col key={video.id}>
                <VideoCard video={video} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
}

export default Dashboard;
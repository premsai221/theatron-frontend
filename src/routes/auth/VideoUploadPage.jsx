import React, { useState } from "react";
import { Container, Form, Button, ProgressBar, Row, Col, Alert, Spinner } from "react-bootstrap";
import axiosClient from "../../util/axiosClient";
import { replace, useNavigate } from "react-router";

const VideoUploadPage = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState("");
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.type === "video/mp4") {
            setFile(selected);
        } else {
            setError("Only MP4 video files are allowed.");
            setFile("");
        }
    };

    const getVideoDuration = (videoFile) =>
        new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => {
                resolve(video.duration);
            };
            video.src = URL.createObjectURL(videoFile);
        });

    const handleUpload = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!file || !title.trim()) {
            setError("Title and valid MP4 file are required.");
            return;
        }

        try {
            setUploading(true);
            console.log(file)
            const { data: presignData } = await axiosClient.post("/media/generate/url", {
                filename: file.name,
                filetype: file.type,
            });

            await axiosClient.put(presignData.uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percent);
                },
            });
            console.log(presignData)

            const duration = await getVideoDuration(file);
            await axiosClient.post("/media/process/upload", {
            title,
            description,
            duration: duration,
            size: file.size,
            type: file.type,
            id: presignData.objectId,
            url: presignData.uploadUrl,
            });

            setSuccess(true);
            setTitle("");
            setDescription("");
            setProgress(0);
            navigate("/dashboard", {replace: true});
        } catch (err) {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-md-center">
                <Col md={8}>
                    <h3 className="mb-4">Upload New Video</h3>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Upload completed successfully!</Alert>}

                    <Form onSubmit={handleUpload}>
                        <Form.Group controlId="videoTitle" className="mb-3">
                            <Form.Label>Video Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter video title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group controlId="videoDescription" className="mb-3">
                            <Form.Label>Video Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter video description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group controlId="videoFile" className="mb-4">
                            <Form.Label>Video File (MP4 only)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="video/mp4"
                                onChange={handleFileChange}
                                required
                            />
                            <Form.Text className="text-muted">Only MP4 videos under your size limit are allowed.</Form.Text>
                        </Form.Group>

                        {uploading && (
                            <ProgressBar now={progress} label={`${progress}%`} animated className="mb-3" />
                        )}

                        <div className="d-flex justify-content-end">
                            <Button variant="primary" type="submit" disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" /> Uploading...
                                    </>
                                ) : (
                                    "Upload Video"
                                )}
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default VideoUploadPage;

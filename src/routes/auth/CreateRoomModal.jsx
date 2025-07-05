import React, { useState } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";

const CreateRoomModal = ({ show, onHide, onCreate }) => {
    const [roomName, setRoomName] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleCreate = () => {
        if (roomName.trim()) {
            setDisabled(true);
            onCreate(roomName.trim());
            setRoomName("");
            setDisabled(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="blurred-modal">
            <Modal.Header closeButton>
                <Modal.Title>Create Room</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formRoomName">
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Enter room name"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                            />
                            <Button onClick={handleCreate} disabled={disabled}>
                                Add
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CreateRoomModal;

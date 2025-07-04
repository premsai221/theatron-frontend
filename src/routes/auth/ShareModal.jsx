import React, { useState } from "react";
import { Modal, Button, Form, ListGroup, InputGroup, CloseButton, Alert } from "react-bootstrap";

const ShareModal = ({ show, onHide, list = [], onAdd, onRemove, message, setMessage }) => {
    list.sort()
    const [newUser, setNewUser] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleAdd = () => {
        if (newUser.trim()) {
            setDisabled(true)
            onAdd(newUser.trim());
            setNewUser("");
            setDisabled(false)
        }
    };

    const handleRemove = (user) => {
        setDisabled(true);
        onRemove(user);
        setTimeout(() => {
            setDisabled(false);
        }, 1500)
    }

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" dialogClassName="blurred-modal">
            <Alert dismissible className="m-2" show={message != ""} onClose={() => {setMessage("")}}>{message}</Alert>
            <Modal.Header closeButton>
                <Modal.Title>Share Video</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formNewUser">
                        <InputGroup>
                            <InputGroup.Text>@
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                value={newUser}
                                onChange={(e) => setNewUser(e.target.value)}
                            />
                            <Button onClick={handleAdd} disabled={disabled}>
                                Add
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Form>

                <hr />
                <h6>Users with access</h6>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    <ListGroup variant="flush">
                        {list.map((user, index) => (
                            <ListGroup.Item key={index}>
                                {user}
                                <CloseButton
                                    style={{ fontSize: "12px" }} 
                                    className="mx-4" 
                                    onClick={() => {handleRemove(user)}}
                                    disabled={disabled}
                                />
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default ShareModal;

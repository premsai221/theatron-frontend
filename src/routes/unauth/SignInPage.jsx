import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import axiosClient from '../../util/axiosClient';
import { login } from '../../store/userSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

const SignInPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loginError, setLoginError] = useState('');

    const dispatch = useDispatch();

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.password) newErrors.password = 'Password is required';
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setSubmitted(false);
            setLoginError('');
        } else {
            setErrors({});
            axiosClient.post('/auth/login', {
                username: formData.username,
                password: formData.password
            }).then((res) => {
                if (res.status == 200) {
                    dispatch(login(res.data))
                    navigate('/dashboard');
                }
            }).catch((err) => {
                console.log(err)
            })
        }
    };

    return (
        <Container className="mt-5" style={{ maxWidth: '400px' }}>
            <h2 className="mb-4 text-primary">Log In</h2>
            {submitted && <Alert variant="success">Login successful!</Alert>}
            {loginError && <Alert variant="danger">{loginError}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="signInUsername">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        isInvalid={!!errors.username}
                    />
                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4" controlId="signInPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!errors.password}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100">
                    Sign In
                </Button>
            </Form>
        </Container>
    );
};


export default SignInPage;
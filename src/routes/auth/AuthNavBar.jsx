import { Container, Navbar, Nav } from "react-bootstrap"
import { Link, Outlet, useNavigate } from "react-router"
import ProtectedPage from "./ProtectedPage"
import axiosClient from "../../util/axiosClient"
import { useDispatch } from "react-redux";
import { logout } from "../../store/userSlice";

function AuthNavBar() {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        axiosClient.get("/auth/logout").then(() => {
            dispatch(logout());
            navigate("/");
        })
    }

    return (
        <>
            <Container fluid className="p-0 min-vh-100 d-flex flex-column">
                <Navbar bg="primary" data-bs-theme="dark">
                    <Container>
                        <Navbar.Brand >Theatron</Navbar.Brand>
                        <Nav className="mw-auto">
                            <Nav.Item>
                                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Container>
                </Navbar>
                <ProtectedPage>
                    <Container className="d-flex flex-column flex-grow-1">
                        <Outlet/>
                    </Container>
                </ProtectedPage>
            </Container>
        </>
    )
}

export default AuthNavBar
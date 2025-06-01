import { Container, Navbar, Nav } from "react-bootstrap"
import { Link, NavLink, Outlet } from "react-router"
import UnProtectedPage from "./UnProtectedPage"

function UnAuthNavBar() {
    return (
        <>
            <Container fluid className="p-0 min-vh-100 d-flex flex-column">
                <Navbar bg="primary" data-bs-theme="dark">
                    <Container>
                        <Navbar.Brand >Theatron</Navbar.Brand>
                        <Nav className="mw-auto">
                            <Nav.Item>
                                <Nav.Link as={Link} to="/login">Log In</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Container>
                </Navbar>
                <UnProtectedPage>
                <Outlet/>
                </UnProtectedPage>
            </Container>
        </>
    )
}

export default UnAuthNavBar
import { Button, Container } from 'react-bootstrap'
import { Link } from 'react-router'

function IndexPage() {
    return (
        <Container className='m-auto text-center'>
            <div className='h1 text-primary'>Welcome to Theatron</div>
            <div className='fs-5 text-muted mb-2 w-75 mx-auto'>Upload videos, save storage and watch from anywhere. Theatron has you covered for when you run out space or need to playback your videos from around the world. Bored watching alone? Bring your party and watch together without having to worry about clicking on play at the same time.</div>
            <Link to="/login" className="mx-2 btn btn-primary">Log in</Link>
            <Link to="/signup" className="mx-2 btn btn-primary">Sign up</Link>
        </Container>
    )
}

export default IndexPage
import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand>LUCT Reporting App</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="text-center py-5">
        <h1 className="display-4">Welcome to LUCT Faculty Reporting System</h1>
        <p className="lead">Faculty of Information Communication Technology</p>
        <p>Streamline your reporting and monitoring with our intuitive platform.</p>
        <Button as={Link} to="/login" variant="primary" size="lg" className="mt-3">
          Get Started
        </Button>
      </Container>
    </div>
  );
};

export default LandingPage;
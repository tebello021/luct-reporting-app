import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Alert, Navbar, Nav } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [rating, setRating] = useState(1);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      const [reportsRes, coursesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/monitoring', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/courses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setReports(reportsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/ratings', { course_id: selectedCourse, rating, comment }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Rating submitted');
      setComment('');
    } catch (err) {
      setError('Rating submission failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Student Dashboard</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container className="mt-5">
        <h2>Monitoring</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Course</th>
              <th>Date</th>
              <th>Present/Total Students</th>
              <th>Topic</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.course_name}</td>
                <td>{report.lecture_date}</td>
                <td>{report.present_students} / {report.total_students}</td>
                <td>{report.topic}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2>Rate a Course</h2>
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleRatingSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Course</Form.Label>
            <Form.Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rating (1-5)</Form.Label>
            <Form.Control type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Comment</Form.Label>
            <Form.Control as="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
          </Form.Group>
          <Button variant="primary" type="submit">Submit Rating</Button>
        </Form>
      </Container>
    </div>
  );
};

export default StudentDashboard;
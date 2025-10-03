import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Alert, Navbar, Nav } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PrlDashboard = () => {
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
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
        axios.get('http://localhost:5000/api/reports', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/courses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setReports(reportsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/feedback', { lecture_id: selectedReport, comment: feedbackComment }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Feedback added');
      setFeedbackComment('');
      fetchData(token); // Refresh
    } catch (err) {
      setError('Feedback submission failed');
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
          <Navbar.Brand>PRL Dashboard</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container className="mt-5">
        <h2>Courses and Lectures (Monitoring)</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Course</th>
              <th>Lecturer</th>
              <th>Total Students</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.name} ({course.code})</td>
                <td>{course.lecturer_name || 'Unassigned'}</td>
                <td>{course.total_students}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2>Reports</h2>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Course</th>
              <th>Lecturer</th>
              <th>Date</th>
              <th>Present/Total</th>
              <th>Topic</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.course_name}</td>
                <td>{report.lecturer_name}</td>
                <td>{report.lecture_date}</td>
                <td>{report.present_students} / {report.total_students}</td>
                <td>{report.topic}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2>Add Feedback to Report</h2>
        <Form onSubmit={handleFeedbackSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Select Report</Form.Label>
            <Form.Select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)} required>
              <option value="">Select Report</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.course_name} - {report.lecture_date}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Comment</Form.Label>
            <Form.Control as="textarea" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} required />
          </Form.Group>
          <Button variant="primary" type="submit">Add Feedback</Button>
        </Form>

        <h2 className="mt-5">Rate a Course</h2>
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

export default PrlDashboard;
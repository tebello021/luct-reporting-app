import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert, Navbar, Nav } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PlDashboard = () => {
  const [courseForm, setCourseForm] = useState({ name: '', code: '', lecturer_id: '', total_students: '' });
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
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
      const [coursesRes, reportsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/reports', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCourses(coursesRes.data);
      setReports(reportsRes.data);
      // Fetch lecturers (users with role 'lecturer')
      const usersRes = await axios.get('http://localhost:5000/api/users/lecturers', { headers: { Authorization: `Bearer ${token}` } }); // Assume backend has this API; add if needed
      setLecturers(usersRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleCourseChange = (e) => {
    setCourseForm({ ...courseForm, [e.target.name]: e.target.value });
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/courses', courseForm, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Course added');
      fetchData(token); // Refresh
      setCourseForm({ name: '', code: '', lecturer_id: '', total_students: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Course addition failed');
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
          <Navbar.Brand>PL Dashboard</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container className="mt-5">
        <h2>Add/Assign Course</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleCourseSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Course Name</Form.Label>
            <Form.Control name="name" value={courseForm.name} onChange={handleCourseChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Course Code</Form.Label>
            <Form.Control name="code" value={courseForm.code} onChange={handleCourseChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Assign Lecturer</Form.Label>
            <Form.Select name="lecturer_id" value={courseForm.lecturer_id} onChange={handleCourseChange} required>
              <option value="">Select Lecturer</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>{lecturer.username}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Total Registered Students</Form.Label>
            <Form.Control type="number" name="total_students" value={courseForm.total_students} onChange={handleCourseChange} required />
          </Form.Group>
          <Button variant="primary" type="submit">Add Course</Button>
        </Form>

        <h2 className="mt-5">Courses and Classes</h2>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Lecturer</th>
              <th>Total Students</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.code}</td>
                <td>{course.lecturer_name || 'Unassigned'}</td>
                <td>{course.total_students}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2 className="mt-5">Reports (Monitoring)</h2>
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

export default PlDashboard;
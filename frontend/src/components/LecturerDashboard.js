import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert, Navbar, Nav, Card } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LecturerDashboard = () => {
  const [formData, setFormData] = useState({
    faculty: '', class_name: '', week: '', lecture_date: '', course_id: '', present_students: '', venue: '', scheduled_time: '', topic: '', outcomes: '', recommendations: ''
  });
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
    console.log('Token:', token); // Debug
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
      console.log('Courses:', coursesRes.data); // Debug
      setCourses(coursesRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/reports', formData, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Report submitted');
      fetchData(token);
      setFormData({ faculty: '', class_name: '', week: '', lecture_date: '', course_id: '', present_students: '', venue: '', scheduled_time: '', topic: '', outcomes: '', recommendations: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Report submission failed');
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
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand>Lecturer Dashboard</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <h2 className="mb-4">Submit Lecture Report</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Card className="p-4 mb-4 shadow">
          <Form onSubmit={handleReportSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Faculty Name</Form.Label>
              <Form.Control name="faculty" value={formData.faculty} onChange={handleChange} required placeholder="e.g., ICT" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Class Name</Form.Label>
              <Form.Control name="class_name" value={formData.class_name} onChange={handleChange} required placeholder="e.g., DIWA2110 Class" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Week of Reporting</Form.Label>
              <Form.Control type="number" name="week" value={formData.week} onChange={handleChange} required placeholder="e.g., 6" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date of Lecture</Form.Label>
              <Form.Control type="date" name="lecture_date" value={formData.lecture_date} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select name="course_id" value={formData.course_id} onChange={handleChange} required>
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code}) - PRL: {course.prl_name || 'Unassigned'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Actual Number of Students Present</Form.Label>
              <Form.Control type="number" name="present_students" value={formData.present_students} onChange={handleChange} required placeholder="e.g., 25" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Venue</Form.Label>
              <Form.Control name="venue" value={formData.venue} onChange={handleChange} required placeholder="e.g., Room 101" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Scheduled Lecture Time</Form.Label>
              <Form.Control name="scheduled_time" value={formData.scheduled_time} onChange={handleChange} required placeholder="e.g., 10:00-12:00" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Topic Taught</Form.Label>
              <Form.Control name="topic" value={formData.topic} onChange={handleChange} required placeholder="e.g., Introduction to React" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Learning Outcomes</Form.Label>
              <Form.Control as="textarea" name="outcomes" value={formData.outcomes} onChange={handleChange} required placeholder="e.g., Understand React components" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Recommendations</Form.Label>
              <Form.Control as="textarea" name="recommendations" value={formData.recommendations} onChange={handleChange} placeholder="e.g., More practical exercises" />
            </Form.Group>
            <Button variant="primary" type="submit">Submit Report</Button>
          </Form>
        </Card>

        <h2 className="mb-4">Your Reports (Monitoring)</h2>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Course</th>
              <th>Date</th>
              <th>Present Students</th>
              <th>Topic</th>
              <th>Outcomes</th>
              <th>Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.course_name}</td>
                <td>{report.lecture_date}</td>
                <td>{report.present_students}</td>
                <td>{report.topic}</td>
                <td>{report.outcomes}</td>
                <td>{report.recommendations}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <h2 className="mb-4">Rate a Course</h2>
        <Card className="p-4 shadow">
          <Form onSubmit={handleRatingSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code}) - PRL: {course.prl_name || 'Unassigned'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rating (1-5)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
                placeholder="Enter rating"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your feedback"
              />
            </Form.Group>
            <Button variant="primary" type="submit">Submit Rating</Button>
          </Form>
        </Card>
      </Container>
    </div>
  );
};

export default LecturerDashboard;
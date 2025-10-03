const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'luct_secret_key_2025'; // Secure key (change in production)

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow frontend
app.use(bodyParser.json());

// Register
app.post('/api/register', async (req, res) => {
  const { username, password, role, faculty } = req.body;
  if (!username || !password || !role || !faculty) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (!['student', 'lecturer', 'prl', 'pl'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, password, role, faculty) VALUES (?, ?, ?, ?)',
      [username, hash, role, faculty],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        res.status(201).json({ message: 'User registered' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token, role: user.role, userId: user.id });
    });
  });
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Lecturer: Submit report
app.post('/api/reports', verifyToken, (req, res) => {
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Forbidden: Lecturers only' });
  }
  const {
    faculty, class_name, week, lecture_date, course_id,
    present_students, venue, scheduled_time, topic, outcomes, recommendations
  } = req.body;
  if (!faculty || !class_name || !week || !lecture_date || !course_id || !present_students || !venue || !scheduled_time || !topic || !outcomes) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }
  db.query(
    'SELECT total_students FROM courses WHERE id = ?',
    [course_id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      const total_students = results[0].total_students;
      if (present_students > total_students) {
        return res.status(400).json({ error: 'Present students cannot exceed total registered students' });
      }
      db.query(
        `INSERT INTO lectures (
          faculty, class_name, week, lecture_date, course_id, lecturer_id,
          present_students, venue, scheduled_time, topic, outcomes, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          faculty, class_name, week, lecture_date, course_id, req.user.id,
          present_students, venue, scheduled_time, topic, outcomes, recommendations
        ],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to submit report' });
          }
          res.json({ message: 'Report submitted successfully', total_students });
        }
      );
    }
  );
});

// Get all courses (for dropdowns, dashboards)
app.get('/api/courses', verifyToken, (req, res) => {
  db.query(
    'SELECT c.id, c.name, c.code, c.total_students, u.username as lecturer_name FROM courses c LEFT JOIN users u ON c.lecturer_id = u.id',
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch courses' });
      }
      res.json(results);
    }
  );
});

// PL: Add course
app.post('/api/courses', verifyToken, (req, res) => {
  if (req.user.role !== 'pl') {
    return res.status(403).json({ error: 'Forbidden: Program Leaders only' });
  }
  const { name, code, lecturer_id, total_students } = req.body;
  if (!name || !code || !lecturer_id || !total_students) {
    return res.status(400).json({ error: 'All fields required' });
  }
  db.query(
    'SELECT id FROM users WHERE id = ? AND role = "lecturer"',
    [lecturer_id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ error: 'Invalid lecturer ID' });
      }
      db.query(
        'INSERT INTO courses (name, code, lecturer_id, total_students) VALUES (?, ?, ?, ?)',
        [name, code, lecturer_id, total_students],
        (err) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ error: 'Course code already exists' });
            }
            return res.status(500).json({ error: 'Failed to add course' });
          }
          res.json({ message: 'Course added successfully' });
        }
      );
    }
  );
});

// View reports (role-based)
app.get('/api/reports', verifyToken, (req, res) => {
  let query = `
    SELECT l.*, c.name as course_name, c.total_students, u.username as lecturer_name
    FROM lectures l 
    JOIN courses c ON l.course_id = c.id 
    JOIN users u ON l.lecturer_id = u.id
  `;
  let params = [];
  if (req.user.role === 'lecturer') {
    query += ' WHERE l.lecturer_id = ?';
    params = [req.user.id];
  } else if (req.user.role !== 'prl' && req.user.role !== 'pl') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }
    res.json(results);
  });
});

// PRL: Add feedback to report
app.post('/api/feedback', verifyToken, (req, res) => {
  if (req.user.role !== 'prl') {
    return res.status(403).json({ error: 'Forbidden: PRL only' });
  }
  const { lecture_id, comment } = req.body;
  if (!lecture_id || !comment) {
    return res.status(400).json({ error: 'Lecture ID and comment required' });
  }
  db.query(
    'INSERT INTO feedback (lecture_id, prl_id, comment) VALUES (?, ?, ?)',
    [lecture_id, req.user.id, comment],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to add feedback' });
      }
      res.json({ message: 'Feedback added successfully' });
    }
  );
});

// Get feedback for a report
app.get('/api/feedback/:lecture_id', verifyToken, (req, res) => {
  if (req.user.role !== 'prl' && req.user.role !== 'pl' && req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.query(
    'SELECT f.*, u.username as prl_name FROM feedback f JOIN users u ON f.prl_id = u.id WHERE f.lecture_id = ?',
    [req.params.lecture_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch feedback' });
      }
      res.json(results);
    }
  );
});

// Ratings: Submit and view
app.post('/api/ratings', verifyToken, (req, res) => {
  const { course_id, rating, comment } = req.body;
  if (!course_id || !rating) {
    return res.status(400).json({ error: 'Course ID and rating required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  db.query(
    'INSERT INTO ratings (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [course_id, req.user.id, rating, comment || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to submit rating' });
      }
      res.json({ message: 'Rating submitted successfully' });
    }
  );
});

app.get('/api/ratings/:course_id', verifyToken, (req, res) => {
  db.query(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE course_id = ?',
    [req.params.course_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch ratings' });
      }
      res.json({
        avg_rating: results[0].avg_rating ? parseFloat(results[0].avg_rating).toFixed(2) : 0,
        count: results[0].count
      });
    }
  );
});

// Student: Monitoring (view reports)
app.get('/api/monitoring', verifyToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden: Students only' });
  }
  db.query(
    'SELECT l.*, c.name as course_name, c.total_students FROM lectures l JOIN courses c ON l.course_id = c.id',
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch monitoring data' });
      }
      res.json(results);
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

// Get lecturers for assignment
app.get('/api/users/lecturers', verifyToken, (req, res) => {
  if (req.user.role !== 'pl') return res.status(403).json({ error: 'Forbidden' });
  db.query('SELECT id, username FROM users WHERE role = "lecturer"', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch lecturers' });
    res.json(results);
  });
});
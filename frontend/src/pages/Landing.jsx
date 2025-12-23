import { useNavigate } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">HSC Power</span>
            </div>
            <div className="nav-buttons">
              <button className="btn-text" onClick={() => navigate('/login/student')}>
                Student Login
              </button>
              <button className="btn-text" onClick={() => navigate('/login/teacher')}>
                Teacher Login
              </button>
              <button className="btn-text" onClick={() => navigate('/login/parent')}>
                Parent Login
              </button>
              <button className="btn-primary" onClick={() => navigate('/register/student')}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Empower Your <span className="gradient-text">HSC Journey</span>
            </h1>
            <p className="hero-subtitle">
              The comprehensive learning platform designed for HSC students and teachers
            </p>
            <p className="hero-description">
              Join thousands of students excelling in their studies with intelligent tools, 
              personalized resources, and collaborative learning environments.
            </p>
            <div className="cta-buttons">
              <button className="btn btn-primary-large" onClick={() => navigate('/register/student')}>
                Start Learning Now
              </button>
              <button className="btn btn-secondary-large" onClick={() => window.scrollTo({ top: document.querySelector('.features').offsetTop, behavior: 'smooth' })}>
                Explore Features
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">10k+</div>
                <div className="stat-label">Active Students</div>
              </div>
              <div className="stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Dedicated Teachers</div>
              </div>
              <div className="stat">
                <div className="stat-number">95%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features for Success</h2>
          <p className="section-subtitle">Everything you need to excel in your HSC studies</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Comprehensive Resources</h3>
              <p>Access curated study materials, practice questions, and past HSC papers across all subjects.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your learning journey with detailed analytics and personalized insights.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Class Management</h3>
              <p>Teachers can easily manage classes, assign work, and track student performance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Interactive Learning</h3>
              <p>Engage with peers and teachers through discussions, Q&A, and collaborative study.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Performance Analytics</h3>
              <p>Get detailed insights into strengths and areas for improvement with data-driven reports.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Feedback</h3>
              <p>Receive immediate feedback on assignments and practice tests to learn faster.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Students register with a class code provided by their teacher</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Join Classes</h3>
              <p>Get automatically assigned to your classes and access materials</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Learn & Excel</h3>
              <p>Complete assignments, track progress, and achieve your goals</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Power Up Your HSC Success?</h2>
            <p>Join thousands of students and teachers already using HSC Power</p>
            <div className="cta-buttons-row">
              <button className="btn btn-primary-large" onClick={() => navigate('/register/student')}>
                Register as Student
              </button>
              <button className="btn btn-outline-large" onClick={() => navigate('/login/teacher')}>
                Teacher Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>HSC Power</h4>
              <p>Empowering HSC students to achieve their academic dreams</p>
            </div>
            <div className="footer-section">
              <h4>For Students</h4>
              <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/register/student'); }}>Register</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/student'); }}>Login</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/recover'); }}>Recover Account</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>For Teachers</h4>
              <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/teacher'); }}>Login</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/recover'); }}>Recover Account</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>For Parents</h4>
              <ul>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/parent'); }}>Login</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/recover'); }}>Recover Account</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 HSC Power - ELEC5620 Group 83. All rights reserved.</p>
            <p className="tech-stack">Built with React, Vite & Express.js</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing


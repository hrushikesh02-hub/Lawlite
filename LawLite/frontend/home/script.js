
// ===== TYPEWRITER EFFECT FOR HERO SECTION =====
const typewriterElement = document.getElementById('typewriter');
const textToType = 'justice denied';
let charIndex = 0;

function typeWriter() {
  if (charIndex < textToType.length) {
    typewriterElement.textContent += textToType.charAt(charIndex);
    charIndex++;
    setTimeout(typeWriter, 150); // Adjust speed here (milliseconds per character)
  }
}

// Start typewriter effect after page loads
window.addEventListener('load', () => {
  setTimeout(typeWriter, 500); // Delay before starting
});

// ===== NAVIGATION SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// ===== DARK MODE TOGGLE =====
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  body.classList.add('dark-mode');
  darkModeToggle.textContent = '☀️';
}

darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');

  if (body.classList.contains('dark-mode')) {
    darkModeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    darkModeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
});

// ===== NEWS TICKER AUTO-ROTATION =====
const tickerItems = document.querySelectorAll('.ticker-item');
let currentTickerIndex = 0;

function rotateTicker() {
  tickerItems[currentTickerIndex].classList.remove('active');
  currentTickerIndex = (currentTickerIndex + 1) % tickerItems.length;
  tickerItems[currentTickerIndex].classList.add('active');
}

setInterval(rotateTicker, 5000);

// ===== SEARCH INPUT INTERACTION =====
const searchInput = document.getElementById('searchInput');
const suggestionTags = document.querySelectorAll('.suggestion-tag');

suggestionTags.forEach(tag => {
  tag.addEventListener('click', () => {
    searchInput.value = tag.textContent;
    searchInput.focus();
  });
});

// ===== SMOOTH SCROLL FOR NAVIGATION =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ===== CONTACT FORM VALIDATION & SUBMISSION =====
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Reset previous errors
  document.querySelectorAll('.form-group').forEach(group => {
    group.classList.remove('error');
  });
  formMessage.className = 'form-message';
  formMessage.style.display = 'none';

  // Get form values
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  let isValid = true;

  // Validate name
  if (!name) {
    document.getElementById('name').closest('.form-group').classList.add('error');
    isValid = false;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    document.getElementById('email').closest('.form-group').classList.add('error');
    isValid = false;
  }

  // Validate message
  if (!message) {
    document.getElementById('message').closest('.form-group').classList.add('error');
    isValid = false;
  }

  if (!isValid) {
    formMessage.textContent = 'Please fill in all fields correctly.';
    formMessage.className = 'form-message error';
    formMessage.style.display = 'block';
    return;
  }

  // Disable submit button
  const submitBtn = contactForm.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  // Simulate form submission (replace with actual API call)
  setTimeout(() => {
    formMessage.textContent = 'Thank you! Your message has been sent successfully. We will get back to you soon.';
    formMessage.className = 'form-message success';
    formMessage.style.display = 'block';

    // Reset form
    contactForm.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';

    // Hide success message after 5 seconds
    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);
  }, 1500);
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe service cards, rights cards, and SDG cards
document.querySelectorAll('.service-card, .sdg-card, .rights-card, .value-item').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(card);
});

// ===== STATS COUNTER ANIMATION =====
const animateCounter = (element, target) => {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + (element.textContent.includes('%') ? '%' : '+');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + (element.textContent.includes('%') ? '%' : '+');
    }
  }, 30);
};

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumbers = entry.target.querySelectorAll('.stat-number, .metric-number');
      statNumbers.forEach(stat => {
        const text = stat.textContent;
        const number = parseInt(text.replace(/\D/g, ''));
        if (number && !stat.dataset.animated) {
          stat.dataset.animated = 'true';
          animateCounter(stat, number);
        }
      });
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.hero-stats, .sdg-metrics').forEach(section => {
  statsObserver.observe(section);
});

// ===== SERVICE CARD HOVER EFFECTS =====
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mouseenter', function () {
    this.style.borderColor = 'var(--primary-blue)';
  });

  card.addEventListener('mouseleave', function () {
    if (!this.classList.contains('featured')) {
      this.style.borderColor = 'rgba(30, 64, 175, 0.1)';
    }
  });
});

// ===== PARALLAX EFFECT FOR FLOATING SHAPES =====
window.addEventListener('mousemove', (e) => {
  const shapes = document.querySelectorAll('.floating-shape');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  shapes.forEach((shape, index) => {
    const speed = (index + 1) * 20;
    shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });
});

// ===== LOADING ANIMATION =====
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  }, 100);
});

// ============================================================================
//  Everything the site displays comes from this file.
//  Content taken from RESUME-CS-LAST SEMESTER INTERN-NG JUN JIE-JAN 2027.pdf
// ============================================================================

export const profile = {
  name: 'Ng Jun Jie',
  role: 'Final-Year Computer Science Student',
  location: 'Gelugor, Penang, Malaysia',
  availability: 'Available for internship · 19 Oct 2026 — 16 Jan 2027',
  tagline:
    'Computer Science undergraduate at UTAR, building mobile and full-stack systems — from a face-recognition attendance app to community resource-sharing platforms.',
  about: [
    'I am a final-semester Computer Science student at Universiti Tunku Abdul Rahman with a broad foundation across Python, Java, C++, PHP and JavaScript. Most of what I have built has been end to end: a mobile or web front end, a backend I wrote myself, and a database schema designed around the problem rather than bolted on afterwards.',
    'My final year project pushed that furthest — a React Native attendance system backed by Python, using YuNet for face detection, ArcFace for recognition, and an anti-spoofing model to stop fraudulent check-ins. I am now looking for an internship where I can apply that analytical and problem-solving work in a professional team and keep learning quickly.',
  ],
  // Put a photo in /public and set e.g. '/me.jpg'. Leave null for initials.
  photo: null,
  resumeUrl: null, // e.g. '/resume.pdf' (place the file in /public)
}

export const contact = {
  email: 'jjng0063@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/jjng0063-creator' },
    // Add LinkedIn here when you have it:
    //   { label: 'LinkedIn', href: 'https://linkedin.com/in/your-handle' },
  ],
}

export const education = [
  {
    school: 'Universiti Tunku Abdul Rahman',
    degree: 'Bachelor of Computer Science (Honours)',
    period: '2024 — Present',
    grade: 'CGPA 2.82',
    details: [
      'Currently in Year 3, final semester.',
      'Final year project: a face-recognition attendance system combining YuNet detection, ArcFace recognition and anti-spoofing.',
    ],
  },
  {
    school: 'Universiti Tunku Abdul Rahman',
    degree: 'Foundation in Science',
    period: '2022 — 2023',
    grade: 'CGPA 2.54',
    details: ['Completed the foundation programme leading into the Computer Science degree.'],
  },
]

export const experience = [
  {
    company: 'Hei Hwang Food Industries (M) Sdn. Bhd.',
    role: 'Part Time Promoter',
    period: 'Jan 2026 — Feb 2026',
    location: 'Penang, Malaysia',
    summary: 'Seasonal retail promotion for the Chinese New Year hamper range.',
    highlights: [
      'Engaged customers to promote Chinese New Year hampers, explaining products and addressing enquiries.',
      'Continued developing communication and interpersonal skills through varied customer interactions.',
    ],
    stack: [],
  },
  {
    company: 'Yin Onn Herbs',
    role: 'Part Time Promoter',
    period: 'Jan 2025 — Feb 2025',
    location: 'Penang, Malaysia',
    summary: 'Customer-facing promotion of herbal products in a retail setting.',
    highlights: [
      'Engaged customers to promote herbal products, explaining features and addressing enquiries.',
      'Developed strong communication and interpersonal skills through diverse customer interactions.',
    ],
    stack: [],
  },
  {
    company: 'TF Value Mart',
    role: 'Sales Assistant',
    period: 'May 2022 — Aug 2022',
    location: 'Penang, Malaysia',
    summary: 'Retail floor support covering merchandising, stock and customer service.',
    highlights: [
      'Systematically organised and managed merchandise for optimal display and inventory control.',
      'Applied logical troubleshooting to resolve customer enquiries and operational issues quickly, maintaining service flow.',
    ],
    stack: [],
  },
]

// These become the cards in the 3D carousel.
// `accent` sets the card's colour wash — any two CSS colours work.
export const projects = [
  {
    title: 'Face Recognition Attendance System',
    kind: 'Final Year Project',
    blurb: 'Real-time attendance tracking with deep-learning face recognition and anti-spoofing.',
    description:
      'A React Native mobile app backed by a Python service for real-time attendance tracking. It uses YuNet for face detection and ArcFace for deep-learning face recognition, with an anti-spoofing model layered on top so a photograph or replayed video cannot be used to check in. A PocketBase schema stores user profiles and biometric logs securely.',
    stack: ['React Native', 'Python', 'YuNet', 'ArcFace', 'PocketBase'],
    year: '2025 — 2026',
    links: [],
    accent: ['#6366f1', '#0ea5e9'],
  },
  {
    title: 'CharityLink',
    kind: 'Waste-to-Wealth Mobile App',
    blurb: 'Community resource sharing with peer-to-peer posting and real-time chat.',
    description:
      'A community resource-sharing mobile app built around peer-to-peer item posting and a real-time chat module, letting people pass on goods rather than discard them. I designed the application layouts, interactive user flows and original brand logos in Figma, and configured a lightweight Firebase backend to handle user authentication and immediate data state.',
    stack: ['React Native', 'Firebase', 'Figma'],
    year: '2026',
    links: [],
    accent: ['#10b981', '#14b8a6'],
  },
  {
    title: 'Student Co-curricular Management System',
    kind: 'Full-Stack Web App',
    blurb: 'A university web application for managing student activities.',
    description:
      'A full-stack university web application, co-developed in PHP and MySQL, for managing student co-curricular activities. I created the relational database schemas and the server-side CRUD operations that handle dynamic data rendering across the system.',
    stack: ['PHP', 'MySQL'],
    year: '2026',
    links: [],
    accent: ['#f43f5e', '#f59e0b'],
  },
  {
    title: 'Stock Management System',
    kind: 'Desktop Application',
    blurb: 'Retail inventory tracking for appliance stock levels, written in Java.',
    description:
      'A retail inventory application written in Java to track and manage appliance stock levels. The design applies object-oriented programming principles throughout to keep the architecture clean, reusable and modular.',
    stack: ['Java', 'OOP'],
    year: '2025',
    links: [],
    accent: ['#a855f7', '#ec4899'],
  },
  {
    title: 'Student Exam System',
    kind: 'CLI Application',
    blurb: 'Command-line registration, course selection and exam slot booking.',
    description:
      'A command-line system in C++ supporting student registration, course selection and exam slot booking. It also includes administrative features for secure course management, updates and record deletion.',
    stack: ['C++'],
    year: '2024',
    links: [],
    accent: ['#0ea5e9', '#22d3ee'],
  },
]

export const skills = [
  {
    group: 'Programming Languages',
    items: ['Python', 'Java', 'C++', 'PHP', 'JavaScript', 'Kotlin', 'HTML'],
  },
  {
    group: 'Frameworks & Libraries',
    items: ['React Native', 'Flask / FastAPI', 'Room Persistence Library', 'YuNet', 'ArcFace'],
  },
  {
    group: 'Databases & Tools',
    items: ['PocketBase', 'MySQL', 'SQLite', 'Firebase', 'Figma', 'Microsoft Office', 'AI Agents'],
  },
  {
    group: 'Spoken Languages',
    items: ['English', 'Chinese', 'Malay', 'Hokkien'],
  },
]

USE `careers`;

-- Create the careers table to store applicant details
CREATE TABLE applicants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Personal Info
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    country VARCHAR(100),
    userThumbnail LONGBLOB,
    resume LONGBLOB,
    status VARCHAR(50),
    
    -- JSON Arrays
    professionalLinks JSON,
    educations JSON,
    experiences JSON,
    skills JSON,
    certifications JSON,
    projects JSON,
    languages JSON,
    interests JSON,

    createdBy    VARCHAR(255) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedBy    VARCHAR(255) NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT INTO applicants (
    firstName, lastName, email, phone, address, country, userThumbnail, resume, status,
    professionalLinks, educations, experiences, skills, certifications, projects, languages, interests
)
VALUES (
    'Jane', 'Smith', 'janesmith@example.com', '+15551234567', '45 Maple Street, Springfield', 'United States',
    'https://example.com/jane_thumbnail.jpg', 'https://example.com/jane_resume.pdf', 'active',

    -- Convert each JSON array to valid JSON string
    '[
        {"title": "linkedin", "link": "https://www.linkedin.com/in/janesmith"},
        {"title": "github", "link": "https://github.com/janesmith"},
        {"title": "portfolio", "link": "https://github.com/janesmith"},
        {"title": "hackerrank", "link": "https://www.hackerrank.com/janesmith"}
    ]',
    
    '[
        {"degree": "B.Sc. Computer Science", "institution": "University of California, Berkeley", "location": "California, United States", "gpa_zscore": 3.8, "start_year": 2017, "end_year": 2021},
        {"degree": "A-Level", "institution": "Springfield High School", "location": "Springfield, United States", "gpa_zscore": 3.9, "start_year": 2015, "end_year": 2017}
    ]',

    '[
        {"job_title": "Full Stack Developer", "company": "InnovateX Solutions", "location": "New York, NY", "start_date": 2021, "end_date": null},
        {"job_title": "Software Engineering Intern", "company": "TechCore", "location": "San Francisco, CA", "start_date": 2020, "end_date": 2020}
    ]',

    '["Python", "React"]',

    '[
        {"name": "AWS Certified Developer – Associate", "issued_by": "Amazon Web Services", "year": 2022, "link": "https://aws.amazon.com/certification/"},
        {"name": "Scrum Master Certification", "issued_by": "Scrum Alliance", "year": 2021, "link": "https://www.scrumalliance.org/"}
    ]',

    '[
        {"name": "E-Commerce Web Platform", "description": "Developed a scalable e-commerce platform...", "technologies": ["React", "Node.js", "MongoDB", "Express"], "github": "https://github.com/janesmith/ecommerce-platform"},
        {"name": "DevOps Automation", "description": "Created CI/CD pipelines...", "technologies": ["Docker", "Jenkins", "Kubernetes"], "github": "https://github.com/janesmith/devops-automation"}
    ]',

    '[
        {"language": "English", "proficiency": "Fluent"},
        {"language": "Spanish", "proficiency": "Intermediate"}
    ]',

    '["Hiking", "Traveling", "Open Source Contribution", "Reading"]'
);

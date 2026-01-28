USE `careers`;

-- Create the careers table to store applicant details
CREATE TABLE applicants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Personal Info
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(150) UNIQUE,
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

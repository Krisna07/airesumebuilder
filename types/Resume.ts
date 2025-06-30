export interface PersonalDetail {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
}

export interface WorkExperience {
    company?: string;
    role?: string;
    duration?: string;
    description?: string;
}

export interface Education {
    institution?: string;
    degree?: string;
    field?: string;
    duration?: string;
}

export interface Project {
    name?: string;
    description?: string;
    techStack?: string;
    role?: string;
}

export interface Skills {
    technical?: string[];
    soft?: string[];
}

export interface Certifications {
    name?: string;
    issuer?: string;
    date?: string;
}

export interface AdditionalSection {
    title?: string;
    content?: string;
}

export interface Resume {
    personal?: PersonalDetail;
    workExperience?: WorkExperience[];
    education?: Education[];
    projects?: Project[];
    skills?: Skills;
    certifications?: Certifications[];
    additionalSections?: AdditionalSection[];
}

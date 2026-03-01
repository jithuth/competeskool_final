export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'judge';

export interface Profile {
    id: string;
    role: UserRole;
    full_name: string | null;
    email: string | null;
    school_id: string | null;
    created_at: string;
}

export interface School {
    id: string;
    name: string;
    address: string | null;
    logo_url: string | null;
    created_at: string;
}

export interface Teacher {
    id: string;
    employee_id: string | null;
    specialization: string | null;
}

export interface Student {
    id: string;
    phone: string | null;
    father_name: string | null;
    mother_name: string | null;
    grade_level: string | null;
}

export interface Event {
    id: string;
    title: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: 'upcoming' | 'active' | 'completed';
    created_by: string | null;
    banner_url: string | null;
    full_rules: string | null;
    is_private?: boolean;
    school_id?: string | null;
}

export interface Submission {
    id: string;
    event_id: string;
    student_id: string;
    title: string | null;
    description: string | null;
    status: 'pending' | 'reviewed' | 'awarded';
    score: number | null;
    feedback: string | null;
    created_at: string;
}

export interface SubmissionVideo {
    id: string;
    submission_id: string;
    video_url: string | null;
    youtube_url: string | null;
    vimeo_url: string | null;
    storage_path: string | null;
    type: 'upload' | 'youtube' | 'vimeo';
}

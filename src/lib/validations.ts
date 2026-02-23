import { z } from "zod";

export const studentSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    father_name: z.string().min(2, "Father's name is required"),
    mother_name: z.string().min(2, "Mother's name is required"),
    school_id: z.string().uuid("Please select a school"),
    grade_level: z.string().min(1, "Grade level is required"),
    teacher_id: z.string().uuid("Please select a teacher"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    start_date: z.string(),
    end_date: z.string(),
    banner_url: z.string().optional(),
    media_type: z.enum(["video", "audio", "image", "document", "audio_video", "audio_image"]),
    full_rules: z.string().min(10, "Rules must be detailed"),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export const submissionSchema = z.object({
    title: z.string().min(3, "Title is required"),
    description: z.string().min(10, "Description is required"),
    event_id: z.string().uuid(),
    type: z.enum(["upload", "youtube"]),
    video_url: z.string().optional(),
    youtube_url: z.string().url().optional(),
}).refine((data) => {
    if (data.type === "youtube" && !data.youtube_url) return false;
    if (data.type === "upload" && !data.video_url) return false;
    return true;
}, {
    message: "Video source is required",
    path: ["video_url", "youtube_url"],
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;

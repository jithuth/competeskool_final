-- Enforce one submission per student per event
ALTER TABLE public.submissions 
ADD CONSTRAINT unique_student_event_submission UNIQUE (student_id, event_id);

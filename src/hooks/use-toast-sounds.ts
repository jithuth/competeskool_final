"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useToastSounds() {
    const playSound = (type: "success" | "error") => {
        const audio = new Audio(type === "success" ? "/sounds/success.mp3" : "/sounds/error.mp3");
        audio.play().catch(() => {
            // Ignore if sound fails to play (e.g. user hasn't interacted with page)
        });
    };

    return {
        success: (message: string) => {
            playSound("success");
            toast.success(message);
        },
        error: (message: string) => {
            playSound("error");
            toast.error(message);
        },
    };
}

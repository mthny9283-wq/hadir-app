"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface AttendanceUpdate {
  id: number;
  lectureId: number;
  studentId: number;
  status: string;
  lockedBy: string | null;
  lockedAt: string | null;
  lockedBySession: string | null;
}

interface UseAttendanceRealtimeOptions {
  lectureId: number;
  onAttendanceUpdated?: (update: AttendanceUpdate) => void;
  onStudentLocked?: (update: AttendanceUpdate) => void;
  onLectureCompleted?: () => void;
}

export function useAttendanceRealtime({
  lectureId,
  onAttendanceUpdated,
  onStudentLocked,
  onLectureCompleted,
}: UseAttendanceRealtimeOptions) {
  const callbacksRef = useRef({
    onAttendanceUpdated,
    onStudentLocked,
    onLectureCompleted,
  });

  callbacksRef.current = {
    onAttendanceUpdated,
    onStudentLocked,
    onLectureCompleted,
  };

  const handleInsert = useCallback((payload: { new: AttendanceUpdate }) => {
    callbacksRef.current.onAttendanceUpdated?.(payload.new);
  }, []);

  const handleUpdate = useCallback(
    (payload: { new: AttendanceUpdate; old: { lockedBy: string | null } }) => {
      const updated = payload.new;
      const oldLockedBy = payload.old.lockedBy;

      if (updated.lockedBy && !oldLockedBy) {
        callbacksRef.current.onStudentLocked?.(updated);
      } else {
        callbacksRef.current.onAttendanceUpdated?.(updated);
      }
    },
    []
  );

  useEffect(() => {
    if (!lectureId) return;

    const supabase = getSupabaseBrowser();
    const channelName = `attendance:lecture:${lectureId}`;

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "Attendance",
          filter: `lectureId=eq.${lectureId}`,
        } as never,
        handleInsert as never
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "Attendance",
          filter: `lectureId=eq.${lectureId}`,
        } as never,
        handleUpdate as never
      )
      .on(
        "postgres_changes" as never,
        {
          event: "DELETE",
          schema: "public",
          table: "Attendance",
          filter: `lectureId=eq.${lectureId}`,
        } as never,
        (() => {
          callbacksRef.current.onLectureCompleted?.();
        }) as never
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lectureId, handleInsert, handleUpdate]);
}

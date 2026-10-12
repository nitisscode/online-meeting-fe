"use client";

import { useActionState, useState } from "react";

import { joinMeetingAction } from "@/app/actions/meetings";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { MEETING_LIMITS } from "@/constants/meetings";

export function JoinForm() {
  const [state, action, pending] = useActionState(joinMeetingAction, null);
  const [meetingCode, setMeetingCode] = useState("");
  const [passCode, setPassCode] = useState("");
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Alert message={state?.message} />
      <Field
        label="Meeting code"
        name="meeting_code"
        autoComplete="off"
        required
        maxLength={MEETING_LIMITS.meetingCodeLength}
        value={meetingCode}
        onChange={(event) => setMeetingCode(event.target.value.toUpperCase())}
        errors={errors?.meeting_code}
      />
      <Field
        label="Passcode"
        name="pass_code"
        autoComplete="off"
        maxLength={MEETING_LIMITS.passCodeMax}
        value={passCode}
        onChange={(event) => setPassCode(event.target.value)}
        errors={errors?.pass_code}
      />
      <Button type="submit" pending={pending} className="self-start">
        Join meeting
      </Button>
    </form>
  );
}

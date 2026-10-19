import { Suspense } from "react";
import { AuthAction } from "./AuthAction";

/** Custom handler for Firebase email links. Set it as the action URL in the Firebase console. */
export default function AuthActionPage() {
  return (
    <Suspense>
      <AuthAction />
    </Suspense>
  );
}

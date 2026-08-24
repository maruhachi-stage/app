import { useStaffAuthContext } from "~/providers/StaffAuthProvider"

export function useStaffAuth() {
  return useStaffAuthContext()
}

import { useCallback, useEffect, useState } from "react"
import { getEditAccess, verifyEditKey } from "~/features/edit-access/api/edit-access"
import type { AdminEditAccessStatus, EditKeyStatus } from "~/types/admin"

const EDIT_KEY_STORAGE = "hal-admin-edit-key"

export function useEditAccess() {
  const [editKey, setEditKey] = useState("")
  const [editKeyStatus, setEditKeyStatus] = useState<EditKeyStatus>("unchecked")
  const [editAccessStatus, setEditAccessStatus] = useState<AdminEditAccessStatus>("unchecked")
  const [checkingKey, setCheckingKey] = useState(false)
  const [error, setError] = useState("")
  const verify = useCallback(async (key: string) => {
    setCheckingKey(true)
    setError("")
    try {
      const result = await verifyEditKey(key)
      const status = resolveStatus(result.configured, result.valid, key)
      setEditKeyStatus(status)
      if (result.valid) {
        await getEditAccess(key)
        setEditAccessStatus("available")
        window.sessionStorage.setItem(EDIT_KEY_STORAGE, key)
      } else {
        setEditAccessStatus(key ? "blocked" : "unchecked")
        window.sessionStorage.removeItem(EDIT_KEY_STORAGE)
      }
    } catch (cause) {
      setEditKeyStatus("invalid")
      setEditAccessStatus("blocked")
      setError(cause instanceof Error ? cause.message : "編集キーの確認に失敗しました")
    } finally { setCheckingKey(false) }
  }, [])
  useEffect(() => {
    const storedKey = window.sessionStorage.getItem(EDIT_KEY_STORAGE) ?? ""
    setEditKey(storedKey)
    void verify(storedKey)
  }, [verify])
  const clear = useCallback(() => {
    setEditKey("")
    setEditKeyStatus("unchecked")
    setEditAccessStatus("unchecked")
    setError("")
    window.sessionStorage.removeItem(EDIT_KEY_STORAGE)
  }, [])
  return { editKey, setEditKey, editKeyStatus, editAccessStatus, checkingKey, error, canEdit: editKeyStatus === "valid" && editAccessStatus === "available", verify: () => verify(editKey), clear }
}

function resolveStatus(configured: boolean, valid: boolean, key: string): EditKeyStatus {
  if (!configured) return "missing"
  if (valid) return "valid"
  return key ? "invalid" : "unchecked"
}

import { useEffect, useMemo, useState } from "react"
import { checkAdminEditAccess, getAdminOverview, verifyAdminEditKey } from "~/api/admin/client"
import type { AdminEditAccessStatus, AdminOverview, AdminSection, EditKeyStatus } from "~/domain/admin/types"

const EDIT_KEY_STORAGE = "hal-admin-edit-key"

export function useAdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard")
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [editKey, setEditKey] = useState("")
  const [editKeyStatus, setEditKeyStatus] = useState<EditKeyStatus>("unchecked")
  const [editAccessStatus, setEditAccessStatus] = useState<AdminEditAccessStatus>("unchecked")
  const [loading, setLoading] = useState(true)
  const [checkingKey, setCheckingKey] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedKey = window.sessionStorage.getItem(EDIT_KEY_STORAGE) ?? ""
    setEditKey(storedKey)
    void loadOverview(storedKey)
  }, [])

  const canEdit = editKeyStatus === "valid" && editAccessStatus === "available"
  const shellState = useMemo(
    () => ({
      activeSection,
      canEdit,
      checkingKey,
      editKey,
      editKeyStatus,
      editAccessStatus,
      error,
      loading,
      overview,
      sidebarCollapsed,
    }),
    [activeSection, canEdit, checkingKey, editAccessStatus, editKey, editKeyStatus, error, loading, overview, sidebarCollapsed],
  )

  async function loadOverview(key = editKey) {
    setLoading(true)
    setError("")
    try {
      const data = await getAdminOverview(key)
      setOverview(data)
      const nextStatus = resolveStatus(data.editKey.configured, data.editKey.valid, key)
      setEditKeyStatus(nextStatus)
      if (nextStatus === "valid") {
        await checkAdminEditAccess(key)
        setEditAccessStatus("available")
      } else if (key) {
        setEditAccessStatus("blocked")
      } else {
        setEditAccessStatus("unchecked")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "管理情報の読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  async function verifyEditKey() {
    setCheckingKey(true)
    setError("")
    try {
      const result = await verifyAdminEditKey(editKey)
      setEditKeyStatus(resolveStatus(result.configured, result.valid, editKey))
      if (result.valid) {
        await checkAdminEditAccess(editKey)
        setEditAccessStatus("available")
        window.sessionStorage.setItem(EDIT_KEY_STORAGE, editKey)
      } else {
        setEditAccessStatus("blocked")
        window.sessionStorage.removeItem(EDIT_KEY_STORAGE)
      }
    } catch (err) {
      setEditKeyStatus("invalid")
      setEditAccessStatus("blocked")
      setError(err instanceof Error ? err.message : "編集キーの確認に失敗しました")
    } finally {
      setCheckingKey(false)
    }
  }

  function clearEditKey() {
    setEditKey("")
    setEditKeyStatus("unchecked")
    setEditAccessStatus("unchecked")
    window.sessionStorage.removeItem(EDIT_KEY_STORAGE)
  }

  return {
    ...shellState,
    actions: {
      clearEditKey,
      loadOverview,
      setActiveSection,
      setEditKey,
      setSidebarCollapsed,
      verifyEditKey,
    },
  }
}

function resolveStatus(configured: boolean, valid: boolean, key: string): EditKeyStatus {
  if (!configured) return "missing"
  if (valid) return "valid"
  return key ? "invalid" : "unchecked"
}
